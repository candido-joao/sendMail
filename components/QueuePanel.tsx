"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";

type QueueItem = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: "pending" | "sending" | "sent" | "failed";
  errorMessage: string | null;
  sentAt: string | null;
};

type Snapshot = {
  id: string;
  status: "running" | "completed";
  items: QueueItem[];
  done: boolean;
};

const POLL_INTERVAL_MS = 700;

export function QueuePanel({
  campaignId,
  onDone,
}: {
  campaignId: string;
  onDone: () => void;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    let done = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      if (cancelled || done) return;
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/process`, {
          method: "POST",
        });
        if (res.ok) {
          const data: Snapshot = await res.json();
          if (!cancelled) setSnapshot(data);
          if (data.done) {
            done = true;
            onDoneRef.current();
            return;
          }
        }
      } catch {
        // transient network error: keep polling
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [campaignId]);

  if (!snapshot) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Carregando fila…
      </p>
    );
  }

  const processedCount = snapshot.items.filter(
    (i) => i.status === "sent" || i.status === "failed"
  ).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {processedCount} / {snapshot.items.length} processados
        {snapshot.done && " — concluído"}
      </p>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {snapshot.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {item.clientName}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {item.clientEmail}
              </p>
              {item.errorMessage && (
                <p className="truncate text-xs text-red-600">
                  {item.errorMessage}
                </p>
              )}
            </div>
            <Badge status={item.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
