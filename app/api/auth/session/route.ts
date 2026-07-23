import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, clearSessionCookie } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      totpEnabled: users.totpEnabled,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    await clearSessionCookie();
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    totpEnabled: user.totpEnabled,
    scope: session.scope,
  });
}
