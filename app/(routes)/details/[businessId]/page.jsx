"use client";

import GlobalApi from "@/app/_services/GlobalApi";
import { signIn, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import BusinessInfo from "../_components/BusinessInfo";
import SuggestedBusinessList from "../_components/SuggestedBusinessList";
import BusinessDescription from "../_components/BusinessDescription";

const BusinessDetails = ({ params }) => {
  const [business, setBusiness] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const { data, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("descope");
    }
  }, [status]);

  useEffect(() => {
    if (!params?.businessId || status !== "authenticated") return;

    let cancelled = false;
    setLoadingBusiness(true);

    GlobalApi.getBusinessById(params.businessId)
      .then((res) => {
        if (!cancelled) setBusiness(res.businessList || null);
      })
      .catch((err) => {
        console.error("Failed to fetch business", err);
        if (!cancelled) setBusiness(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingBusiness(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params?.businessId, status]);

  if (status === "loading" || (status === "authenticated" && loadingBusiness)) {
    return (
      <div
        role="status"
        className="flex min-h-[40vh] items-center justify-center"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <span className="sr-only">Loading service details…</span>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  if (!business) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Service not found.
      </p>
    );
  }

  return (
    <div className="px-6 py-8 md:px-36 md:py-20">
      <BusinessInfo business={business} />
      <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <BusinessDescription business={business} />
        </div>
        <aside>
          <SuggestedBusinessList business={business} />
        </aside>
      </div>
    </div>
  );
};

export default BusinessDetails;
