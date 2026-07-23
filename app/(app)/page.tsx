"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ComposeForm } from "@/components/ComposeForm";
import { ClientForm } from "@/components/ClientForm";
import { ClientList, type Client } from "@/components/ClientList";
import { QueuePanel } from "@/components/QueuePanel";

export default function HomePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(
    null
  );
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data.clients ?? []));

    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        if (data.campaign) setActiveCampaignId(data.campaign.id);
      });
  }, []);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.status === 409 && data.campaignId) {
        setActiveCampaignId(data.campaignId);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Falha ao iniciar disparo.");
        return;
      }
      setActiveCampaignId(data.campaignId);
      setSelectedIds(new Set());
    } finally {
      setStarting(false);
    }
  }

  function handleCampaignDone() {
    setActiveCampaignId(null);
  }

  return (
    <div className="space-y-6">
      <ComposeForm />

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Clientes
        </h2>
        <div className="mb-4">
          <ClientForm onAdded={(c) => setClients((prev) => [c, ...prev])} />
        </div>
        <ClientList
          clients={clients}
          selectedIds={selectedIds}
          onToggle={toggleSelected}
        />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Disparo
          </h2>
          <Button
            onClick={handleStart}
            disabled={
              starting || selectedIds.size === 0 || activeCampaignId !== null
            }
          >
            {starting
              ? "Iniciando…"
              : `Iniciar disparo para ${selectedIds.size} clientes`}
          </Button>
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {activeCampaignId && (
          <QueuePanel
            campaignId={activeCampaignId}
            onDone={handleCampaignDone}
          />
        )}
      </Card>
    </div>
  );
}
