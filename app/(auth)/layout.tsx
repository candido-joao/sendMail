import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <p className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          SendMail
        </p>
        {children}
      </div>
    </div>
  );
}
