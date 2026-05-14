import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Business } from "@/types";

interface BusinessListProps {
  businessList?: Business[];
  title: string;
  loading?: boolean;
  emptyMessage?: string;
}

const SkeletonCard = () => (
  <div
    className="bg-muted h-[300px] w-full animate-pulse rounded-lg"
    aria-hidden="true"
  />
);

const BusinessList = ({
  businessList = [],
  title,
  loading = false,
  emptyMessage = "No services match your search yet.",
}: BusinessListProps) => {
  const hasResults = businessList.length > 0;
  const showSkeleton = loading && !hasResults;

  return (
    <section aria-labelledby="business-list-heading" className="mt-5">
      <h2
        id="business-list-heading"
        className="text-[22px] font-bold capitalize"
      >
        {title}
      </h2>

      {showSkeleton && (
        <div
          className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
          aria-label="Loading services"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {!showSkeleton && !hasResults && (
        <p className="text-muted-foreground mt-6 text-sm">{emptyMessage}</p>
      )}

      {hasResults && (
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {businessList.map((business) => {
            const firstImage = business.images[0]?.url ?? "/logo.png";
            return (
              <Link
                href={`/details/${business.id}`}
                key={business.id}
                className="hover:shadow-primary/30 group rounded-lg shadow-md transition-all ease-in-out hover:scale-[1.02] hover:shadow-lg"
              >
                <Image
                  src={firstImage}
                  alt={business.name}
                  width={500}
                  height={200}
                  className="h-[150px] w-full rounded-t-lg object-cover md:h-[200px]"
                  unoptimized
                />
                <div className="flex flex-col items-baseline gap-1 p-3">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-primary rounded-full bg-purple-100 px-2 py-1 text-[12px]">
                      {business.category.name}
                    </span>
                    {business.ratingCount > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {business.ratingAvg.toFixed(1)} ({business.ratingCount})
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold">{business.name}</h3>
                  <p className="text-primary">{business.contactPerson}</p>
                  <p className="text-muted-foreground text-sm">
                    {business.address}
                  </p>
                  <Button className="mt-3 rounded-lg">Book now</Button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default BusinessList;
