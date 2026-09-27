import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { cn } from "@/lib/utils";

/**
 * Page numbers to render, with `null` marking an ellipsis. Always includes the
 * first and last page and keeps the current page centred.
 *
 * The previous implementation used `slice(currentPage - 5, currentPage + 5)`,
 * which silently dropped page 1 once you passed page 6 and rendered a trailing
 * "..." based on a separate, inconsistent condition.
 */
export function getPageWindow(current: number, total: number, span = 2): (number | null)[] {
  if (total <= 1) return [1];

  const pages = new Set<number>([1, total]);
  for (let page = current - span; page <= current + span; page++) {
    if (page > 1 && page < total) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(null);
    result.push(page);
  });

  return result;
}

export default function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const buttonBase =
    "grid size-9 place-items-center rounded-md label-mono transition-colors disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
        className={cn(buttonBase, "text-fg-muted hover:bg-bg-subtle hover:text-fg")}
      >
        <LuChevronLeft className="size-4" aria-hidden />
      </button>

      {getPageWindow(current, total).map((page, index) =>
        page === null ? (
          <span key={`gap-${index}`} className="label-mono px-1 text-fg-subtle">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            aria-current={page === current ? "page" : undefined}
            className={cn(
              buttonBase,
              page === current
                ? "bg-accent text-accent-contrast"
                : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
        className={cn(buttonBase, "text-fg-muted hover:bg-bg-subtle hover:text-fg")}
      >
        <LuChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
