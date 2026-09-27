"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowUpRight, LuMenu, LuPenLine, LuX } from "react-icons/lu";

import ThemeToggle from "@/components/layout/ThemeToggle";
import Container from "@/components/ui/Container";
import { navItems, site } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  // `/blog` should stay active on `/blog/some-post`.
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Close the mobile panel whenever navigation happens.
  useEffect(() => setMenuOpen(false), [pathname]);

  /*
   * Reveal the Admin link only once signed in, so the nav stays clean for
   * visitors while still being reachable on a phone or from the installed PWA —
   * where typing /admin by hand is the only alternative.
   *
   * Read client-side after mount: checking the session on the server would make
   * every page dynamic and give up the 246 prerendered posts. `admin_hint` is a
   * non-httpOnly cookie that grants nothing; the real session stays httpOnly and
   * every admin page and action re-checks it.
   */
  useEffect(() => {
    setShowAdmin(document.cookie.split("; ").some((c) => c === "admin_hint=1"));
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-serif text-lg font-semibold tracking-tight text-fg transition-colors hover:text-accent"
          >
            {site.shortName}
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop navigation */}
            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                      >
                        {item.label}
                        <LuArrowUpRight className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={isActive(pathname, item.href) ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          isActive(pathname, item.href)
                            ? "text-accent"
                            : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                        )}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
                {showAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      aria-current={isActive(pathname, "/admin") ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive(pathname, "/admin")
                          ? "text-accent"
                          : "text-fg-subtle hover:bg-bg-subtle hover:text-fg",
                      )}
                    >
                      <LuPenLine className="size-3.5" aria-hidden />
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-9 place-items-center rounded-md text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg md:hidden"
            >
              {menuOpen ? (
                <LuX className="size-5" aria-hidden />
              ) : (
                <LuMenu className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile navigation — same `navItems` source, different layout. */}
      {menuOpen && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-border md:hidden">
          <Container>
            <ul className="flex flex-col py-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  {"external" in item && item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 py-3 text-base text-fg-muted"
                    >
                      {item.label}
                      <LuArrowUpRight className="size-3.5" aria-hidden />
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                      className={cn(
                        "block py-3 text-base",
                        isActive(pathname, item.href) ? "text-accent" : "text-fg-muted",
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              {showAdmin && (
                <li>
                  <Link
                    href="/admin"
                    aria-current={isActive(pathname, "/admin") ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 py-3 text-base",
                      isActive(pathname, "/admin") ? "text-accent" : "text-fg-subtle",
                    )}
                  >
                    <LuPenLine className="size-4" aria-hidden />
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}
