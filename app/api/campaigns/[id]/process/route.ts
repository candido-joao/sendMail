import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, sendQueue, sendSettings, defaultEmailBody, clients } from "@/lib/db/schema";
import { getFullSession } from "@/lib/auth/session";
import { decrypt } from "@/lib/crypto";
import { sendSingleEmail } from "@/lib/email/send";
import { getCampaignSnapshot } from "@/lib/campaigns";

const MIN_INTERVAL_MS = 400;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id: campaignId } = await params;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, session.userId)))
    .limit(1);
  if (!campaign) {
    return NextResponse.json(
      { error: "Campanha não encontrada." },
      { status: 404 }
    );
  }

  if (campaign.status === "completed") {
    const snapshot = await getCampaignSnapshot(campaignId);
    return NextResponse.json({ ...snapshot, done: true });
  }

  if (
    campaign.lastProcessedAt &&
    Date.now() - campaign.lastProcessedAt.getTime() < MIN_INTERVAL_MS
  ) {
    const snapshot = await getCampaignSnapshot(campaignId);
    return NextResponse.json({ ...snapshot, done: false });
  }

  await db
    .update(campaigns)
    .set({ lastProcessedAt: new Date() })
    .where(eq(campaigns.id, campaignId));

  const claimed = await db.execute<{ id: string; client_id: string }>(sql`
    UPDATE send_queue
    SET status = 'sending'
    WHERE id = (
      SELECT id FROM send_queue
      WHERE campaign_id = ${campaignId} AND status = 'pending'
      ORDER BY id
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, client_id
  `);

  const claimedRow = claimed.rows[0];

  if (!claimedRow) {
    const remainingResult = await db.execute<{ count: string }>(sql`
      SELECT count(*)::text AS count FROM send_queue
      WHERE campaign_id = ${campaignId} AND status IN ('pending', 'sending')
    `);
    const remaining = remainingResult.rows[0];

    if (Number(remaining?.count ?? 0) === 0) {
      await db
        .update(campaigns)
        .set({ status: "completed" })
        .where(eq(campaigns.id, campaignId));
      const snapshot = await getCampaignSnapshot(campaignId);
      return NextResponse.json({ ...snapshot, done: true });
    }

    const snapshot = await getCampaignSnapshot(campaignId);
    return NextResponse.json({ ...snapshot, done: false });
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, claimedRow.client_id))
    .limit(1);

  const [settings] = await db
    .select()
    .from(sendSettings)
    .where(eq(sendSettings.userId, session.userId))
    .limit(1);

  const [body] = await db
    .select()
    .from(defaultEmailBody)
    .where(eq(defaultEmailBody.userId, session.userId))
    .limit(1);

  if (!client || !settings?.gmailUser || !settings.gmailAppPasswordEncrypted) {
    await db
      .update(sendQueue)
      .set({
        status: "failed",
        errorMessage: "Configuração de envio (Gmail) incompleta.",
      })
      .where(eq(sendQueue.id, claimedRow.id));
  } else {
    try {
      const gmailAppPassword = decrypt(settings.gmailAppPasswordEncrypted);
      await sendSingleEmail({
        gmailUser: settings.gmailUser,
        gmailAppPassword,
        senderName: settings.senderName,
        to: client.email,
        subject: body?.subject ?? "",
        text: body?.bodyText ?? "",
      });
      await db
        .update(sendQueue)
        .set({ status: "sent", sentAt: new Date(), errorMessage: null })
        .where(eq(sendQueue.id, claimedRow.id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha ao enviar e-mail.";
      await db
        .update(sendQueue)
        .set({ status: "failed", errorMessage: message.slice(0, 500) })
        .where(eq(sendQueue.id, claimedRow.id));
    }
  }

  const snapshot = await getCampaignSnapshot(campaignId);
  return NextResponse.json({ ...snapshot, done: false });
}
