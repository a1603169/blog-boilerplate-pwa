import Image from "next/image";
import { LuArrowUpRight } from "react-icons/lu";

import type { Project, ProjectStatus } from "@/data/projects";
import { cn } from "@/lib/utils";

const statusLabels: Record<ProjectStatus, string> = {
  live: "Live",
  wip: "In progress",
  archived: "Archived",
};

/**
 * One markup path for every state.
 *
 * The original Card duplicated its whole subtree across the enabled/disabled
 * branches, which is how `hover:bg--50` — an invalid class — survived unnoticed
 * in the non-disabled copy.
 *
 * `featured` gives the lead project a wide two-column panel instead of another
 * identical tile, so the page opens on an image rather than a uniform grid.

 */
export default function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  const { title, summary, status, href, image, imagePosition } = project;
  const linked = Boolean(href);

  const media = (
    <div
      className={cn(
        "relative overflow-hidden bg-bg-subtle",
        featured ? "aspect-[16/10] sm:h-full sm:aspect-auto" : "aspect-[4/3]",
      )}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={featured ? "(min-width: 640px) 55vw, 100vw" : "(min-width: 1024px) 34rem, 92vw"}
          className={cn(
            "object-cover transition-[filter,transform,opacity] duration-700",
            imagePosition === "top" && "object-top",
            status === "archived"
              ? "opacity-70 grayscale"
              : "group-hover:scale-[1.04] group-hover:opacity-100",
          )}
          priority={featured}
        />
      ) : (
        <div className="grid h-full place-items-center">
          <span className="font-serif text-5xl text-fg-subtle/30">{title.charAt(0)}</span>
        </div>
      )}
    </div>
  );

  const text = (
    <div className={cn("flex flex-1 flex-col gap-3", featured ? "p-7 sm:p-9" : "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "leading-snug text-fg",
            featured ? "font-serif text-2xl font-semibold" : "text-base font-medium",
          )}
        >
          {title}
        </h3>
        {linked && (
          <LuArrowUpRight
            className="mt-1 size-4 shrink-0 text-fg-subtle transition-colors group-hover:text-accent"
            aria-hidden
          />
        )}
      </div>

      <p
        className={cn(
          "leading-relaxed text-fg-muted",
          // Clamped in the grid so a long summary cannot make one card taller
          // than its neighbours. The featured panel has room for the full text.
          featured ? "text-base" : "line-clamp-3 text-sm",
        )}
      >
        {summary}
      </p>

      <p
        className={cn(
          "mt-auto pt-3 text-xs",
          status === "live" ? "text-accent" : "text-fg-subtle",
        )}
      >
        {statusLabels[status]}
      </p>
    </div>
  );

  const shell = cn(
    "group flex overflow-hidden rounded-xl border border-border bg-surface transition-colors",
    featured ? "flex-col sm:grid sm:grid-cols-[1.15fr_1fr]" : "flex-col",
  );

  const body = (
    <>
      {media}
      {text}
    </>
  );

  /* Archived products are gone, so there is nothing to navigate to. This is what
     the old `disabled` flag expressed by bouncing through a /disabled page that
     then redirected home. */
  if (!linked) {
    return (
      <article className={shell} aria-label={`${title} (archived)`}>
        {body}
      </article>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(shell, "hover:border-border-strong")}
    >
      {body}
    </a>
  );
}
