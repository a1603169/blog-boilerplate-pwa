import { cn } from "@/lib/utils";

type Width = "prose" | "page" | "wide";

const widths: Record<Width, string> = {
  /** ~68ch — the reading measure for long-form posts. */
  prose: "max-w-prose",
  /** Default for list and detail pages. */
  page: "max-w-page",
  /** Project grid and other multi-column content. */
  wide: "max-w-6xl",
};

export default function Container({
  width = "page",
  className,
  children,
}: {
  width?: Width;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", widths[width], className)}>{children}</div>
  );
}
