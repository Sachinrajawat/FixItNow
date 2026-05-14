"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type {
  Category,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "@fixitnow/types";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError, api } from "@/lib/apiClient";
import { CategoryForm } from "./_components/CategoryForm";

/**
 * Returns a copy of `list` with `next` either added (when its id is new) or
 * substituted in place (when it's an update). Keeps the alphabetical sort.
 */
function upsertSorted(list: Category[], next: Category): Category[] {
  const filtered = list.filter((c) => c.id !== next.id);
  const merged = [...filtered, next];
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    return api.categories
      .list(signal)
      .then((res) => {
        if (signal?.aborted) return;
        setCategories(
          [...res.items].sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch((err: unknown) => {
        if (signal?.aborted) return;
        console.error("Failed to load categories", err);
        setError("Could not load categories. Try refreshing the page.");
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const handleCreate = useCallback(async (body: CreateCategoryBody) => {
    const created = await api.categories.create(body);
    setCategories((prev) => upsertSorted(prev, created));
    toast.success(`Created "${created.name}"`);
  }, []);

  const handleUpdate = useCallback(
    async (id: string, body: UpdateCategoryBody) => {
      const updated = await api.categories.update(id, body);
      setCategories((prev) => upsertSorted(prev, updated));
      setEditing(null);
      toast.success(`Saved "${updated.name}"`);
    },
    []
  );

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await api.categories.remove(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error(
          "This category is still used by one or more businesses — reassign them first."
        );
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Delete failed. Please try again.");
      }
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }, []);

  const sortedCategories = useMemo(() => categories, [categories]);

  return (
    <section className="flex flex-col gap-8">
      <div className="bg-card flex flex-col gap-4 rounded-lg border p-5">
        <header>
          <h2 className="text-xl font-semibold">Create a category</h2>
          <p className="text-muted-foreground text-sm">
            Categories show up on the home tiles and in the search sidebar.
          </p>
        </header>
        <CategoryForm submitLabel="Create" onSubmit={handleCreate} />
      </div>

      <div className="bg-card flex flex-col gap-4 rounded-lg border">
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">All categories</h2>
            <p className="text-muted-foreground text-sm">
              {sortedCategories.length} total
            </p>
          </div>
        </header>

        {loading ? (
          <p className="text-muted-foreground p-5 text-sm">Loading…</p>
        ) : error ? (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive m-5 rounded-md px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : sortedCategories.length === 0 ? (
          <p className="text-muted-foreground p-5 text-sm">
            No categories yet. Create your first one above.
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Categories list"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="px-5 py-3 font-medium">Icon</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((c) => {
                  const isConfirming = confirmingId === c.id;
                  const isDeleting = deletingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      data-testid={`category-row-${c.id}`}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-5 py-3">
                        <Image
                          src={c.iconUrl}
                          alt={`${c.name} icon`}
                          width={28}
                          height={28}
                          unoptimized
                          className="rounded"
                        />
                      </td>
                      <td className="px-5 py-3 font-medium">{c.name}</td>
                      <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                        {c.slug}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Edit ${c.name}`}
                            onClick={() => setEditing(c)}
                          >
                            <Pencil className="mr-1 h-3 w-3" /> Edit
                          </Button>
                          {isConfirming ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                aria-label={`Confirm delete ${c.name}`}
                                onClick={() => handleDelete(c.id)}
                              >
                                {isDeleting ? "Deleting…" : "Confirm"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isDeleting}
                                onClick={() => setConfirmingId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Delete ${c.name}`}
                              onClick={() => setConfirmingId(c.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit category</SheetTitle>
            <SheetDescription>
              Update the display name or icon for this category.
            </SheetDescription>
          </SheetHeader>
          {editing && (
            <div className="mt-6">
              <CategoryForm
                initial={editing}
                submitLabel="Save changes"
                onSubmit={(body) => handleUpdate(editing.id, body)}
                onCancel={() => setEditing(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
