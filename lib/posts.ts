import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import type { Element, Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";

import type { Heading, Post, PostSummary, TagCount } from "@/types/post";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/**
 * Cap the per-post search blob.
 *
 * The blog index ships one of these for each of the 246 posts — twice over, in
 * the HTML and again in the RSC payload — so this is a page-weight budget, not a
 * search-quality knob. 240 keeps /blog at ~54 kB gzipped; 400 pushed it to
 * ~77 kB for little extra recall. Search therefore covers the title, subtitle,
 * tags and the opening of the body rather than every word of a long post.
 */
const SEARCH_TEXT_LIMIT = 240;

const prettyCodeOptions: PrettyCodeOptions = {
  // Dual theme: shiki emits --shiki-light / --shiki-dark custom properties and
  // globals.css picks one based on the active colour scheme. This replaces the
  // old dark-only Prism stylesheet loaded from a CDN.
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  // Let our own CSS own the code block surface so it matches the design tokens.
  keepBackground: false,
  defaultLang: "text",
};

/**
 * Wraps every `<table>` in a horizontally scrollable container.
 *
 * This used to run in a `useEffect` on the post page, which injected Tailwind
 * class names at runtime — class names the compiler never sees, so the CSS for
 * them was never generated. Doing it at build time with a plain class hook
 * (`.table-scroll`, styled in globals.css) fixes both problems.
 */
function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [node],
      };

      parent.children[index] = wrapper;
      // Do not descend into the table we just moved, or we would wrap forever.
      return SKIP;
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // 38 posts embed raw <img>/<span>/<div>, so raw HTML has to survive the
  // mdast -> hast conversion and then be parsed by rehype-raw.
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  // Build-time heading ids. Previously done in a useEffect, which meant the
  // anchors did not exist until after hydration.
  .use(rehypeSlug)
  .use(rehypeWrapTables)
  .use(rehypePrettyCode, prettyCodeOptions)
  .use(rehypeStringify, { allowDangerousHtml: true });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Guarantees a real `YYYY-MM-DD` date for every post.
 *
 * Frontmatter is hand-written, and a single typo (`date: "2024-04-01="`) was
 * enough to fail the whole production build inside sitemap generation. Catch it
 * here, at the one place every consumer reads dates from, and say which file.
 */
function normalizeDate(raw: unknown, slug: string): string {
  if (typeof raw === "string" && ISO_DATE.test(raw.trim())) {
    const value = raw.trim();
    if (!Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) return value;
  }

  console.warn(`[posts] ${slug}.md has an invalid \`date\` (${JSON.stringify(raw)}); using epoch.`);
  return "1970-01-01";
}

/** Tags are authored inconsistently (`Algorithm` vs `algorithm`), so fold case. */
function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const tag of raw) {
    if (typeof tag !== "string") continue;
    const normalized = tag.trim().toLowerCase();
    if (normalized) seen.add(normalized);
  }
  return [...seen].sort();
}

/** Readable body text for the search index: no code blocks, no markup. */
function toSearchText(tree: MdastRoot): string {
  const parts: string[] = [];
  let length = 0;

  visit(tree, (node) => {
    if (length >= SEARCH_TEXT_LIMIT) return false;
    if (node.type === "code" || node.type === "html") return "skip";
    if (node.type === "text" || node.type === "inlineCode") {
      const value = (node as { value: string }).value;
      parts.push(value);
      length += value.length;
    }
    return undefined;
  });

  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, SEARCH_TEXT_LIMIT).toLowerCase();
}

function collectHeadings(tree: HastRoot): Heading[] {
  const headings: Heading[] = [];

  visit(tree, "element", (node) => {
    if (node.tagName !== "h2" && node.tagName !== "h3") return;
    const id = typeof node.properties?.id === "string" ? node.properties.id : "";
    const text = hastToString(node).trim();
    if (!id || !text) return;
    headings.push({ id, text, depth: node.tagName === "h2" ? 2 : 3 });
  });

  return headings;
}

/**
 * Markdown body -> HTML, headings and search text.
 *
 * Exported so the /admin preview renders through the identical pipeline: what the
 * editor shows is what the published page will contain, down to the shiki
 * highlighting and the scrollable table wrappers.
 */
export async function renderMarkdown(
  content: string,
): Promise<{ contentHtml: string; headings: Heading[]; searchText: string }> {
  const mdast = processor.parse(content) as MdastRoot;
  const searchText = toSearchText(mdast);

  const hast = (await processor.run(mdast)) as HastRoot;

  return {
    contentHtml: processor.stringify(hast),
    headings: collectHeadings(hast),
    searchText,
  };
}

async function readPost(slug: string): Promise<Post> {
  const raw = await fs.readFile(path.join(POSTS_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const { contentHtml, headings, searchText } = await renderMarkdown(content);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    subtitle: typeof data.subtitle === "string" ? data.subtitle : "",
    // Posts are sorted and grouped by date, so an unparseable value must not
    // silently sort to the top the way `undefined` used to.
    date: normalizeDate(data.date, slug),
    tags: normalizeTags(data.tags),
    // `draft: true` keeps a post out of the site entirely — no list entry and no
    // generated page. The source repository is private, so a committed draft stays
    // unpublished rather than merely unlinked.
    draft: data.draft === true,
    // `archived: true` keeps the page but removes it from every listing.
    archived: data.archived === true,
    searchText,
    contentHtml,
    headings,
  };
}

/**
 * Parsing 246 posts is the slow part of the build, and both `generateStaticParams`
 * and every page render need the same data. Memoise per Node process.
 */
let allPostsPromise: Promise<Post[]> | null = null;

function loadAllPosts(): Promise<Post[]> {
  allPostsPromise ??= (async () => {
    const files = await fs.readdir(POSTS_DIR);
    const slugs = files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
    const posts = (await Promise.all(slugs.map(readPost))).filter((post) => !post.draft);
    // Newest first; ties broken by slug so the order is deterministic.
    return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  })();

  return allPostsPromise;
}

function toSummary(post: Post): PostSummary {
  const { slug, title, subtitle, date, tags, searchText, archived } = post;
  return { slug, title, subtitle, date, tags, searchText, archived };
}

/**
 * Index/landing data. Excludes `contentHtml` so the RSC payload stays small, and
 * excludes archived posts — those keep their page but leave the listings.
 */
export async function getPostSummaries(): Promise<PostSummary[]> {
  return (await loadAllPosts())
    .filter((post) => !post.archived)
    .map(toSummary);
}

/** Every non-draft post, archived included. For the admin list and adjacency. */
export async function getAllPostSummaries(): Promise<PostSummary[]> {
  return (await loadAllPosts()).map(toSummary);
}

export async function getPostSlugs(): Promise<string[]> {
  return (await loadAllPosts()).map((post) => post.slug);
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await loadAllPosts()).find((post) => post.slug === slug) ?? null;
}

/**
 * Previous/next in reading order. The list is newest-first, so the *older*
 * neighbour sits at a higher index.
 */
export async function getAdjacentPosts(
  slug: string,
): Promise<{ older: PostSummary | null; newer: PostSummary | null }> {
  // Archived posts keep their page but leave the reading flow, so they are not
  // offered as a neighbour — consistent with being absent from the index.
  const posts = (await loadAllPosts()).filter((post) => !post.archived || post.slug === slug);
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { older: null, newer: null };

  return {
    newer: index > 0 ? toSummary(posts[index - 1]) : null,
    older: index < posts.length - 1 ? toSummary(posts[index + 1]) : null,
  };
}

export async function getTagCounts(): Promise<TagCount[]> {
  const counts = new Map<string, number>();

  for (const post of await loadAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
