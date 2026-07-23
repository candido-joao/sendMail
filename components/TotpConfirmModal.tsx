"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  title?: string;
  description?: string;
  onConfirm: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
};

export function TotpConfirmModal({
  title = "Confirme com 2FA",
  description = "Digite o código do seu aplicativo autenticador para continuar.",
  onConfirm,
  onClose,
}: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onConfirm(code);
      if (!result.ok) {
        setError(result.error ?? "Código incorreto.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Confirmando…" : "Confirmar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
