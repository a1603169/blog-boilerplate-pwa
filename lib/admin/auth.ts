import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-user session for /admin.
 *
 * A password check plus an HMAC-signed cookie. There is one author, so a full
 * identity provider would be more moving parts than the problem needs — but the
 * cookie is signed so it cannot be forged by editing it client-side.
 */

const COOKIE = "admin_session";
/**
 * Readable by client JS on purpose. It grants nothing — it only tells the header
 * whether to show an Admin link. The real session cookie is httpOnly, so the nav
 * cannot ask about it directly, and reading cookies in the root layout would make
 * every page dynamic and lose the 246 prerendered posts.
 */
const HINT_COOKIE = "admin_hint";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it in Vercel → Settings → Environment Variables (and .env.local for dev).`,
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", requiredEnv("ADMIN_SECRET")).update(payload).digest("hex");
}

/** Constant-time compare so a wrong password cannot be narrowed down by timing. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Password sign-in is DEVELOPMENT ONLY.
 *
 * In production, admin access requires proving you are the GitHub account named in
 * ADMIN_GITHUB_LOGIN. A password is a shared secret that can leak and grants access
 * to anyone holding it; a GitHub identity is tied to the account and whatever 2FA
 * protects it.
 *
 * It survives locally only because an OAuth App permits a single callback URL, so a
 * production app cannot authorise `localhost`. Rather than force a second OAuth App
 * before you can edit anything on your own machine, the password stays for dev.
 */
export function isPasswordLoginAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function checkPassword(candidate: string): boolean {
  if (!isPasswordLoginAllowed()) return false;
  return safeEqual(candidate, requiredEnv("ADMIN_PASSWORD"));
}

export async function startSession(): Promise<void> {
  const expiresAt = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const store = await cookies();

  store.set(COOKIE, `${expiresAt}.${sign(expiresAt)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  store.set(HINT_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
  store.delete(HINT_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;

  return Number(expiresAt) > Date.now();
}

/**
 * Guard for every server action. Pages guard in the layout, but actions are
 * separate HTTP entry points and must check on their own.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) throw new Error("Not authenticated.");
}
