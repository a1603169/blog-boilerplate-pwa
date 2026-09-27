/**
 * `status` drives how a card renders:
 *   live     — shipped and reachable
 *   wip      — public repo, still in progress
 *   archived — nothing left to link to, so the card is not a link
 */
export type ProjectStatus = "live" | "wip" | "archived";

export interface Project {
  title: string;
  summary: string;
  status: ProjectStatus;
  /** Omit for archived projects — their URLs no longer resolve. */
  href?: string;
  /** Path under /public, e.g. `/assets/my-project.png`. */
  image?: string;
  /**
   * Where to anchor the crop. Cards are 4:3, so a portrait screenshot centred
   * would lose its header and chrome — the parts that identify the product.
   */
  imagePosition?: "top" | "center";
}

/** The first `live` project renders as a wide featured panel. */
export const PROJECTS: Project[] = [
  {
    title: "A Shipped Thing",
    summary: "One sentence on what it is and who uses it.",
    status: "live",
    href: "https://example.com",
    image: "/assets/example.png",
  },
  {
    title: "Something In Progress",
    summary: "One sentence. Public repo, not finished.",
    status: "wip",
    href: "https://github.com/your-handle/repo",
  },
  {
    title: "Something Retired",
    summary: "One sentence. No link — the product is gone.",
    status: "archived",
  },
];
