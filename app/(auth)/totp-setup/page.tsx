"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { TotpQrSetup } from "@/components/TotpQrSetup";

type Phase = "loading" | "setup" | "challenge" | "error";

export default function TotpSetupPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.status === 401) {
        router.replace("/login");
        return;
      }
      const session = await sessionRes.json();
      if (cancelled) return;

      if (session.scope === "full") {
        router.replace("/");
        return;
      }

      if (session.totpEnabled) {
        setPhase("challenge");
        return;
      }

      const setupRes = await fetch("/api/auth/totp/setup", { method: "POST" });
      const setupData = await setupRes.json();
      if (cancelled) return;
      if (!setupRes.ok) {
        setError(setupData.error ?? "Falha ao iniciar configuração de 2FA.");
        setPhase("error");
        return;
      }
      setQrDataUrl(setupData.qrDataUrl);
      setPhase("setup");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleVerified() {
    router.push("/");
    router.refresh();
  }

  return (
    <Card>
      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Verificação em duas etapas
      </h1>
      {phase === "loading" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Carregando…</p>
      )}
      {phase === "error" && <p className="text-sm text-red-600">{error}</p>}
      {phase === "setup" && (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Configuração obrigatória no primeiro acesso.
          </p>
          <TotpQrSetup qrDataUrl={qrDataUrl} onVerified={handleVerified} />
        </>
      )}
      {phase === "challenge" && (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Dispositivo não reconhecido. Digite o código do seu aplicativo
            autenticador.
          </p>
          <TotpQrSetup onVerified={handleVerified} />
        </>
      )}
    </Card>
  );
}
