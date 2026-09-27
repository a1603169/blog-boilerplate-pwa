import { NextResponse } from "next/server";

import { startSession } from "@/lib/admin/auth";
import { STATE_COOKIE, verifyCode } from "@/lib/admin/oauth";

export const dynamic = "force-dynamic";

/** Step 2: verify `state`, confirm the GitHub username, then open the session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const failure = (reason: string) =>
    NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(reason)}`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((entry) => entry.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  if (url.searchParams.get("error")) return failure("GitHub sign-in was cancelled.");
  if (!code || !state) return failure("GitHub sign-in returned an incomplete response.");
  if (!expectedState || state !== expectedState) {
    return failure("Sign-in state did not match. Please try again.");
  }

  try {
    await verifyCode(code, `${origin}/admin/auth/callback`);
    await startSession();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "GitHub sign-in failed.");
  }

  const response = NextResponse.redirect(`${origin}/admin`);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
