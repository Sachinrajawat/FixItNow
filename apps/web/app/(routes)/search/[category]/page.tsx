"use client";

import { useEffect, useState } from "react";
import BusinessList from "@/app/_components/BusinessList";
import { api } from "@/lib/apiClient";
import type { Business } from "@/types";

interface BusinessByCategoryProps {
  params: { category: string };
}

const BusinessByCategory = ({ params }: BusinessByCategoryProps) => {
  const category = decodeURIComponent(params?.category ?? "");
  const [businessList, setBusinessList] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;
    const controller = new AbortController();
    setLoading(true);

    api.businesses
      .list({ category, limit: 24, signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setBusinessList(res.items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch businesses by category", err);
        setBusinessList([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category]);

  return (
    <BusinessList
      title={category}
      businessList={businessList}
      loading={loading}
      emptyMessage="No services in this category yet."
    />
  );
};

export default BusinessByCategory;
