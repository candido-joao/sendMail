"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Carregando…
          </p>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = searchParams.get("token");

    const result = token
      ? fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).then(async (res) => ({
          ok: res.ok,
          error: (await res.json()).error as string | undefined,
        }))
      : Promise.resolve({ ok: false, error: "Link inválido." });

    result
      .then(({ ok, error: apiError }) => {
        if (cancelled) return;
        if (!ok) {
          setError(apiError ?? "Falha ao confirmar e-mail.");
          setStatus("error");
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Falha ao confirmar e-mail.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Confirmação de e-mail
      </h1>
      {status === "loading" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Confirmando…
        </p>
      )}
      {status === "success" && (
        <>
          <p className="mb-4 text-sm text-green-600">
            E-mail confirmado com sucesso! Você já pode entrar.
          </p>
          <Link href="/login" className="text-sm font-medium underline">
            Ir para o login
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <Link href="/login" className="text-sm font-medium underline">
            Voltar para o login
          </Link>
        </>
      )}
    </Card>
  );
}
