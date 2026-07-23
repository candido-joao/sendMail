import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, rateLimitAttempts } from "@/lib/db/schema";
import { getFullSession, clearSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { clearTrustedDeviceCookie } from "@/lib/auth/trusted-device";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { deleteAccountSchema } from "@/lib/validators";

const DELETE_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxAttempts: 5 };

export async function DELETE(req: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rateLimitKey = `delete-account:${user.id}`;
  const allowed = await checkRateLimit(rateLimitKey, DELETE_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const validPassword = await verifyPassword(
    parsed.data.password,
    user.passwordHash
  );
  if (!validPassword) {
    await recordAttempt(rateLimitKey, false);
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  await recordAttempt(rateLimitKey, true);

  await db
    .delete(rateLimitAttempts)
    .where(
      or(
        eq(rateLimitAttempts.key, `login:${user.email}`),
        eq(rateLimitAttempts.key, `totp:${user.id}`),
        eq(rateLimitAttempts.key, `password-change:${user.id}`),
        eq(rateLimitAttempts.key, rateLimitKey)
      )
    );

  await db.delete(users).where(eq(users.id, user.id));

  await clearSessionCookie();
  await clearTrustedDeviceCookie();

  return NextResponse.json({ ok: true });
}
