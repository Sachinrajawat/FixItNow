"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createReviewBodySchema, type Review } from "@fixitnow/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/apiClient";
import { StarPicker } from "./StarRating";

/** Form-only schema: businessId is supplied via props, not the user. */
const formSchema = createReviewBodySchema.omit({ businessId: true });
type ReviewFormValues = z.infer<typeof formSchema>;

interface ReviewFormProps {
  businessId: string;
  onCreated: (review: Review) => void;
}

export function ReviewForm({ businessId, onCreated }: ReviewFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const commentLength = (watch("comment") ?? "").length;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const created = await api.reviews.create({
        businessId,
        rating: values.rating,
        comment: values.comment?.trim() ? values.comment : undefined,
      });
      onCreated(created);
      reset({ rating: 0, comment: "" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError("You've already reviewed this business.");
      } else if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Could not submit review. Please try again.");
      }
    }
  });

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label="Leave a review"
      className="bg-card flex flex-col gap-4 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="review-rating">Your rating</Label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarPicker
              value={field.value}
              onChange={field.onChange}
              ariaLabel="Your rating"
            />
          )}
        />
        {errors.rating && (
          <p className="text-destructive text-sm">
            {errors.rating.message ?? "Please pick a rating"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Textarea
          id="review-comment"
          rows={4}
          maxLength={1000}
          placeholder="What stood out — quality, punctuality, value…"
          aria-invalid={!!errors.comment}
          {...register("comment")}
        />
        <div className="flex justify-between text-xs">
          {errors.comment ? (
            <span className="text-destructive">{errors.comment.message}</span>
          ) : (
            <span className="text-muted-foreground">
              Be specific and respectful.
            </span>
          )}
          <span
            className={
              commentLength > 900 ? "text-destructive" : "text-muted-foreground"
            }
          >
            {commentLength}/1000
          </span>
        </div>
      </div>

      {submitError && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Posting…" : "Post review"}
      </Button>
    </form>
  );
}
