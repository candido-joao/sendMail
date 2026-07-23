import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import {
  generateTotpSecret,
  encryptTotpSecret,
  generateTotpQrDataUrl,
} from "@/lib/auth/totp";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (user.totpEnabled) {
    return NextResponse.json(
      { error: "2FA já está configurado." },
      { status: 400 }
    );
  }

  const secret = generateTotpSecret();
  const secretEncrypted = encryptTotpSecret(secret);

  await db
    .update(users)
    .set({ totpSecretEncrypted: secretEncrypted })
    .where(eq(users.id, user.id));

  const qrDataUrl = await generateTotpQrDataUrl(user.email, secret);

  return NextResponse.json({ qrDataUrl });
}
