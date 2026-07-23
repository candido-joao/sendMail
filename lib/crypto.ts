import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "base64");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    ciphertext.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

export function decrypt(stored: string): string {
  const key = getKey();
  const [ivB64, ciphertextB64, tagB64] = stored.split(":");
  if (!ivB64 || !ciphertextB64 || !tagB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
