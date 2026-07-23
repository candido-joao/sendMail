"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const SAVE_DEBOUNCE_MS = 800;

export function ComposeForm() {
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/email-body")
      .then((res) => res.json())
      .then((data) => {
        setSubject(data.subject ?? "");
        setBodyText(data.bodyText ?? "");
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch("/api/email-body", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyText }),
      });
      setSaveState("saved");
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [subject, bodyText, loaded]);

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
