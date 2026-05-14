"use client";

import { useEffect, useState } from "react";
import Hero from "./_components/Hero";
import CategoryList from "./_components/CategoryList";
import GlobalApi from "./_services/GlobalApi";
import BusinessList from "./_components/BusinessList";
import type { Business, Category } from "@/types";

interface CategoriesResponse {
  categories: Category[];
}

interface BusinessesResponse {
  businessLists: Business[];
}

export default function Home() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [businessList, setBusinessList] = useState<Business[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled<
      [Promise<CategoriesResponse>, Promise<BusinessesResponse>]
    >([
      GlobalApi.getCategory() as Promise<CategoriesResponse>,
      GlobalApi.getAllBusinessDetails() as Promise<BusinessesResponse>,
    ]).then(([categoriesRes, businessesRes]) => {
      if (cancelled) return;

      if (categoriesRes.status === "fulfilled") {
        setCategoryList(categoriesRes.value?.categories || []);
      } else {
        console.error("Failed to load categories", categoriesRes.reason);
      }

      if (businessesRes.status === "fulfilled") {
        setBusinessList(businessesRes.value?.businessLists || []);
      } else {
        console.error("Failed to load businesses", businessesRes.reason);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Hero />
      <CategoryList categoryList={categoryList} />
      <BusinessList businessList={businessList} title="Popular services" />
    </div>
  );
}
