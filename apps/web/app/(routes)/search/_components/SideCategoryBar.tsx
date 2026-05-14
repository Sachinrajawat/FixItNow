"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/apiClient";
import type { Category } from "@/types";

const SideCategoryBar = () => {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const pathname = usePathname() ?? "";
  const activeSegment = decodeURIComponent(pathname.split("/")[2] ?? "");

  useEffect(() => {
    const controller = new AbortController();
    api.categories
      .list(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setCategoryList(res.items);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load categories", err);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h2 className="text-primary mb-3 text-lg font-bold">Categories</h2>
      <div>
        {categoryList.map((category) => {
          const isActive =
            activeSegment === category.slug || activeSegment === category.name;
          return (
            <Link
              href={`/search/${encodeURIComponent(category.slug)}`}
              key={category.id}
              className={`hover:border-primary hover:text-primary mb-3 flex cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-purple-50 hover:shadow-md md:mr-10 ${
                isActive
                  ? "border-primary text-primary bg-purple-50 shadow-md"
                  : ""
              }`}
            >
              <Image
                src={category.iconUrl}
                alt={`${category.name} icon`}
                width={30}
                height={30}
                unoptimized
              />
              <span>{category.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SideCategoryBar;
