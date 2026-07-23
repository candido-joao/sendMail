"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <GmailSettingsCard />
      <ChangePasswordCard />
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
          <Input
            type="password"
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
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao trocar senha.");
        return;
      }
      setMessage("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Trocar senha de login
      </h2>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Sempre exige um código do seu aplicativo autenticador, mesmo neste
        dispositivo.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Senha atual
          </label>
          <Input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Nova senha
          </label>
          <Input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Código 2FA
          </label>
          <Input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Trocar senha"}
        </Button>
      </form>
    </Card>
  );
}
