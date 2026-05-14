import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { Business } from "@/types";

interface BusinessListProps {
  businessList?: Business[];
  title: string;
}

const SkeletonCard = () => (
  <div
    className="h-[300px] w-full animate-pulse rounded-lg bg-muted"
    aria-hidden="true"
  />
);

const BusinessList = ({ businessList = [], title }: BusinessListProps) => {
  const hasResults = businessList.length > 0;

  return (
    <section aria-labelledby="business-list-heading" className="mt-5">
      <h2
        id="business-list-heading"
        className="text-[22px] font-bold capitalize"
      >
        {title}
      </h2>

      {!hasResults && (
        <div
          className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
          aria-label="Loading services"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {hasResults && (
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {businessList.map((business) => (
            <Link
              href={`/details/${business.id}`}
              key={business.id}
              className="group rounded-lg shadow-md transition-all ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30"
            >
              <Image
                src={business?.images?.[0]?.url || "/logo.png"}
                alt={business.name}
                width={500}
                height={200}
                className="h-[150px] w-full rounded-t-lg object-cover md:h-[200px]"
              />
              <div className="flex flex-col items-baseline gap-1 p-3">
                <span className="rounded-full bg-purple-100 px-2 py-1 text-[12px] text-primary">
                  {business?.category?.name}
                </span>
                <h3 className="text-lg font-bold">{business.name}</h3>
                <p className="text-primary">{business.contactPerson}</p>
                <p className="text-sm text-muted-foreground">
                  {business.address}
                </p>
                <Button className="mt-3 rounded-lg">Book Now</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default BusinessList;
