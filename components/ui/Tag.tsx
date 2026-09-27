import { cn } from "@/lib/utils";

/**
 * Tags are stored lowercase (authors wrote both `Algorithm` and `algorithm`) and
 * are now displayed that way too — the mono uppercase treatment made a dozen
 * one-word tags shout for attention they did not need.
 */
export default function Tag({
  children,
  count,
  selected = false,
  className,
}: {
  children: React.ReactNode;
  count?: number;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
        selected
          ? "border-accent bg-accent text-accent-contrast"
          : "border-border text-fg-muted",
        className,
      )}
    >
      {children}
      {count !== undefined && (
        <span className="font-mono text-[0.65rem] opacity-60">{count}</span>
      )}
    </span>
  );
}
