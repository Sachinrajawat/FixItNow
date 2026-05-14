import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth-gated routes have no value for crawlers and surface PII.
        disallow: ["/admin", "/admin/", "/mybooking", "/mybooking/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
