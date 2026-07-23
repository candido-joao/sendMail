"use client";

import { useState, FormEvent } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

type Props = {
  onConfirm: (password: string) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
};

export function DeleteAccountModal({ onConfirm, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onConfirm(password);
      if (!result.ok) {
        setError(result.error ?? "Senha incorreta.");
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
          Excluir conta permanentemente
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Isso apaga sua conta, configurações de envio, 2FA, clientes e
          histórico de campanhas. Não pode ser desfeito. Digite sua senha
          para confirmar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha atual"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" disabled={loading}>
              {loading ? "Excluindo…" : "Excluir minha conta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
