"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { TotpQrSetup } from "@/components/TotpQrSetup";

type SessionInfo =
  | { authenticated: true; scope: string; totpEnabled: boolean }
  | { authenticated: false };

async function fetchSession(): Promise<SessionInfo> {
  const res = await fetch("/api/auth/session");
  if (res.status === 401) return { authenticated: false };
  const data = await res.json();
  return {
    authenticated: true,
    scope: data.scope,
    totpEnabled: data.totpEnabled,
  };
}

async function startTotpSetup(): Promise<{ qrDataUrl: string }> {
  const res = await fetch("/api/auth/totp/setup", { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Falha ao iniciar configuração de 2FA.");
  }
  return data;
}

export default function TotpSetupPage() {
  const router = useRouter();
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
  });
  const setupMutation = useMutation({ mutationFn: startTotpSetup });
  const { mutate: startSetup } = setupMutation;
  const setupStartedRef = useRef(false);

  useEffect(() => {
    if (!session) return;
    if (!session.authenticated) {
      router.replace("/login");
      return;
    }
    if (session.scope === "full") {
      router.replace("/");
      return;
    }
    if (!session.totpEnabled && !setupStartedRef.current) {
      setupStartedRef.current = true;
      startSetup();
    }
  }, [session, router, startSetup]);

  function handleVerified() {
    router.push("/");
    router.refresh();
  }

  const showSetup =
    session?.authenticated === true &&
    session.scope !== "full" &&
    !session.totpEnabled;
  const showChallenge =
    session?.authenticated === true &&
    session.scope !== "full" &&
    session.totpEnabled;

  return (
    <Card>
      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Verificação em duas etapas
      </h1>
      {(!session || (showSetup && setupMutation.isPending)) && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Carregando…
        </p>
      )}
      {showSetup && setupMutation.isError && (
        <p className="text-sm text-red-600">{setupMutation.error.message}</p>
      )}
      {showSetup && setupMutation.isSuccess && (
        <>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Configuração obrigatória no primeiro acesso.
          </p>
          <TotpQrSetup
            qrDataUrl={setupMutation.data.qrDataUrl}
            onVerified={handleVerified}
          />
        </>
      )}
      {showChallenge && (
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
