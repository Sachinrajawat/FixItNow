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
    getCategoryList();
    getBusinessList();
  }, []);

  const getCategoryList = () => {
    GlobalApi.getCategory().then((response) => {
      setCategoryList(response.categories);
      // console.log(response);
    });
  };

  const getBusinessList = () => {
    GlobalApi.getAllBusinessDetails().then((response) => {
      setBusinessList(response.businessLists);
    });
  };
  return (
    <div>
      <Hero />
      <CategoryList categoryList={categoryList} />
      <BusinessList businessList={businessList} title={"Popular Services"} />
    </div>
  );
};

export default Home;
