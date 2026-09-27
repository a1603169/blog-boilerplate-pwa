"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";

import { type ActionResult, type BulkAction, bulkUpdate } from "@/app/admin/actions";
import type { AdminPostRow } from "@/app/admin/page";
import { cn, formatDate } from "@/lib/utils";

type Filter = "all" | "published" | "draft" | "archived";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
];

const BULK_ACTIONS: { value: BulkAction; label: string }[] = [
  { value: "draft", label: "Mark as draft" },
  { value: "publish", label: "Publish" },
  { value: "archive", label: "Archive" },
  { value: "unarchive", label: "Unarchive" },
];

function matchesFilter(row: AdminPostRow, filter: Filter): boolean {
  if (filter === "draft") return row.draft;
  if (filter === "archived") return row.archived;
  if (filter === "published") return !row.draft && !row.archived;
  return true;
}

export default function PostTable({ rows }: { rows: AdminPostRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    bulkUpdate,
    null,
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (!needle) return true;
      return row.title.toLowerCase().includes(needle) || row.slug.includes(needle);
    });
  }, [rows, query, filter]);

  // Selecting, then filtering, could otherwise submit slugs that are off screen.
  const selectedVisible = visible.filter((row) => selected.has(row.slug));
  const allVisibleSelected = visible.length > 0 && selectedVisible.length === visible.length;

  function toggle(slug: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((row) => next.delete(row.slug));
      else visible.forEach((row) => next.add(row.slug));
      return next;
    });
  }

  return (
    <div className="mt-6">
      <div className="relative">
        <LuSearch
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by title or slug…"
          aria-label="Filter posts"
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-fg-subtle"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((option) => {
          const count = rows.filter((row) => matchesFilter(row, option.value)).length;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                filter === option.value
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {option.label} <span className="font-mono opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk toolbar — one commit per action, however many posts are selected. */}
      <form action={formAction} className="mt-4">
        {selectedVisible.map((row) => (
          <input key={row.slug} type="hidden" name="slugs" value={row.slug} />
        ))}

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2.5">
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              aria-label="Select all shown"
            />
            {selectedVisible.length > 0 ? `${selectedVisible.length} selected` : "Select all shown"}
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {BULK_ACTIONS.map((action) => (
              <button
                key={action.value}
                type="submit"
                name="action"
                value={action.value}
                disabled={pending || selectedVisible.length === 0}
                className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-40"
              >
                {action.label}
              </button>
            ))}
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="px-2 text-xs text-fg-subtle underline underline-offset-2 hover:text-fg"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {pending && <p className="mt-2 text-xs text-fg-subtle">Committing…</p>}
        {state && (
          <p
            role="status"
            className={cn("mt-2 text-xs", state.ok ? "text-accent" : "text-red-500")}
          >
            {state.ok ? state.message : state.error}
          </p>
        )}
      </form>

      <p className="mt-4 text-xs text-fg-subtle">{visible.length} shown</p>

      <ul className="mt-2 border-t border-border">
        {visible.map((row) => (
          <li key={row.slug} className="flex items-start gap-3 border-b border-border py-3">
            <input
              type="checkbox"
              checked={selected.has(row.slug)}
              onChange={() => toggle(row.slug)}
              aria-label={`Select ${row.title}`}
              className="mt-1 shrink-0"
            />
            {/*
             * Fixed columns, not flex-wrap. Dates are variable-length strings
             * ("MAY 1, 2025" vs "JAN 17, 2025"), so a flex row started every title
             * at a different x, and a long title pushed the slug onto its own line.
             * A 6.5rem date column makes the titles line up and gives the slug a
             * column of its own that it can never be bumped out of.
             */}
            <Link
              href={`/admin/${row.slug}`}
              className="grid min-w-0 flex-1 gap-x-4 gap-y-0.5 transition-colors hover:text-accent sm:grid-cols-[6.5rem_1fr_auto] sm:items-baseline"
            >
              <time dateTime={row.date} className="label-mono text-fg-subtle">
                {formatDate(row.date)}
              </time>

              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm text-fg">{row.title}</span>
                {row.draft && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-subtle">
                    draft
                  </span>
                )}
                {row.archived && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-subtle">
                    archived
                  </span>
                )}
              </span>

              {/* Dropped on narrow screens — the title already identifies the post. */}
              <span className="hidden truncate text-xs text-fg-subtle sm:block sm:text-right">
                {row.slug}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="mt-6 text-sm text-fg-muted">Nothing matches that filter.</p>
      )}
    </div>
  );
}
