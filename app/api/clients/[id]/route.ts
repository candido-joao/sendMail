import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { clientSchema } from "@/lib/validators";
import { isUniqueViolation } from "@/lib/db/errors";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(clients)
      .set({ name: parsed.data.name, email: parsed.data.email })
      .where(and(eq(clients.id, id), eq(clients.userId, session.userId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ client: updated });
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const [deleted] = await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, session.userId)))
    .returning({ id: clients.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Cliente não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
