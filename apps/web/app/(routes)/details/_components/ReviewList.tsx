"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { Review } from "@fixitnow/types";
import { Button } from "@/components/ui/button";
import { StarDisplay } from "./StarRating";

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string | null;
  /** When provided, a trash button is rendered on the current user's review. */
  onDelete?: (id: string) => void;
  /** Id of the review currently being deleted (shows a "Deleting…" state). */
  deletingId?: string | null;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

/**
 * Renders reviews newest-first, but always pins the current user's own
 * review to the top so they can spot it without scrolling.
 */
function pinCurrentUserFirst(
  reviews: Review[],
  currentUserId?: string | null
): Review[] {
  if (!currentUserId) return reviews;
  const mine: Review[] = [];
  const others: Review[] = [];
  for (const r of reviews) {
    if (r.userId === currentUserId) mine.push(r);
    else others.push(r);
  }
  return [...mine, ...others];
}

export function ReviewList({
  reviews,
  currentUserId,
  onDelete,
  deletingId,
}: ReviewListProps) {
  const ordered = useMemo(
    () => pinCurrentUserFirst(reviews, currentUserId),
    [reviews, currentUserId]
  );

  if (ordered.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Reviews">
      {ordered.map((r) => {
        const isMine = currentUserId && r.userId === currentUserId;
        return (
          <li
            key={r.id}
            className="bg-card flex flex-col gap-2 rounded-lg border p-4"
            aria-label={
              isMine ? "Your review" : `Review by ${r.userName ?? "user"}`
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StarDisplay value={r.rating} size="sm" />
                  <span className="font-semibold">
                    {r.userName ?? "Anonymous"}
                  </span>
                  {isMine && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      You
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatTimestamp(r.createdAt)}
                </p>
              </div>
              {isMine && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete your review"
                  disabled={deletingId === r.id}
                  onClick={() => onDelete(r.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {deletingId === r.id ? "Deleting…" : "Delete"}
                </Button>
              )}
            </div>
            {r.comment && (
              <p className="text-sm leading-relaxed">{r.comment}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { pinCurrentUserFirst };
