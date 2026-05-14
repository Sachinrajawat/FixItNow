"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategoryBodySchema,
  type Category,
  type CreateCategoryBody,
} from "@fixitnow/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/apiClient";

interface CategoryFormProps {
  /** When provided the form switches to "edit" mode and prefills inputs. */
  initial?: Pick<Category, "id" | "name" | "iconUrl"> | null;
  submitLabel?: string;
  onSubmit: (values: CreateCategoryBody) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Shared create/edit form for categories.
 *
 * Validates against the *same* `createCategoryBodySchema` the API uses, so
 * the only thing the dashboard does differently is what it sends on submit
 * — POST vs. PATCH.
 */
export function CategoryForm({
  initial = null,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nameId = useId();
  const iconId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryBody>({
    resolver: zodResolver(createCategoryBodySchema),
    defaultValues: {
      name: initial?.name ?? "",
      iconUrl: initial?.iconUrl ?? "",
    },
  });

  // Reset when the initial value changes (e.g. opening the Sheet for a
  // different row), otherwise stale defaults stick around.
  useEffect(() => {
    reset({
      name: initial?.name ?? "",
      iconUrl: initial?.iconUrl ?? "",
    });
  }, [initial?.id, initial?.name, initial?.iconUrl, reset]);

  const handle = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
      if (!initial) reset({ name: "", iconUrl: "" });
    } catch (err) {
      if (err instanceof ApiError) setSubmitError(err.message);
      else setSubmitError("Save failed. Please try again.");
    }
  });

  return (
    <form
      noValidate
      onSubmit={handle}
      aria-label={initial ? "Edit category" : "Create category"}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          autoComplete="off"
          placeholder="Cleaning"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={iconId}>Icon URL</Label>
        <Input
          id={iconId}
          type="url"
          autoComplete="off"
          placeholder="https://cdn.example.com/icon.png"
          aria-invalid={!!errors.iconUrl}
          {...register("iconUrl")}
        />
        {errors.iconUrl && (
          <p className="text-destructive text-sm">{errors.iconUrl.message}</p>
        )}
      </div>

      {submitError && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {submitError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
