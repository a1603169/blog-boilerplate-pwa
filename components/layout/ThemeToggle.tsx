"use client";

import { useCallback, useEffect, useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  // `null` until mounted: the server cannot know the stored theme, so rendering
  // a concrete icon during SSR would guarantee a hydration mismatch.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // The inline script in the root layout already set the class before paint.
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemChange = (event: MediaQueryListEvent) => {
      // Only follow the OS while the visitor has not made an explicit choice.
      if (localStorage.getItem("theme")) return;
      const next: Theme = event.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", event.matches);
      setTheme(next);
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Private browsing / storage disabled: the class still applies for this visit.
      }
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="grid size-9 place-items-center rounded-md text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
    >
      {/* Both icons render; CSS picks one. Keeps the button stable before mount. */}
      <LuSun className="size-4 dark:hidden" aria-hidden />
      <LuMoon className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
