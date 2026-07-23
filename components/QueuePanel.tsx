"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";

type QueueItem = {
  id: string;
  clientId: string;
  clientName: string | null;
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

async function processTick(campaignId: string): Promise<Snapshot> {
  const res = await fetch(`/api/campaigns/${campaignId}/process`, {
    method: "POST",
  });
  return res.json();
}

export function QueuePanel({
  campaignId,
  onDone,
}: {
  campaignId: string;
  onDone: () => void;
}) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const { data: snapshot } = useQuery({
    queryKey: ["campaign-process", campaignId],
    queryFn: () => processTick(campaignId),
    refetchInterval: (query) =>
      query.state.data?.done ? false : POLL_INTERVAL_MS,
  });

  const notifiedRef = useRef(false);
  useEffect(() => {
    if (snapshot?.done && !notifiedRef.current) {
      notifiedRef.current = true;
      onDoneRef.current();
    }
  }, [snapshot?.done]);

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
  const visibleItems = snapshot.items.filter((i) => i.status !== "sent");

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {processedCount} / {snapshot.items.length} processados
        {snapshot.done && " — concluído"}
      </p>
      <ul className="max-h-64 space-y-0 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800">
        {visibleItems.length === 0 && (
          <li className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
            Tudo enviado.
          </li>
        )}
        {visibleItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0 flex-1">
              {item.clientName && (
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.clientName}
                </p>
              )}
              <p
                className={
                  item.clientName
                    ? "truncate text-xs text-zinc-500 dark:text-zinc-400"
                    : "truncate text-sm font-medium text-zinc-900 dark:text-zinc-50"
                }
              >
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
