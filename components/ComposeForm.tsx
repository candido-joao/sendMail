"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const SAVE_DEBOUNCE_MS = 800;

type EmailBody = { subject: string; bodyText: string };

async function fetchEmailBody(): Promise<EmailBody> {
  const res = await fetch("/api/email-body");
  return res.json();
}

async function saveEmailBody(body: EmailBody): Promise<void> {
  await fetch("/api/email-body", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function ComposeForm() {
  const { data } = useQuery({
    queryKey: ["email-body"],
    queryFn: fetchEmailBody,
  });
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [loadedData, setLoadedData] = useState<EmailBody | undefined>(
    undefined
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMutation = useMutation({ mutationFn: saveEmailBody });
  const loaded = loadedData !== undefined;

  if (data && data !== loadedData) {
    setLoadedData(data);
    setSubject(data.subject ?? "");
    setBodyText(data.bodyText ?? "");
  }

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveMutation.mutate(
        { subject, bodyText },
        { onSuccess: () => setSaveState("saved") }
      );
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [subject, bodyText, loaded, saveMutation]);

  function handleSubjectChange(value: string) {
    setSubject(value);
    if (loaded) setSaveState("saving");
  }

  function handleBodyChange(value: string) {
    setBodyText(value);
    if (loaded) setSaveState("saving");
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          E-mail padrão
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {saveState === "saving" && "Salvando…"}
          {saveState === "saved" && "Salvo"}
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Assunto
          </label>
          <Input
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
            Corpo
          </label>
          <textarea
            value={bodyText}
            onChange={(e) => handleBodyChange(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>
    </Card>
  );
}
