"use client";

import React, { useEffect, useState } from "react";
import Hero from "./_components/Hero";
import CategoryList from "./_components/CategoryList";
import GlobalApi from "./_services/GlobalApi";
import BusinessList from "./_components/BusinessList";

const Home = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [businessList, setBusinessList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      GlobalApi.getCategory(),
      GlobalApi.getAllBusinessDetails(),
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
};

export default Home;
