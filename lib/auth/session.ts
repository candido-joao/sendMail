import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.SESSION_SECRET);

export const SESSION_COOKIE_NAME = "session";

export type SessionScope = "pending_totp" | "full";

export type SessionPayload = {
  userId: string;
  scope: SessionScope;
};

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string" || typeof payload.scope !== "string") {
      return null;
    }
    return { userId: payload.userId, scope: payload.scope as SessionScope };
  } catch {
    return null;
  }
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getFullSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.scope !== "full") return null;
  return session;
}
