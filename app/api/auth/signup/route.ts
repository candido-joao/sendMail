import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, defaultEmailBody, sendSettings } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { generateVerificationToken } from "@/lib/auth/email-verification";
import { sendVerificationEmail } from "@/lib/email/send";
import { signupSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já está cadastrado." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const { token, tokenHash, expiresAt } = generateVerificationToken();

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    })
    .returning({ id: users.id });

  await db.insert(defaultEmailBody).values({ userId: user.id });
  await db.insert(sendSettings).values({ userId: user.id });

  const origin = new URL(req.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  await sendVerificationEmail({ to: email, name, verifyUrl });

  return NextResponse.json({ email });
}
