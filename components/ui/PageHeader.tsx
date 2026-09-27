/**
 * Just the title and a rule.
 *
 * It used to also take an `eyebrow` (a mono uppercase `ABOUT` / `16 PROJECTS`
 * above the heading) and a `description`. The eyebrow repeated what the active
 * nav item already said, and the descriptions were filler that restated the
 * title. Both read as decoration applied without exception, so they are gone.
 */
export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-border pb-5">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>
    </header>
  );
}
