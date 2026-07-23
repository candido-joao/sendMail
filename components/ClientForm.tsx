"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Client } from "@/components/ClientList";

export function ClientForm({ onAdded }: { onAdded: (client: Client) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao adicionar cliente.");
        return;
      }
      onAdded(data.client);
      setName("");
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[140px]">
        <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
          Nome (opcional)
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">
          E-mail
        </label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={loading}>
        Adicionar
      </Button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
