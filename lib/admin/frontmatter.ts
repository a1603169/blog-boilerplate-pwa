import matter from "gray-matter";

/** The editable shape of a post. Mirrors what lib/posts.ts reads back out. */
export interface PostDraft {
  slug: string;
  title: string;
  subtitle: string;
  /** `YYYY-MM-DD`. */
  date: string;
  tags: string[];
  draft: boolean;
  archived: boolean;
  body: string;
}

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `Kubernetes, Cloud` / `kubernetes cloud` -> `["cloud", "kubernetes"]`. */
export function parseTagInput(input: string): string[] {
  const seen = new Set<string>();
  for (const part of input.split(/[,\n]+/)) {
    const tag = part.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen].sort();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Turns a title into a usable filename. Falls back to the date when nothing survives. */
export function suggestSlug(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    // Keep ASCII words and digits; Korean and punctuation are dropped, which is
    // why the slug is an editable field rather than derived silently.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || todayIso().replace(/-/g, "");
}

export function validateDraft(draft: PostDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("Title is required.");
  if (!SLUG_PATTERN.test(draft.slug)) {
    errors.push("Slug must be lowercase and may contain letters, digits, dot, dash, underscore.");
  }
  if (!ISO_DATE.test(draft.date)) errors.push("Date must be YYYY-MM-DD.");
  if (!draft.body.trim()) errors.push("Body is empty.");
  return errors;
}

/**
 * Serialises frontmatter by hand rather than with a YAML dumper.
 *
 * Every string goes out as a JSON double-quoted scalar, which is also valid YAML,
 * so a title containing a colon or an apostrophe cannot break the file. Hand-typed
 * frontmatter is exactly how one post ended up with `date: "2024-04-01="` and
 * failed a production build.
 */
export function serializePost(draft: PostDraft): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(draft.title.trim())}`,
    `subtitle: ${JSON.stringify(draft.subtitle.trim())}`,
    `date: ${JSON.stringify(draft.date)}`,
    `tags: [${draft.tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
  ];

  // Only written when true, so published posts keep the frontmatter they had.
  if (draft.draft) lines.push("draft: true");
  if (draft.archived) lines.push("archived: true");

  lines.push("---", "", draft.body.trim(), "");
  return lines.join("\n");
}

export function parsePost(slug: string, markdown: string): PostDraft {
  const { data, content } = matter(markdown);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    subtitle: typeof data.subtitle === "string" ? data.subtitle : "",
    date: typeof data.date === "string" && ISO_DATE.test(data.date) ? data.date : todayIso(),
    tags: Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase())
      : [],
    draft: data.draft === true,
    archived: data.archived === true,
    body: content.replace(/^\n+/, ""),
  };
}
