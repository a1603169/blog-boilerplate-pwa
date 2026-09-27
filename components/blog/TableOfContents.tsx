"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { Heading } from "@/types/post";

/**
 * Headings come from the build-time markdown pipeline (rehype-slug), so the
 * anchors exist in the initial HTML. The old version queried `document` in a
 * `useEffect` and assigned ids after hydration, and rendered the whole list
 * twice — once for desktop, once for mobile, with `hidden` and `flex` applied
 * to the same element.
 */
function HeadingLinks({
  headings,
  activeId,
  onNavigate,
}: {
  headings: Heading[];
  activeId: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {headings.map((heading) => (
        <li key={heading.id} className={heading.depth === 3 ? "pl-4" : undefined}>
          <a
            href={`#${heading.id}`}
            onClick={onNavigate}
            aria-current={activeId === heading.id ? "location" : undefined}
            className={cn(
              "block border-l-2 py-0.5 pl-3 leading-snug transition-colors",
              activeId === heading.id
                ? "border-accent text-accent"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Highlight the heading closest to the top of the viewport.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // Top inset clears the sticky header; bottom inset keeps the active item
      // from jumping to a heading that is barely on screen.
      { rootMargin: "-88px 0px -65% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Collapsed by default up to xl, where the sticky aside takes over. */}
      <details className="mb-8 rounded-lg border border-border bg-bg-subtle px-4 py-3 xl:hidden">
        <summary className="cursor-pointer text-sm text-fg-muted">
          Contents
        </summary>
        <div className="mt-3">
          <HeadingLinks headings={headings} activeId={activeId} />
        </div>
      </details>

      <aside
        aria-label="Table of contents"
        className="pointer-events-none fixed right-6 top-24 hidden max-h-[calc(100dvh-8rem)] w-56 overflow-y-auto xl:block 2xl:w-64"
      >
        <div className="pointer-events-auto">
          <p className="mb-3 text-sm text-fg-subtle">Contents</p>
          <HeadingLinks headings={headings} activeId={activeId} />
        </div>
      </aside>
    </>
  );
}
