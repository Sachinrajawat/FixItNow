"use client";

import Image from "next/image";
import { Clock, Mail, MapPin, Phone, Share2, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Business } from "@/types";

interface BusinessInfoProps {
  business: Business;
}

const BusinessInfo = ({ business }: BusinessInfoProps) => {
  if (!business?.name) return null;

  const heroImage = business.images[0]?.url ?? "/logo.png";

  return (
    <div className="items-center gap-4 md:flex">
      <Image
        src={heroImage}
        alt={business.name}
        width={150}
        height={200}
        unoptimized
        className="h-[150px] w-[150px] rounded-full object-cover"
      />
      <div className="flex w-full items-center justify-between">
        <div className="mt-4 flex flex-col items-baseline gap-3 md:mt-0">
          <h2 className="text-primary rounded-full bg-purple-100 p-1 px-3 text-lg">
            {business.category.name}
          </h2>
          <h2 className="text-[40px] font-bold">{business.name}</h2>
          <h2 className="flex gap-2 text-lg text-gray-500">
            <MapPin />
            {business.address}
          </h2>
          <h2 className="flex gap-2 text-lg text-gray-500">
            <Mail />
            {business.email}
          </h2>
          {business.phone && (
            <h2 className="flex gap-2 text-lg text-gray-500">
              <Phone />
              {business.phone}
            </h2>
          )}
        </div>
        <div className="flex flex-col items-end gap-5">
          <Button aria-label="Share">
            <Share2 />
          </Button>
          <h2 className="text-primary flex gap-2 text-xl">
            <User />
            {business.contactPerson}
          </h2>
          {business.ratingCount > 0 && (
            <h2 className="flex gap-2 text-xl text-gray-500">
              <Star className="text-yellow-400" />
              {business.ratingAvg.toFixed(1)} ({business.ratingCount} reviews)
            </h2>
          )}
          <h2 className="flex gap-2 text-xl text-gray-500">
            <Clock /> Available 8:00 AM to 10:00 PM
          </h2>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfo;
