import { redirect } from "next/navigation";
import { LuGithub } from "react-icons/lu";

import LoginForm from "@/components/admin/LoginForm";
import Container from "@/components/ui/Container";
import { isAuthenticated } from "@/lib/admin/auth";
import { isOAuthConfigured } from "@/lib/admin/oauth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthenticated()) redirect("/admin");

  const { error } = await searchParams;
  const oauth = isOAuthConfigured();

  return (
    <Container width="prose" className="py-20">
      <h1 className="font-serif text-2xl font-semibold text-fg">Admin</h1>
      <p className="mt-2 text-sm text-fg-muted">Sign in to write and edit posts.</p>

      {error && (
        <p role="alert" className="mt-5 max-w-sm text-sm text-red-500">
          {error === "oauth_not_configured"
            ? "GitHub sign-in is not configured on this deployment."
            : error}
        </p>
      )}

      <div className="mt-6 max-w-sm space-y-4">
        {oauth && (
          <>
            {/* A real navigation, not a client-side one: /admin/auth/github is a
                Route Handler that 307s to github.com. `next/link` would try to
                treat it as an in-app page. On a phone GitHub is usually already
                signed in, so this is one tap instead of a long password. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/admin/auth/github"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm text-fg transition-colors hover:bg-bg-subtle"
            >
              <LuGithub className="size-4" aria-hidden />
              Continue with GitHub
            </a>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-fg-subtle">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <LoginForm />

        {!oauth && (
          <p className="text-xs text-fg-subtle">
            Add GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET and ADMIN_GITHUB_LOGIN to also
            sign in with GitHub.
          </p>
        )}
      </div>
    </Container>
  );
}
