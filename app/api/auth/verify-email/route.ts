import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashVerificationToken } from "@/lib/auth/email-verification";
import { verifyEmailSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }

  const tokenHash = hashVerificationToken(parsed.data.token);

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.emailVerificationTokenHash, tokenHash),
        gt(users.emailVerificationExpiresAt, new Date())
      )
    )
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Link inválido ou expirado." },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
