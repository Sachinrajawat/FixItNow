import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import { Clock, Mail, MapPin, Share, User } from "lucide-react";

const BusinessInfo = ({ business }) => {
  return (
    business?.name && (
      <div className="items-center gap-4 md:flex">
        <Image
          src={business?.images[0]?.url}
          alt={business.name}
          width={150}
          height={200}
          className="h-[150px] rounded-full object-cover"
        />
        <div className="flex w-full items-center justify-between">
          <div className="mt-4 flex flex-col items-baseline gap-3 md:mt-0">
            <h2 className="rounded-full bg-purple-100 p-1 px-3 text-lg text-primary">
              {business?.category?.name}
            </h2>
            <h2 className="text-[40px] font-bold">{business?.name}</h2>

            <h2 className="flex gap-2 text-lg text-gray-500">
              <MapPin />
              {business.address}
            </h2>
            <h2 className="flex gap-2 text-lg text-gray-500">
              <Mail />
              {business.email}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-5">
            <Button>
              <Share />
            </Button>
            <h2 className="flex gap-2 text-xl text-primary">
              <User />
              {business.contactPerson}
            </h2>
            <h2 className="flex gap-2 text-xl text-gray-500">
              <Clock /> Available 8:00 AM to 10:00 PM
            </h2>
          </div>
        </div>
      </div>
    )
  );
};

export default BusinessInfo;
