import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { clientSchema } from "@/lib/validators";
import { isUniqueViolation } from "@/lib/db/errors";

export async function GET() {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, session.userId))
    .orderBy(desc(clients.createdAt));

  return NextResponse.json({ clients: rows });
}

export async function POST(req: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const [client] = await db
      .insert(clients)
      .values({
        userId: session.userId,
        name: parsed.data.name,
        email: parsed.data.email,
      })
      .returning();

    return NextResponse.json({ client }, { status: 201 });
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "Este cliente já está cadastrado." },
        { status: 409 }
      );
    }
    throw err;
  }
}
