"use client";

import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BookingSection from "./BookingSection";
import { api } from "@/lib/apiClient";
import type { Business } from "@/types";

interface SuggestedBusinessListProps {
  business: Business;
}

const SuggestedBusinessList = ({ business }: SuggestedBusinessListProps) => {
  const [businessList, setBusinessList] = useState<Business[]>([]);

  useEffect(() => {
    const categorySlug = business?.category?.slug;
    if (!categorySlug) return;
    const controller = new AbortController();
    api.businesses
      .list({
        category: categorySlug,
        limit: 6,
        signal: controller.signal,
      })
      .then((res) => {
        if (controller.signal.aborted) return;
        setBusinessList(res.items.filter((b) => b.id !== business.id));
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load similar businesses", err);
        }
      });
    return () => controller.abort();
  }, [business?.category?.slug, business?.id]);

  return (
    <div className="md:pl-10">
      <BookingSection business={business}>
        <Button className="flex w-full gap-2">
          <NotebookPen className="h-4 w-4" />
          Book appointment
        </Button>
      </BookingSection>

      <div className="hidden md:block">
        <h2 className="mb-3 mt-3 text-lg font-bold">Similar businesses</h2>
        <div>
          {businessList.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No similar businesses yet.
            </p>
          )}
          {businessList.map((item) => {
            const firstImage = item.images[0]?.url ?? "/logo.png";
            return (
              <Link
                href={`/details/${item.id}`}
                key={item.id}
                className="border-primary text-primary mb-4 flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:border hover:shadow-md"
              >
                <Image
                  src={firstImage}
                  alt={item.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-[100px] w-[80px] rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-primary">{item.contactPerson}</p>
                  <p className="text-muted-foreground">{item.address}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SuggestedBusinessList;
