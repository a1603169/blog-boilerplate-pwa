import type { Metadata } from "next";
import Link from "next/link";
import { LuCheck } from "react-icons/lu";

import Container from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Message sent",
  robots: { index: false },
};

export default function SuccessPage() {
  return (
    /* No auto-redirect. The old page called `setTimeout(() => router.push("/"))`
       in the render body, so every re-render queued another navigation and none
       of them were ever cleared. */
    <Container width="prose" className="py-24 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-subtle">
        <LuCheck className="size-5 text-accent" aria-hidden />
      </span>
      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-fg">
        Message sent
      </h1>
      <p className="mt-3 text-base leading-relaxed text-fg-muted">
        Thanks for reaching out — I will get back to you as soon as I can.
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
          Read the blog
        </Link>
      </div>
    </Container>
  );
}
