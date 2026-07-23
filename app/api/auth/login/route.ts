import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { isDeviceTrusted } from "@/lib/auth/trusted-device";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";

const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxAttempts: 5 };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const rateLimitKey = `login:${email}`;

  const allowed = await checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    await recordAttempt(rateLimitKey, false);
    return NextResponse.json(
      { error: "E-mail ou senha inválidos." },
      { status: 401 }
    );
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    await recordAttempt(rateLimitKey, false);
    return NextResponse.json(
      { error: "E-mail ou senha inválidos." },
      { status: 401 }
    );
  }

  await recordAttempt(rateLimitKey, true);

  if (!user.totpEnabled) {
    await setSessionCookie({ userId: user.id, scope: "pending_totp" });
    return NextResponse.json({ next: "totp-setup" });
  }

  const trusted = await isDeviceTrusted(user.id);

  if (trusted) {
    await setSessionCookie({ userId: user.id, scope: "full" });
    return NextResponse.json({ next: "home" });
  }

  await setSessionCookie({ userId: user.id, scope: "pending_totp" });
  return NextResponse.json({ next: "totp-setup" });
}
