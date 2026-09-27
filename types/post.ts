/** A heading collected from the rendered post, used to build the table of contents. */
export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

/** Everything the blog index needs. Deliberately excludes `contentHtml` (too large to ship). */
export interface PostSummary {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  tags: string[];
  /** Plain-text body, lowercased and truncated — powers full-text search on the index. */
  searchText: string;
  /**
   * Reachable by URL but hidden from the index, the landing page and the sitemap.
   * Distinct from `draft`, which prevents the page existing at all.
   */
  archived: boolean;
}

export interface Post extends PostSummary {
  contentHtml: string;
  headings: Heading[];
  /** Drafts are excluded from the site; see lib/posts.ts. */
  draft: boolean;
}

export interface TagCount {
  tag: string;
  count: number;
}
