"use client";

import { useCallback, useEffect, useState } from "react";
import BusinessInfo from "../_components/BusinessInfo";
import SuggestedBusinessList from "../_components/SuggestedBusinessList";
import BusinessDescription from "../_components/BusinessDescription";
import { ReviewSection } from "../_components/ReviewSection";
import { api, ApiError } from "@/lib/apiClient";
import type { Business } from "@/types";

interface BusinessDetailsProps {
  params: { businessId: string };
}

const BusinessDetails = ({ params }: BusinessDetailsProps) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.businessId) return;
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);

    api.businesses
      .get(params.businessId, controller.signal)
      .then((b) => {
        if (controller.signal.aborted) return;
        setBusiness(b);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          console.error("Failed to fetch business", err);
        }
        setBusiness(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params?.businessId]);

  const handleAggregateChange = useCallback(
    (next: { ratingAvg: number; ratingCount: number }) => {
      setBusiness((prev) => (prev ? { ...prev, ...next } : prev));
    },
    []
  );

  if (loading) {
    return (
      <div
        role="status"
        className="flex min-h-[40vh] items-center justify-center"
      >
        <div className="border-muted border-t-primary h-10 w-10 animate-spin rounded-full border-4" />
        <span className="sr-only">Loading service details…</span>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <p className="text-muted-foreground py-20 text-center">
        Service not found.
      </p>
    );
  }

  return (
    <div className="px-6 py-8 md:px-36 md:py-20">
      <BusinessInfo business={business} />
      <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <BusinessDescription business={business} />
          <ReviewSection
            businessId={business.id}
            aggregate={{
              ratingAvg: business.ratingAvg,
              ratingCount: business.ratingCount,
            }}
            onAggregateChange={handleAggregateChange}
          />
        </div>
        <aside>
          <SuggestedBusinessList business={business} />
        </aside>
      </div>
    </div>
  );
};

export default BusinessDetails;
