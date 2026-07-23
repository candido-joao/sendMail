import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, sendQueue, clients } from "@/lib/db/schema";

export type CampaignSnapshot = {
  id: string;
  status: "running" | "completed";
  items: {
    id: string;
    clientId: string;
    clientName: string | null;
    clientEmail: string;
    status: "pending" | "sending" | "sent" | "failed";
    errorMessage: string | null;
    sentAt: string | null;
  }[];
};

export async function getCampaignSnapshot(
  campaignId: string
): Promise<CampaignSnapshot | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  if (!campaign) return null;

  const rows = await db
    .select({
      id: sendQueue.id,
      clientId: sendQueue.clientId,
      status: sendQueue.status,
      errorMessage: sendQueue.errorMessage,
      sentAt: sendQueue.sentAt,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(sendQueue)
    .innerJoin(clients, eq(sendQueue.clientId, clients.id))
    .where(eq(sendQueue.campaignId, campaignId))
    .orderBy(sendQueue.id);

  return {
    id: campaign.id,
    status: campaign.status,
    items: rows.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      clientName: r.clientName,
      clientEmail: r.clientEmail,
      status: r.status,
      errorMessage: r.errorMessage,
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    })),
  };
}
