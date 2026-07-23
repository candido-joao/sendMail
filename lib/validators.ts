import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8).max(200);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export const clientSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
});

export const emailBodySchema = z.object({
  subject: z.string().max(998),
  bodyText: z.string().max(50000),
});

export const settingsSchema = z.object({
  gmailUser: emailSchema.optional(),
  gmailAppPassword: z.string().min(1).optional(),
  senderName: z.string().trim().max(255).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  code: z.string().regex(/^\d{6}$/),
});

export const startCampaignSchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1),
});
