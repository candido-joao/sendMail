"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function NavBar({ name }: { name: string }) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-zinc-900 dark:text-zinc-50">
            SendMail
          </Link>
          <Link
            href="/settings"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Configurações
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>{name}</span>
          <button
            onClick={() => mutation.mutate()}
            className="font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
