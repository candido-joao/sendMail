import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export type SendEmailParams = {
  gmailUser: string;
  gmailAppPassword: string;
  senderName: string | null;
  to: string;
  subject: string;
  text: string;
};

export async function sendSingleEmail(params: SendEmailParams): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: params.gmailUser,
      pass: params.gmailAppPassword,
    },
  });

  const from = params.senderName
    ? `"${params.senderName}" <${params.gmailUser}>`
    : params.gmailUser;

  await transporter.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
}

/**
 * Transactional emails (account verification) use a dedicated system Gmail
 * account, never a user's own send_settings — those aren't configured yet
 * at signup time. Falls back to logging the link when unconfigured, so
 * local dev works without a real system mailbox.
 */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  if (!env.SYSTEM_EMAIL_USER || !env.SYSTEM_EMAIL_APP_PASSWORD) {
    console.warn(
      `[dev] SYSTEM_EMAIL_USER not configured — verification link for ${params.to}: ${params.verifyUrl}`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.SYSTEM_EMAIL_USER,
      pass: env.SYSTEM_EMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: env.SYSTEM_EMAIL_USER,
    to: params.to,
    subject: "Confirme seu e-mail — SendMail",
    text: `Olá, ${params.name}!\n\nConfirme seu e-mail para ativar sua conta:\n${params.verifyUrl}\n\nEste link expira em 24 horas.`,
  });
}
