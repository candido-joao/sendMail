"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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

function GmailSettingsCard() {
  const [gmailUser, setGmailUser] = useState("");
  const [senderName, setSenderName] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [hasAppPassword, setHasAppPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setGmailUser(data.gmailUser ?? "");
        setSenderName(data.senderName ?? "");
        setHasAppPassword(Boolean(data.hasAppPassword));
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, string> = { gmailUser, senderName };
      if (gmailAppPassword.trim()) {
        body.gmailAppPassword = gmailAppPassword.trim();
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      if (gmailAppPassword.trim()) setHasAppPassword(true);
      setGmailAppPassword("");
      setMessage("Configurações salvas.");
    } finally {
      setLoading(false);
    }
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </Card>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTotpModal, setShowTotpModal] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setShowTotpModal(true);
  }

  async function handleConfirm(code: string) {
    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Falha ao trocar senha." };
    }
    setShowTotpModal(false);
    setMessage("Senha alterada com sucesso.");
    setCurrentPassword("");
    setNewPassword("");
    return { ok: true };
  }

  function handleCloseModal() {
    // Closing without confirming means the password change never happens.
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

function DeleteAccountCard() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  async function handleConfirm(password: string) {
    const res = await fetch("/api/settings/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error ?? "Falha ao excluir conta." };
    }
    router.push("/signup");
    router.refresh();
    return { ok: true };
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
