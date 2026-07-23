import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, clients, sendQueue } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { startCampaignSchema } from "@/lib/validators";

export async function GET() {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [running] = await db
    .select()
    .from(campaigns)
    .where(
      and(eq(campaigns.userId, session.userId), eq(campaigns.status, "running"))
    )
    .limit(1);

  return NextResponse.json({ campaign: running ?? null });
}

export async function POST(req: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = startCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const [existingRunning] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(
      and(eq(campaigns.userId, session.userId), eq(campaigns.status, "running"))
    )
    .limit(1);
  if (existingRunning) {
    return NextResponse.json(
      { error: "Já existe uma campanha em andamento.", campaignId: existingRunning.id },
      { status: 409 }
    );
  }

  const ownedClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.userId, session.userId),
        inArray(clients.id, parsed.data.clientIds)
      )
    );

  if (ownedClients.length !== parsed.data.clientIds.length) {
    return NextResponse.json(
      { error: "Um ou mais clientes são inválidos." },
      { status: 400 }
    );
  }

  const [campaign] = await db
    .insert(campaigns)
    .values({ userId: session.userId, status: "running" })
    .returning();

  await db.insert(sendQueue).values(
    ownedClients.map((c) => ({
      campaignId: campaign.id,
      clientId: c.id,
      status: "pending" as const,
    }))
  );

  return NextResponse.json({ campaignId: campaign.id }, { status: 201 });
}
