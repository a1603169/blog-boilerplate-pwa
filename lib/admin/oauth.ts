import "server-only";

import { randomBytes } from "node:crypto";

/**
 * GitHub OAuth as a second way into /admin.
 *
 * Identity only. Commits keep using the fine-grained PAT in GITHUB_TOKEN, because
 * an OAuth App token carries the whole `repo` scope across every repository the
 * account can reach, while the PAT is scoped to this one repository's contents.
 * Signing in with GitHub therefore proves who you are; it does not widen what the
 * app can write.
 */

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

export const STATE_COOKIE = "admin_oauth_state";

/** OAuth is optional — the password form works without any of this configured. */
export function isOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_OAUTH_CLIENT_ID &&
      process.env.GITHUB_OAUTH_CLIENT_SECRET &&
      process.env.ADMIN_GITHUB_LOGIN,
  );
}

export function newState(): string {
  return randomBytes(16).toString("hex");
}

export function authorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    state,
    // Only the public profile is needed to confirm the username. No repo scope:
    // this token never writes anything.
    scope: "read:user",
    allow_signup: "false",
  });

  return `${AUTHORIZE_URL}?${params}`;
}

async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description ?? "GitHub did not return an access token.");
  }
  return data.access_token;
}

/**
 * Resolves the code to a GitHub username and checks it against
 * ADMIN_GITHUB_LOGIN. Without that check any GitHub account on earth could sign
 * in, since the OAuth App itself is public.
 */
export async function verifyCode(code: string, redirectUri: string): Promise<void> {
  const allowed = process.env.ADMIN_GITHUB_LOGIN;
  if (!allowed) throw new Error("ADMIN_GITHUB_LOGIN is not set.");

  const token = await exchangeCode(code, redirectUri);

  const response = await fetch(USER_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Could not read the GitHub profile.");

  const user = (await response.json()) as { login?: string };
  if (!user.login || user.login.toLowerCase() !== allowed.toLowerCase()) {
    throw new Error(`${user.login ?? "That account"} is not allowed to sign in.`);
  }
}
