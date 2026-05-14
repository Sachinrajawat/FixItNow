"use client";
import React, { useState, useEffect } from "react";
import GlobalApi from "@/app/_services/GlobalApi";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SideCategoryBar = () => {
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const params = usePathname();
  params.split("/")[2];

  useEffect(() => {
    getCategoryList();
  }, []);

  useEffect(() => {
    params && setSelectedCategory(params.split("/")[2]);
  }, [params]);

  const getCategoryList = () => {
    GlobalApi.getCategory().then((response) => {
      setCategoryList(response.categories);
    });
  };

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-primary">Categories</h2>
      <div>
        {categoryList.map((category, index) => (
          <Link
            href={"/search/" + category.name}
            key={index}
            className={`mb-3 flex cursor-pointer items-center gap-2 rounded-lg border p-3 hover:border-primary hover:bg-purple-50 hover:text-primary hover:shadow-md md:mr-10 ${
              selectedCategory == category.name &&
              "border-primary bg-purple-50 text-primary shadow-md"
            } `}
          >
            <Image src={category.icon.url} alt="icon" width={30} height={30} />
            <h2>{category.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SideCategoryBar;
