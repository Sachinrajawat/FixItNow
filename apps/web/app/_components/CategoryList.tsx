import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";

interface CategoryListProps {
  categoryList?: Category[];
}

const SkeletonTile = () => (
  <div
    className="bg-muted h-[120px] w-full animate-pulse rounded-lg"
    aria-hidden="true"
  />
);

const CategoryList = ({ categoryList = [] }: CategoryListProps) => {
  const hasResults = categoryList.length > 0;

  return (
    <nav
      aria-label="Service categories"
      className="md:mx-22 mx-4 mt-2 grid grid-cols-3 gap-4 md:grid-cols-4 lg:mx-52 lg:grid-cols-6"
    >
      {hasResults
        ? categoryList.map((category) => (
            <Link
              href={`/search/${encodeURIComponent(category.name)}`}
              key={category.id}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-purple-50 p-5 transition-all ease-in-out hover:scale-105"
            >
              <Image
                src={category.icon.url}
                alt={`${category.name} icon`}
                width={35}
                height={35}
              />
              <span className="text-primary">{category.name}</span>
            </Link>
          ))
        : Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTile key={`category-skeleton-${i}`} />
          ))}
    </nav>
  );
};

export default CategoryList;
