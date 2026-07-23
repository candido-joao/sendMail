type Status = "pending" | "sending" | "sent" | "failed";

const statusClasses: Record<Status, string> = {
  pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  sending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  sent: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const statusLabels: Record<Status, string> = {
  pending: "Pendente",
  sending: "Enviando…",
  sent: "Enviado",
  failed: "Falhou",
};

export function Badge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
