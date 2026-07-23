import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { trustedDevices } from "@/lib/db/schema";
import { sha256Hex } from "@/lib/crypto";

export const TRUSTED_DEVICE_COOKIE_NAME = "trusted_device";
const TRUSTED_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

export async function isDeviceTrusted(userId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(TRUSTED_DEVICE_COOKIE_NAME)?.value;
  if (!token) return false;

  const tokenHash = sha256Hex(token);
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
  const tokenHash = sha256Hex(token);
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

export async function clearTrustedDeviceCookie(): Promise<void> {
  const store = await cookies();
  store.delete(TRUSTED_DEVICE_COOKIE_NAME);
}
