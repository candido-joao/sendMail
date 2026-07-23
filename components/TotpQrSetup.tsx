"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  qrDataUrl?: string | null;
  onVerified: () => void;
};

async function verifyTotp(code: string) {
  const res = await fetch("/api/auth/totp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Código incorreto.");
  return data;
}

export function TotpQrSetup({ qrDataUrl, onVerified }: Props) {
  const [code, setCode] = useState("");
  const mutation = useMutation({
    mutationFn: verifyTotp,
    onSuccess: onVerified,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(code);
  }

  return (
    <div className="space-y-4">
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Escaneie o QR code com seu aplicativo autenticador (Google
            Authenticator, Authy, etc.).
          </p>
          <Image
            src={qrDataUrl}
            alt="QR code para configurar 2FA"
            width={200}
            height={200}
            unoptimized
            className="rounded-md border border-zinc-200 dark:border-zinc-800"
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Código de 6 dígitos
          </label>
          <Input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        )}
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Verificando…" : "Confirmar"}
        </Button>
      </form>
    </div>
  );
}
