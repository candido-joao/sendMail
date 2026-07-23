import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const campaignStatusEnum = pgEnum("campaign_status", [
  "running",
  "completed",
]);

// "sending" is a short-lived transient state used to atomically claim a row
// (via FOR UPDATE SKIP LOCKED) without holding a DB transaction open for the
// duration of the outbound SMTP call.
export const queueStatusEnum = pgEnum("queue_status", [
  "pending",
  "sending",
  "sent",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationTokenHash: text("email_verification_token_hash"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at", {
    withTimezone: true,
  }),
  totpSecretEncrypted: text("totp_secret_encrypted"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const trustedDevices = pgTable(
  "trusted_devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    userIdx: index("trusted_devices_user_id_idx").on(t.userId),
    tokenHashIdx: uniqueIndex("trusted_devices_token_hash_idx").on(
      t.tokenHash
    ),
  })
);

export const sendSettings = pgTable("send_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  gmailUser: varchar("gmail_user", { length: 255 }),
  gmailAppPasswordEncrypted: text("gmail_app_password_encrypted"),
  senderName: varchar("sender_name", { length: 255 }),
});

export const defaultEmailBody = pgTable("default_email_body", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull().default(""),
  bodyText: text("body_text").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userEmailIdx: uniqueIndex("clients_user_id_email_idx").on(
      t.userId,
      t.email
    ),
    userIdx: index("clients_user_id_idx").on(t.userId),
  })
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: campaignStatusEnum("status").notNull().default("running"),
    lastProcessedAt: timestamp("last_processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("campaigns_user_id_idx").on(t.userId),
  })
);

export const sendQueue = pgTable(
  "send_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    status: queueStatusEnum("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => ({
    campaignIdx: index("send_queue_campaign_id_idx").on(t.campaignId),
    campaignStatusIdx: index("send_queue_campaign_status_idx").on(
      t.campaignId,
      t.status
    ),
  })
);

export const rateLimitAttempts = pgTable(
  "rate_limit_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    success: boolean("success").notNull().default(false),
  },
  (t) => ({
    keyCreatedIdx: index("rate_limit_attempts_key_created_idx").on(
      t.key,
      t.createdAt
    ),
  })
);

export const usersRelations = relations(users, ({ many, one }) => ({
  trustedDevices: many(trustedDevices),
  clients: many(clients),
  campaigns: many(campaigns),
  sendSettings: one(sendSettings, {
    fields: [users.id],
    references: [sendSettings.userId],
  }),
  defaultEmailBody: one(defaultEmailBody, {
    fields: [users.id],
    references: [defaultEmailBody.userId],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  queueItems: many(sendQueue),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  items: many(sendQueue),
}));

export const sendQueueRelations = relations(sendQueue, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [sendQueue.campaignId],
    references: [campaigns.id],
  }),
  client: one(clients, {
    fields: [sendQueue.clientId],
    references: [clients.id],
  }),
}));
