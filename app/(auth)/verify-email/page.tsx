"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

async function verifyEmail(token: string) {
  if (!token) throw new Error("Link inválido.");
  const res = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Falha ao confirmar e-mail.");
  return data;
}

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
  const mutation = useMutation({ mutationFn: verifyEmail });
  const { mutate: verify } = mutation;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    verify(searchParams.get("token") ?? "");
  }, [searchParams, verify]);

  return (
    <Card>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Confirmação de e-mail
      </h1>
      {mutation.isPending && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Confirmando…
        </p>
      )}
      {mutation.isSuccess && (
        <>
          <p className="mb-4 text-sm text-green-600">
            E-mail confirmado com sucesso! Você já pode entrar.
          </p>
          <Link href="/login" className="text-sm font-medium underline">
            Ir para o login
          </Link>
        </>
      )}
      {mutation.isError && (
        <>
          <p className="mb-4 text-sm text-red-600">{mutation.error.message}</p>
          <Link href="/login" className="text-sm font-medium underline">
            Voltar para o login
          </Link>
        </>
      )}
    </Card>
  );
}
