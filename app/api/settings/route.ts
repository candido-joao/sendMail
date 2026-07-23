import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendSettings } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/validators";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(sendSettings)
    .where(eq(sendSettings.userId, session.userId))
    .limit(1);

  return NextResponse.json({
    gmailUser: row?.gmailUser ?? null,
    senderName: row?.senderName ?? null,
    hasAppPassword: Boolean(row?.gmailAppPasswordEncrypted),
  });
}

export async function PUT(req: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const updates: {
    gmailUser?: string;
    senderName?: string;
    gmailAppPasswordEncrypted?: string;
  } = {};

  if (parsed.data.gmailUser !== undefined) {
    updates.gmailUser = parsed.data.gmailUser;
  }
  if (parsed.data.senderName !== undefined) {
    updates.senderName = parsed.data.senderName;
  }
  if (parsed.data.gmailAppPassword !== undefined) {
    updates.gmailAppPasswordEncrypted = encrypt(parsed.data.gmailAppPassword);
  }

  await db
    .insert(sendSettings)
    .values({ userId: session.userId, ...updates })
    .onConflictDoUpdate({
      target: sendSettings.userId,
      set: updates,
    });

  return NextResponse.json({ ok: true });
}
