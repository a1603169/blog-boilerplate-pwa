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
          <p className="text-xs text-fg-subtle">
            © {year} {site.name}
          </p>
          <SocialLinks />
        </div>
      </Container>
    </footer>
  );
}
