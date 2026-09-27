import { LuLoaderCircle } from "react-icons/lu";

import { cn } from "@/lib/utils";

export default function Spinner({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2", className)}>
      <LuLoaderCircle className="size-4 animate-spin text-accent" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
