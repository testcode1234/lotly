import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered spinner for full-section loading states. */
export function Loading({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 py-12 text-sm text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
