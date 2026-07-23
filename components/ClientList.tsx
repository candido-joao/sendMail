export type Client = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

type Props = {
  clients: Client[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
};

export function ClientList({
  clients,
  selectedIds,
  onToggle,
  onToggleAll,
}: Props) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhum cliente cadastrado ainda.
      </p>
    );
  }

  const allSelected = selectedIds.size === clients.length;

  return (
    <div>
      <label className="flex items-center gap-3 border-b border-zinc-200 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="h-4 w-4"
        />
        Selecionar todos
      </label>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={selectedIds.has(client.id)}
              onChange={() => onToggle(client.id)}
              className="h-4 w-4"
            />
            <div className="min-w-0 flex-1">
              {client.name && (
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {client.name}
                </p>
              )}
              <p
                className={
                  client.name
                    ? "truncate text-xs text-zinc-500 dark:text-zinc-400"
                    : "truncate text-sm font-medium text-zinc-900 dark:text-zinc-50"
                }
              >
                {client.email}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
