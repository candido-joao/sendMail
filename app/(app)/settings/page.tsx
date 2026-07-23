"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { TotpConfirmModal } from "@/components/TotpConfirmModal";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <GmailSettingsCard />
      <ChangePasswordCard />
      <DeleteAccountCard />
    </div>
  );
}

type Settings = {
  gmailUser: string | null;
  senderName: string | null;
  hasAppPassword: boolean;
};

async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/settings");
  return res.json();
}

async function saveSettings(body: Record<string, string>) {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao salvar.");
  return data;
}

function GmailSettingsCard() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [gmailUser, setGmailUser] = useState("");
  const [senderName, setSenderName] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [hasAppPassword, setHasAppPassword] = useState(false);
  const [loadedData, setLoadedData] = useState<Settings | undefined>(
    undefined
  );
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: saveSettings });

  if (data && data !== loadedData) {
    setLoadedData(data);
    setGmailUser(data.gmailUser ?? "");
    setSenderName(data.senderName ?? "");
    setHasAppPassword(Boolean(data.hasAppPassword));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const body: Record<string, string> = { gmailUser, senderName };
    if (gmailAppPassword.trim()) {
      body.gmailAppPassword = gmailAppPassword.trim();
    }
    mutation.mutate(body, {
      onSuccess: () => {
        if (gmailAppPassword.trim()) setHasAppPassword(true);
        setGmailAppPassword("");
        setMessage("Configurações salvas.");
      },
    });
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Envio (Gmail)
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            E-mail Gmail
          </label>
          <Input
            type="email"
            required
            value={gmailUser}
            onChange={(e) => setGmailUser(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Senha de app do Gmail{" "}
            {hasAppPassword && (
              <span className="text-zinc-400">(configurada — deixe em branco para manter)</span>
            )}
          </label>
          <PasswordInput
            placeholder={hasAppPassword ? "••••••••••••••••" : ""}
            value={gmailAppPassword}
            onChange={(e) => setGmailAppPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Nome do remetente
          </label>
          <Input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        )}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}

async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
  code: string;
}) {
  const res = await fetch("/api/settings/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao trocar senha.");
  return data;
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const mutation = useMutation({ mutationFn: changePassword });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setShowTotpModal(true);
  }

  async function handleConfirm(code: string) {
    try {
      await mutation.mutateAsync({ currentPassword, newPassword, code });
      setShowTotpModal(false);
      setMessage("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Falha ao trocar senha.",
      };
    }
  }

  function handleCloseModal() {
    setShowTotpModal(false);
    setError("Troca de senha cancelada: confirmação 2FA não concluída.");
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Trocar senha de login
      </h2>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Sempre exige confirmação por 2FA, mesmo neste dispositivo.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Senha atual
          </label>
          <PasswordInput
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Nova senha
          </label>
          <PasswordInput
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit">Trocar senha</Button>
      </form>
      {showTotpModal && (
        <TotpConfirmModal
          title="Confirme a troca de senha"
          description="Digite o código do seu aplicativo autenticador para concluir a troca de senha."
          onConfirm={handleConfirm}
          onClose={handleCloseModal}
        />
      )}
    </Card>
  );
}

async function deleteAccount(password: string) {
  const res = await fetch("/api/settings/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Falha ao excluir conta.");
  }
}

function DeleteAccountCard() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const mutation = useMutation({ mutationFn: deleteAccount });

  async function handleConfirm(password: string) {
    try {
      await mutation.mutateAsync(password);
      router.push("/signup");
      router.refresh();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Falha ao excluir conta.",
      };
    }
  }

  return (
    <Card className="border-red-300 dark:border-red-900">
      <h2 className="mb-1 text-lg font-semibold text-red-600">
        Excluir conta
      </h2>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Remove permanentemente seus dados, esta ação não pode ser desfeita.
      </p>
      <Button variant="danger" onClick={() => setShowModal(true)}>
        Excluir minha conta
      </Button>
      {showModal && (
        <DeleteAccountModal
          onConfirm={handleConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
    </Card>
  );
}
