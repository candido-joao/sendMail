import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { encrypt, decrypt } from "@/lib/crypto";

const ISSUER = "SendMail";

// Allow one 30s step of clock drift in either direction.
const EPOCH_TOLERANCE: [number, number] = [30, 30];

export function generateTotpSecret(): string {
  return generateSecret();
}

export function encryptTotpSecret(secret: string): string {
  return encrypt(secret);
}

export function decryptTotpSecret(encrypted: string): string {
  return decrypt(encrypted);
}

export async function generateTotpQrDataUrl(
  email: string,
  secret: string
): Promise<string> {
  const uri = generateURI({ issuer: ISSUER, label: email, secret });
  return QRCode.toDataURL(uri);
}

export async function verifyTotpCode(
  secret: string,
  token: string
): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const result = await verify({
    secret,
    token,
    epochTolerance: EPOCH_TOLERANCE,
  });
  return result.valid;
}
