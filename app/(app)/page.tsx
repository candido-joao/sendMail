"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ComposeForm } from "@/components/ComposeForm";
import { ClientForm } from "@/components/ClientForm";
import { ClientList, type Client } from "@/components/ClientList";
import { QueuePanel } from "@/components/QueuePanel";
import { GmailTutorialModal } from "@/components/GmailTutorialModal";

async function fetchClients(): Promise<Client[]> {
  const res = await fetch("/api/clients");
  const data = await res.json();
  return data.clients ?? [];
}

async function fetchActiveCampaignId(): Promise<string | null> {
  const res = await fetch("/api/campaigns");
  const data = await res.json();
  return data.campaign?.id ?? null;
}

async function startCampaign(
  clientIds: string[]
): Promise<{ campaignId: string; alreadyRunning: boolean }> {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientIds }),
  });
  const data = await res.json();
  if (res.status === 409 && data.campaignId) {
    return { campaignId: data.campaignId, alreadyRunning: true };
  }
  if (!res.ok) throw new Error(data.error ?? "Falha ao iniciar disparo.");
  return { campaignId: data.campaignId, alreadyRunning: false };
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showGmailTutorial, setShowGmailTutorial] = useState(
    () => searchParams.get("gmailTutorial") === "1"
  );

  function handleCloseGmailTutorial() {
    setShowGmailTutorial(false);
    router.replace("/");
  }

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
  const { data: initialCampaignId } = useQuery({
    queryKey: ["active-campaign"],
    queryFn: fetchActiveCampaignId,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(
    null
  );
  const [seededValue, setSeededValue] = useState<string | null | undefined>(
    undefined
  );
  const startMutation = useMutation({ mutationFn: startCampaign });

  if (initialCampaignId !== undefined && initialCampaignId !== seededValue) {
    setSeededValue(initialCampaignId);
    setActiveCampaignId(initialCampaignId);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === clients.length
        ? new Set()
        : new Set(clients.map((c) => c.id))
    );
  }

  function handleStart() {
    startMutation.mutate(Array.from(selectedIds), {
      onSuccess: (result) => {
        setActiveCampaignId(result.campaignId);
        if (!result.alreadyRunning) setSelectedIds(new Set());
      },
    });
  }

  function handleCampaignDone() {
    setActiveCampaignId(null);
  }

  return (
    <div className="space-y-6">
      {showGmailTutorial && (
        <GmailTutorialModal onClose={handleCloseGmailTutorial} />
      )}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <ComposeForm />
        </div>
        <div className="lg:sticky lg:top-4 lg:w-64 lg:shrink-0">
          <Card>
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
              {selectedIds.size} clientes selecionados
            </p>
            <Button
              onClick={handleStart}
              disabled={
                startMutation.isPending ||
                selectedIds.size === 0 ||
                activeCampaignId !== null
              }
              className="w-full"
            >
              {startMutation.isPending ? "Enviando…" : "Enviar"}
            </Button>
            {startMutation.isError && (
              <p className="mt-3 text-sm text-red-600">
                {startMutation.error.message}
              </p>
            )}
            {activeCampaignId && (
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Fila de envio
                </h2>
                <QueuePanel
                  campaignId={activeCampaignId}
                  onDone={handleCampaignDone}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Clientes
        </h2>
        <div className="mb-4">
          <ClientForm />
        </div>
        <ClientList
          clients={clients}
          selectedIds={selectedIds}
          onToggle={toggleSelected}
          onToggleAll={toggleSelectAll}
        />
      </Card>
    </div>
  );
}
