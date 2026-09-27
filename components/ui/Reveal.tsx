"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Fades and lifts its children into view once, when they first intersect.
 *
 * Replaces the two near-identical framer-motion wrappers (`Transition` and
 * `Transition_Slower`, which differed only in duration) and drops the
 * dependency entirely — the animation is a CSS transition, see `@utility reveal`.
 */
export default function Reveal({
  delay = 0,
  as: Tag = "div",
  className,
  children,
}: {
  /** Stagger, in milliseconds. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect the OS setting: show immediately, skip the observer entirely.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error -- one ref type per tag; all of them are HTMLElement.
      ref={ref}
      className={cn("reveal", className)}
      data-revealed={revealed}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
