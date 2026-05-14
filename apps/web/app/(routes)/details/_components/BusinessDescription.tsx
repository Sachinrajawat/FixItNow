"use client";

import Image from "next/image";
import type { Business } from "@/types";

interface BusinessDescriptionProps {
  business: Business;
}

const BusinessDescription = ({ business }: BusinessDescriptionProps) => {
  if (!business?.name) return null;

  return (
    <div>
      <h2 className="text-[25px] font-bold">Description</h2>
      <p className="text-muted-foreground mt-4 text-lg">{business.about}</p>

      {business.images.length > 0 && (
        <>
          <h2 className="mt-8 text-[25px] font-bold">Gallery</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {business.images.map((item, index) => (
              <Image
                key={`${item.url}-${index}`}
                src={item.url}
                alt={item.alt ?? `${business.name} gallery image ${index + 1}`}
                width={700}
                height={200}
                unoptimized
                className="h-[180px] w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessDescription;
