"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  onClose: () => void;
};

export function GmailTutorialModal({ onClose }: Props) {
  const router = useRouter();

  function handleGoToSettings() {
    onClose();
    router.push("/settings");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Antes de enviar: configure sua senha de app do Gmail
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Para disparar e-mails pelo seu Gmail, o SendMail precisa de uma{" "}
          <strong>senha de app</strong> — não é a senha da sua conta Google.
          O Google não permite mais que aplicativos externos usem a senha
          normal para enviar e-mail via SMTP; a senha de app é uma credencial
          separada, específica para este uso, que pode ser revogada a
          qualquer momento sem afetar o login da sua conta.
        </p>

        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Como gerar uma
          </h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              Ative a verificação em duas etapas na sua conta Google (é
              exigida pelo Google para liberar senhas de app), em{" "}
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
              >
                myaccount.google.com/security
              </a>
            </li>
            <li>
              Acesse{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
              >
                myaccount.google.com/apppasswords
              </a>
            </li>
            <li>Dê um nome para identificar (ex.: &quot;SendMail&quot;) e clique em Gerar.</li>
            <li>
              Copie a senha de 16 caracteres exibida — ela só aparece uma
              vez.
            </li>
          </ol>
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Como configurar aqui
          </h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Abra Configurações → seção &quot;Envio (Gmail)&quot;.</li>
            <li>
              Preencha seu e-mail do Gmail e cole a senha de app gerada.
            </li>
            <li>Clique em Salvar.</li>
          </ol>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Configurar depois
          </Button>
          <Button onClick={handleGoToSettings}>Ir para Configurações</Button>
        </div>
      </div>
    </div>
  );
}
