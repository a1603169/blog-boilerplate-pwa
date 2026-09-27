import Link from "next/link";

import Container from "@/components/ui/Container";
import SocialLinks from "@/components/ui/SocialLinks";
import { site } from "@/lib/site";

export default function SiteFooter() {
  /* Built at render time on the server — a static year would go stale. */
  const year = new Date().getUTCFullYear();

  return (
    /* Plain document flow. The old footer toggled between `fixed` and `relative`
       from an unthrottled scroll listener, which made the layout jump. */
    <footer className="pb-safe mt-16 border-t border-border">
      <Container>
        <div className="flex flex-col-reverse items-center gap-4 py-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-xs text-fg-subtle">
            <p>
              © {year} {site.name}
            </p>
            <span aria-hidden>·</span>
            {/*
             * The only always-visible way in. The header's Admin link appears once
             * signed in, which left no entry point for the first sign-in — the exact
             * friction of having to type /admin on a phone.
             *
             * Placement carries no security weight: every admin page and every server
             * action re-checks the signed session cookie, so this is only a link.
             */}
            <Link href="/admin" className="transition-colors hover:text-fg">
              Admin
            </Link>
          </div>
          <SocialLinks />
        </div>
      </Container>
    </footer>
  );
}
