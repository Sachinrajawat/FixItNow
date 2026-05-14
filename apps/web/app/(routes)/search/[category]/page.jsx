"use client";

import BusinessList from "@/app/_components/BusinessList";
import GlobalApi from "@/app/_services/GlobalApi";
import React, { useEffect, useState } from "react";

const BusinessByCategory = ({ params }) => {
  const [businessList, setBusinessList] = useState([]);
  const category = decodeURIComponent(params?.category || "");

  useEffect(() => {
    if (!category) return;

    let cancelled = false;
    GlobalApi.getBusinessByCategory(category)
      .then((res) => {
        if (!cancelled) setBusinessList(res?.businessLists || []);
      })
      .catch((err) => {
        console.error("Failed to fetch businesses by category", err);
        if (!cancelled) setBusinessList([]);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return <BusinessList title={category} businessList={businessList} />;
};

export default BusinessByCategory;
