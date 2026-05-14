"use client";

import { useEffect, useState } from "react";
import Hero from "./_components/Hero";
import CategoryList from "./_components/CategoryList";
import BusinessList from "./_components/BusinessList";
import { api } from "@/lib/apiClient";
import type { Business, Category } from "@/types";

export default function Home() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [businessList, setBusinessList] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    Promise.allSettled([
      api.categories.list(controller.signal),
      api.businesses.list({ limit: 8, signal: controller.signal }),
    ]).then(([categoriesRes, businessesRes]) => {
      if (controller.signal.aborted) return;

      if (categoriesRes.status === "fulfilled") {
        setCategoryList(categoriesRes.value.items);
      } else {
        console.error("Failed to load categories", categoriesRes.reason);
      }

      if (businessesRes.status === "fulfilled") {
        setBusinessList(businessesRes.value.items);
      } else {
        console.error("Failed to load businesses", businessesRes.reason);
      }

      setLoading(false);
    });

    return () => controller.abort();
  }, []);

  return (
    <div>
      <Hero />
      <CategoryList categoryList={categoryList} loading={loading} />
      <BusinessList
        businessList={businessList}
        title="Popular services"
        loading={loading}
      />
    </div>
  );
}
