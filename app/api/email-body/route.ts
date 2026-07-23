import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { defaultEmailBody } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { emailBodySchema } from "@/lib/validators";

export async function GET() {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(defaultEmailBody)
    .where(eq(defaultEmailBody.userId, session.userId))
    .limit(1);

  return NextResponse.json({
    subject: row?.subject ?? "",
    bodyText: row?.bodyText ?? "",
  });
}

export async function PUT(req: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = emailBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  await db
    .insert(defaultEmailBody)
    .values({
      userId: session.userId,
      subject: parsed.data.subject,
      bodyText: parsed.data.bodyText,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: defaultEmailBody.userId,
      set: {
        subject: parsed.data.subject,
        bodyText: parsed.data.bodyText,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
