"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao cadastrar.");
        return;
      }
      router.push("/totp-setup");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Criar conta
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            E-mail
          </label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Senha (mínimo 8 caracteres)
          </label>
          <Input
            type="password"
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
