import Link from "next/link";

import Container from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container width="prose" className="py-24 text-center">
      <p className="label-mono text-accent">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-fg">
        Page not found
      </h1>
      <p className="mt-3 text-base leading-relaxed text-fg-muted">
        That URL does not exist. It may have been renamed or removed.
      </p>
      <div className="mt-8 flex justify-center gap-2">
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
        >
          Back home
        </Link>
        <Link
          href="/blog"
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          Browse posts
        </Link>
      </div>
    </Container>
  );
}
