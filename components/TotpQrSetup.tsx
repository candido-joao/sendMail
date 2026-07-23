"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  qrDataUrl?: string | null;
  onVerified: () => void;
};

export function TotpQrSetup({ qrDataUrl, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código incorreto.");
        return;
      }
      onVerified();
    } finally {
      setLoading(false);
    }
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verificando…" : "Confirmar"}
        </Button>
      </form>
    </div>
  );
}
