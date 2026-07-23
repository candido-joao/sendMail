"use client";

import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

async function addClient(body: { name: string; email: string }) {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao adicionar cliente.");
  return data.client;
}

export function ClientForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setName("");
      setEmail("");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({ name, email });
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
      <Button type="submit" variant="secondary" disabled={mutation.isPending}>
        Adicionar
      </Button>
      {mutation.isError && (
        <p className="w-full text-sm text-red-600">{mutation.error.message}</p>
      )}
    </form>
  );
}
