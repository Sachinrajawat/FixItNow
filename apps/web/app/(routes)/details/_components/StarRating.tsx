"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarDisplayProps {
  value: number;
  /** Total stars (default 5). */
  total?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Accessible label, defaults to "{value} out of {total} stars". */
  ariaLabel?: string;
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export function StarDisplay({
  value,
  total = 5,
  size = "md",
  className,
  ariaLabel,
}: StarDisplayProps) {
  const stars = Array.from({ length: total }, (_, i) => i + 1);
  const label = ariaLabel ?? `${value} out of ${total} stars`;
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {stars.map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            sizeMap[size],
            n <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          )}
        />
      ))}
    </span>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (next: number) => void;
  /** Total stars (default 5). */
  total?: number;
  disabled?: boolean;
  /**
   * Group label exposed to assistive tech via aria-labelledby on the
   * wrapping element, OR you can pass `ariaLabel` directly.
   */
  ariaLabel?: string;
}

/**
 * Accessible radio-group style star picker. Arrow keys move the focus
 * ring; Enter / Space selects.
 */
export function StarPicker({
  value,
  onChange,
  total = 5,
  disabled = false,
  ariaLabel = "Rating",
}: StarPickerProps) {
  const stars = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex gap-1">
      {stars.map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => onChange(n)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" && n < total) {
                e.preventDefault();
                onChange(n + 1);
              } else if (e.key === "ArrowLeft" && n > 1) {
                e.preventDefault();
                onChange(n - 1);
              }
            }}
            className={cn(
              "rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <Star
              aria-hidden="true"
              className={cn(
                "h-6 w-6 transition",
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground hover:text-yellow-400"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
