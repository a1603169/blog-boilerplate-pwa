import { NextResponse } from "next/server";

import { STATE_COOKIE, authorizeUrl, isOAuthConfigured, newState } from "@/lib/admin/oauth";

export const dynamic = "force-dynamic";

/** Step 1: hand the visitor to GitHub with a one-time `state` we can verify later. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isOAuthConfigured()) {
    return NextResponse.redirect(`${origin}/admin/login?error=oauth_not_configured`);
  }

  const state = newState();
  const response = NextResponse.redirect(
    authorizeUrl(state, `${origin}/admin/auth/callback`),
  );

  // Short-lived and httpOnly: the callback compares it to what GitHub echoes back,
  // which is what stops a third party replaying an authorization code at us.
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
