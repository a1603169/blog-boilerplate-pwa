"use client";

import { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";

/**
 * Appears once the visitor is well down the page. Borrowed from the reference
 * layout's persistent back-to-top control, which earns its keep here: the blog
 * index runs twelve posts deep and CKA/GCP write-ups are very long.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Driven by an observer on a sentinel rather than a scroll listener, so
    // there is no per-frame work while scrolling.
    const sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:100vh;height:1px;width:1px;pointer-events:none";
    document.body.appendChild(sentinel);

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      // Kept out of the tab order and off the screen reader tree while hidden.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`pb-safe fixed bottom-6 right-5 z-30 grid size-10 place-items-center rounded-full border border-border bg-surface/90 text-fg-muted shadow-sm backdrop-blur transition-all duration-300 hover:border-border-strong hover:text-fg ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <LuArrowUp className="size-4" aria-hidden />
    </button>
  );
}
