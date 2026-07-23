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
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
});
