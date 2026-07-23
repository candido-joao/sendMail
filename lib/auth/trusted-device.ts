import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { trustedDevices } from "@/lib/db/schema";

export const TRUSTED_DEVICE_COOKIE_NAME = "trusted_device";
const TRUSTED_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function isDeviceTrusted(userId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
  if (!token) return false;

  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.tokenHash, tokenHash),
        gt(trustedDevices.expiresAt, new Date())
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function markDeviceTrusted(
  userId: string,
  userAgent: string | null
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + TRUSTED_DEVICE_MAX_AGE_SECONDS * 1000
  );

  await db.insert(trustedDevices).values({
    userId,
    tokenHash,
    userAgent,
    expiresAt,
  });

  const store = await cookies();
  store.set(TRUSTED_DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS,
  });
}
