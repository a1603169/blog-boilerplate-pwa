"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LuSearch } from "react-icons/lu";

import type { AdminPostRow } from "@/app/admin/page";
import { formatDate } from "@/lib/utils";

export default function PostTable({ rows }: { rows: AdminPostRow[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) => row.title.toLowerCase().includes(needle) || row.slug.includes(needle),
    );
  }, [rows, query]);

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

      <p className="mt-3 text-xs text-fg-subtle">{visible.length} shown</p>

      <ul className="mt-2 border-t border-border">
        {visible.map((row) => (
          <li key={row.slug} className="border-b border-border">
            <Link
              href={`/admin/${row.slug}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 transition-colors hover:bg-bg-subtle/60"
            >
              <span className="label-mono shrink-0 text-fg-subtle">{formatDate(row.date)}</span>
              <span className="text-sm text-fg">{row.title}</span>
              {row.draft && (
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-subtle">
                  draft
                </span>
              )}
              <span className="ml-auto text-xs text-fg-subtle">{row.slug}</span>
            </Link>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="mt-6 text-sm text-fg-muted">No post matches that filter.</p>
      )}
    </div>
  );
}
