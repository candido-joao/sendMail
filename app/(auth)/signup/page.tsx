"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao cadastrar.");
        return;
      }
      setSubmittedEmail(data.email);
    } finally {
      setLoading(false);
    }
  }

  if (submittedEmail) {
    return (
      <Card>
        <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Confirme seu e-mail
        </h1>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Enviamos um link de confirmação para <strong>{submittedEmail}</strong>.
          Confirme para poder entrar pela primeira vez.
        </p>
        <Link href="/login" className="text-sm font-medium underline">
          Ir para o login
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Criar conta
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Nome
          </label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            E-mail
          </label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Senha (mínimo 8 caracteres)
          </label>
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando…" : "Criar conta"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
