export type Client = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type Props = {
  clients: Client[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

export function ClientList({ clients, selectedIds, onToggle }: Props) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhum cliente cadastrado ainda.
      </p>
    );
  }

  return (
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
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {client.name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {client.email}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
