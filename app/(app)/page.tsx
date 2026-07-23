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

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === clients.length ? new Set() : new Set(clients.map((c) => c.id))
    );
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
                starting || selectedIds.size === 0 || activeCampaignId !== null
              }
              className="w-full"
            >
              {starting ? "Enviando…" : "Enviar"}
            </Button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
          <ClientForm onAdded={(c) => setClients((prev) => [c, ...prev])} />
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
