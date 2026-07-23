import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, defaultEmailBody, sendSettings } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { email, password } = parsed.data;

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
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id });

  await db.insert(defaultEmailBody).values({ userId: user.id });
  await db.insert(sendSettings).values({ userId: user.id });

  await setSessionCookie({ userId: user.id, scope: "pending_totp" });

  return NextResponse.json({ next: "totp-setup" });
}
