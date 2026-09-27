"use client";

import { useActionState } from "react";

import { type ActionResult, login } from "@/app/admin/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(login, null);

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        autoFocus
        required
        placeholder="Password"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
