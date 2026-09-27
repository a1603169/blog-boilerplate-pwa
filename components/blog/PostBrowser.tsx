"use client";

import { useMemo, useRef, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";

import Pagination from "@/components/blog/Pagination";
import PostListItem from "@/components/blog/PostListItem";
import Tag from "@/components/ui/Tag";
import { POSTS_PER_PAGE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { PostSummary, TagCount } from "@/types/post";

export default function PostBrowser({
  posts,
  tags,
  commentCounts = {},
}: {
  posts: PostSummary[];
  tags: TagCount[];
  /** slug -> comment count, from the utterances repo. */
  commentCounts?: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return posts.filter((post) => {
      // Multi-select tags are OR'd, matching the original behaviour.
      if (selectedTags.length > 0 && !selectedTags.some((tag) => post.tags.includes(tag))) {
        return false;
      }
      if (!needle) return true;

      return (
        post.title.toLowerCase().includes(needle) ||
        post.subtitle.toLowerCase().includes(needle) ||
        post.tags.some((tag) => tag.includes(needle)) ||
        // `searchText` is built at build time; the old code read `post.content`,
        // which the index data never contained, so body search never matched.
        post.searchText.includes(needle)
      );
    });
  }, [posts, query, selectedTags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  // Filters can shrink the result set below the current page.
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const visible = filtered.slice(start, start + POSTS_PER_PAGE);

  /* The old pagination linked to `#blogContents`, an id that existed nowhere in
     the markup, so the jump silently did nothing. */
  function goToPage(next: number) {
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
    setPage(1);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  const hasFilters = selectedTags.length > 0 || query.trim() !== "";

  return (
    <div>
      <div className="mt-8 space-y-5">
        <div className="relative">
          <LuSearch
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search titles, tags and summaries…"
            aria-label="Search posts"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-fg placeholder:text-fg-subtle"
          />
          {query && (
            <button
              type="button"
              onClick={() => updateQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-fg-subtle hover:text-fg"
            >
              <LuX className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map(({ tag, count }) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selected}
                className="rounded-full"
              >
                <Tag
                  count={count}
                  selected={selected}
                  className={cn(!selected && "hover:border-border-strong hover:text-fg")}
                >
                  {tag}
                </Tag>
              </button>
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedTags([]);
                setQuery("");
                setPage(1);
              }}
              className="ml-1 text-xs text-fg-subtle underline underline-offset-2 hover:text-fg"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="mt-8 scroll-mt-24">
        <p className="text-xs text-fg-subtle" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          {hasFilters && ` of ${posts.length}`}
        </p>

        {visible.length > 0 ? (
          <ul className="mt-3 border-t border-border">
            {visible.map((post) => (
              <PostListItem
                key={post.slug}
                post={post}
                commentCount={commentCounts[post.slug] ?? 0}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-8 border-t border-border pt-8 text-sm text-fg-muted">
            Nothing matched. Try a different keyword or clear the tag filters.
          </p>
        )}
      </div>

      <Pagination current={currentPage} total={totalPages} onChange={goToPage} />
    </div>
  );
}
