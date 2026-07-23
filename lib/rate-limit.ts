import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitAttempts } from "@/lib/db/schema";

type RateLimitOptions = {
  windowMs: number;
  maxAttempts: number;
};

/** Returns true if the caller is still allowed to attempt the action. */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions
): Promise<boolean> {
  const since = new Date(Date.now() - opts.windowMs);
  const recentFailures = await db
    .select()
    .from(rateLimitAttempts)
    .where(
      and(
        eq(rateLimitAttempts.key, key),
        gt(rateLimitAttempts.createdAt, since),
        eq(rateLimitAttempts.success, false)
      )
    );
  return recentFailures.length < opts.maxAttempts;
}

export async function recordAttempt(
  key: string,
  success: boolean
): Promise<void> {
  await db.insert(rateLimitAttempts).values({ key, success });
  if (success) {
    await db
      .delete(rateLimitAttempts)
      .where(
        and(
          eq(rateLimitAttempts.key, key),
          eq(rateLimitAttempts.success, false)
        )
      );
  }
}
