import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ENCRYPTION_KEY: z
    .string()
    .refine((value) => {
      try {
        return Buffer.from(value, "base64").length === 32;
      } catch {
        return false;
      }
    }, "ENCRYPTION_KEY must be a base64 string decoding to exactly 32 bytes"),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters"),
  // Optional: dedicated Gmail account used only for transactional/system
  // emails (e.g. account verification), distinct from each user's own
  // send_settings (used for their campaigns). If unset, verification links
  // are logged to the server console instead of emailed — fine for local
  // dev, must be configured for production.
  SYSTEM_EMAIL_USER: z.string().optional(),
  SYSTEM_EMAIL_APP_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SYSTEM_EMAIL_USER: process.env.SYSTEM_EMAIL_USER,
  SYSTEM_EMAIL_APP_PASSWORD: process.env.SYSTEM_EMAIL_APP_PASSWORD,
});
