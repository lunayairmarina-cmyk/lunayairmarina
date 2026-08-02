import { cn } from "@/lib/utils";

export function ContentSkeleton({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn("animate-pulse space-y-3", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-md bg-foreground/10",
            index === 0 ? "h-8 w-2/3" : "h-4 w-full",
            index === rows - 1 && "w-4/5",
          )}
        />
      ))}
    </div>
  );
}

export function ContentError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-gold/20 bg-navy/5 px-6 py-8 text-center">
      <p className="text-sm text-foreground/70">
        {message || "Content is temporarily unavailable."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-sm text-gold underline-offset-4 hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function ContentEmpty({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gold/25 px-6 py-10 text-center">
      <p className="text-sm text-foreground/55">{message || "No content yet."}</p>
    </div>
  );
}
