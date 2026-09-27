import Link from "next/link";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";

import type { PostSummary } from "@/types/post";

/**
 * Previous/next links. The old version called `handlePrevPost()` four times per
 * render (twice to test, twice to read) and matched posts by title rather than
 * slug, so two posts sharing a title would link to the wrong neighbour.
 */
export default function PostNav({
  newer,
  older,
}: {
  newer: PostSummary | null;
  older: PostSummary | null;
}) {
  if (!newer && !older) return null;

  return (
    <nav
      aria-label="Adjacent posts"
      className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
    >
      {newer ? (
        <Link
          href={`/blog/${newer.slug}`}
          className="group rounded-lg border border-border p-4 transition-colors hover:border-border-strong"
        >
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <LuArrowLeft className="size-3" aria-hidden />
            Newer
          </span>
          <span className="mt-2 block text-sm font-medium leading-snug text-fg transition-colors group-hover:text-accent">
            {newer.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {older && (
        <Link
          href={`/blog/${older.slug}`}
          className="group rounded-lg border border-border p-4 transition-colors hover:border-border-strong sm:text-right"
        >
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle sm:justify-end">
            Older
            <LuArrowRight className="size-3" aria-hidden />
          </span>
          <span className="mt-2 block text-sm font-medium leading-snug text-fg transition-colors group-hover:text-accent">
            {older.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
