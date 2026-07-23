import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/auth/totp";
import { markDeviceTrusted } from "@/lib/auth/trusted-device";
import { checkRateLimit, recordAttempt } from "@/lib/rate-limit";
import { totpCodeSchema } from "@/lib/validators";

const TOTP_RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxAttempts: 5 };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = totpCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const rateLimitKey = `totp:${session.userId}`;
  const allowed = await checkRateLimit(rateLimitKey, TOTP_RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user || !user.totpSecretEncrypted) {
    return NextResponse.json(
      { error: "Configuração de 2FA não encontrada." },
      { status: 400 }
    );
  }

  const secret = decryptTotpSecret(user.totpSecretEncrypted);
  const valid = await verifyTotpCode(secret, parsed.data.code);

  if (!valid) {
    await recordAttempt(rateLimitKey, false);
    return NextResponse.json({ error: "Código incorreto." }, { status: 401 });
  }

  await recordAttempt(rateLimitKey, true);

  if (!user.totpEnabled) {
    await db
      .update(users)
      .set({ totpEnabled: true })
      .where(eq(users.id, user.id));
  }

  const userAgent = req.headers.get("user-agent");
  await markDeviceTrusted(user.id, userAgent);
  await setSessionCookie({ userId: user.id, scope: "full" });

  return NextResponse.json({ ok: true });
}
