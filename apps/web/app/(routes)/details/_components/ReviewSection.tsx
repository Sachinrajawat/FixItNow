"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Review } from "@fixitnow/types";

import { api, ApiError } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { StarDisplay } from "./StarRating";

interface RatingAggregate {
  ratingAvg: number;
  ratingCount: number;
}

interface ReviewSectionProps {
  businessId: string;
  /**
   * Current aggregate stored on the Business doc. The section will refresh
   * the parent via `onAggregateChange` after every create/delete so the
   * /details header stays in sync without a full page round trip.
   */
  aggregate: RatingAggregate;
  onAggregateChange: (next: RatingAggregate) => void;
}

/**
 * Compute a new (avg, count) pair from a *complete* review set. The local
 * compute matches the server's `recomputeBusinessRating` aggregation
 * (1-decimal rounded average, raw integer count) — see
 * apps/api/src/controllers/reviews.controller.ts.
 */
function aggregateOf(reviews: Review[]): RatingAggregate {
  if (reviews.length === 0) return { ratingAvg: 0, ratingCount: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    ratingAvg: Math.round((sum / reviews.length) * 10) / 10,
    ratingCount: reviews.length,
  };
}

export function ReviewSection({
  businessId,
  aggregate,
  onAggregateChange,
}: ReviewSectionProps) {
  const { status, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api.reviews
      .listForBusiness(businessId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setReviews(res.items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load reviews", err);
        setError("We couldn't load reviews. Please refresh the page.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [businessId]);

  const currentUserId = user?.id ?? null;
  const userHasReviewed = useMemo(
    () => !!currentUserId && reviews.some((r) => r.userId === currentUserId),
    [reviews, currentUserId]
  );

  const handleCreated = useCallback(
    (created: Review) => {
      setReviews((prev) => {
        const next = [created, ...prev];
        onAggregateChange(aggregateOf(next));
        return next;
      });
      toast.success("Review posted");
    },
    [onAggregateChange]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await api.reviews.remove(id);
        setReviews((prev) => {
          const next = prev.filter((r) => r.id !== id);
          onAggregateChange(aggregateOf(next));
          return next;
        });
        toast.success("Review deleted");
      } catch (err) {
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error("Could not delete review. Please try again.");
        }
      } finally {
        setDeletingId(null);
      }
    },
    [onAggregateChange]
  );

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-12 flex flex-col gap-5"
    >
      <header className="flex items-center justify-between gap-3">
        <h2 id="reviews-heading" className="text-[25px] font-bold">
          Reviews
        </h2>
        {aggregate.ratingCount > 0 && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <StarDisplay value={Math.round(aggregate.ratingAvg)} size="sm" />
            <span>
              {aggregate.ratingAvg.toFixed(1)} · {aggregate.ratingCount} review
              {aggregate.ratingCount === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </header>

      {status === "loading" ? null : status === "authenticated" ? (
        userHasReviewed ? (
          <p className="text-muted-foreground text-sm">
            Thanks for sharing your experience — you&apos;ve already reviewed
            this business.
          </p>
        ) : (
          <ReviewForm businessId={businessId} onCreated={handleCreated} />
        )
      ) : (
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/login?next=${encodeURIComponent(`/details/${businessId}`)}`}
            className="text-primary underline"
          >
            Log in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading reviews…</p>
      ) : error ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : (
        <ReviewList
          reviews={reviews}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </section>
  );
}

export { aggregateOf };
