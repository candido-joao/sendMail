import nodemailer from "nodemailer";

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
