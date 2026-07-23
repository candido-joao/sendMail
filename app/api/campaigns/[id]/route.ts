import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { getCampaignSnapshot } from "@/lib/campaigns";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const [owned] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, session.userId)))
    .limit(1);
  if (!owned) {
    return NextResponse.json(
      { error: "Campanha não encontrada." },
      { status: 404 }
    );
  }

  const snapshot = await getCampaignSnapshot(id);
  return NextResponse.json(snapshot);
}
