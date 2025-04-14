import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import React from "react";

const Hero = () => {
  return (
    <div className="flex items-center gap-3 flex-col justify-center pt-14 pb-7">
      <h2 className="font-bold text-[46px] text-center">
        Find Home
        <span className="text-primary"> Service/Repair</span> <br /> Near You
      </h2>
      <h2 className="text-xl text-gray-400">
        Explore Best Home Service & Repair Near you
      </h2>
      <div className="mt-4 flex items-center gap-3">
        <Input
          placeholder="search"
          className="rounded-full w-[400px] h-[50px]"
        />
        <Button className="rounded-full h-[50px]">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Hero;
