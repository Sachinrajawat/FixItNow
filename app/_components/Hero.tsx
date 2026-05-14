"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const Hero = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search/${encodeURIComponent(trimmed)}`);
  };

  return (
    <section
      aria-labelledby="hero-heading"
      className="flex flex-col items-center justify-center gap-3 pb-7 pt-14"
    >
      <h1
        id="hero-heading"
        className="text-center text-4xl font-bold sm:text-[46px]"
      >
        Find Home
        <span className="text-primary"> Service / Repair</span>
        <br /> Near You
      </h1>
      <p className="text-center text-lg text-muted-foreground sm:text-xl">
        Discover trusted home-service professionals in your city.
      </p>

      <form
        role="search"
        onSubmit={handleSubmit}
        className="mt-4 flex w-full max-w-xl items-center gap-3 px-4 sm:px-0"
      >
        <label htmlFor="hero-search" className="sr-only">
          Search for a service
        </label>
        <Input
          id="hero-search"
          type="search"
          name="q"
          placeholder="Search for cleaning, plumbing, repair…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-[50px] flex-1 rounded-full"
        />
        <Button
          type="submit"
          aria-label="Search services"
          className="h-[50px] rounded-full"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
};

export default Hero;
