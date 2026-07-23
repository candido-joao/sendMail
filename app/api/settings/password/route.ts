import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/auth/totp";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validators";

const TOTP_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxAttempts: 5 };

export async function PUT(req: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
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

  if (!user.totpEnabled || !user.totpSecretEncrypted) {
    return NextResponse.json(
      { error: "Configure o 2FA antes de trocar a senha." },
      { status: 400 }
    );
  }

  const rateLimitKey = `password-change:${user.id}`;
  const allowed = await checkRateLimit(rateLimitKey, TOTP_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const validPassword = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!validPassword) {
    await recordAttempt(rateLimitKey, false);
    return NextResponse.json(
      { error: "Senha atual incorreta." },
      { status: 401 }
    );
  }

  const secret = decryptTotpSecret(user.totpSecretEncrypted);
  const validCode = await verifyTotpCode(secret, parsed.data.code);
  if (!validCode) {
    await recordAttempt(rateLimitKey, false);
    return NextResponse.json({ error: "Código 2FA incorreto." }, { status: 401 });
  }

  await recordAttempt(rateLimitKey, true);

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
