import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession, clearSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session || session.scope !== "full") {
    redirect("/totp-setup");
  }

  const [user] = await db
    .select({ totpEnabled: users.totpEnabled, name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    await clearSessionCookie();
    redirect("/login");
  }

  if (!user.totpEnabled) {
    redirect("/totp-setup");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <NavBar name={user.name} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
