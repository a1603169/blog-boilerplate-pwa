"use client";

import { useEffect, useRef } from "react";

import { comments } from "@/lib/site";

const UTTERANCES_ORIGIN = "https://utteranc.es";

function themeName() {
  return document.documentElement.classList.contains("dark")
    ? "github-dark"
    : "github-light";
}

/**
 * utterances keys each thread on `issue-term: pathname`, which is why the post
 * URLs had to stay at /blog/<slug> through this refactor — changing them would
 * orphan every existing comment thread.
 */
export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = `${UTTERANCES_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("repo", comments.repo);
    script.setAttribute("issue-term", comments.issueTerm);
    script.setAttribute("theme", themeName());
    container.appendChild(script);

    // Keep the embedded widget in sync when the site theme is toggled.
    const observer = new MutationObserver(() => {
      const frame = container.querySelector<HTMLIFrameElement>("iframe.utterances-frame");
      frame?.contentWindow?.postMessage(
        { type: "set-theme", theme: themeName() },
        UTTERANCES_ORIGIN,
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      // Strict Mode runs effects twice in development; without this the widget
      // would be embedded twice.
      container.replaceChildren();
    };
  }, []);

  return (
    <section aria-label="Comments" className="mt-16 border-t border-border pt-8">
      <div ref={containerRef} />
    </section>
  );
}
