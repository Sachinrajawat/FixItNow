/**
 * Dynamic sitemap.
 *
 * Pulls live business + category data straight from the API at build/render
 * time. Falls back to a static set when the API is unreachable so a missing
 * upstream never breaks `next build` (e.g. during CI without the API).
 */
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const API_URL = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

interface CategoryItem {
  slug: string;
  updatedAt: string;
}
interface BusinessItem {
  id: string;
  slug: string;
  updatedAt: string;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      // Sitemap regenerates every hour — good enough for SEO and keeps
      // build-time fetches fast.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [categoriesRes, businessesRes] = await Promise.all([
    fetchJson<{ items: CategoryItem[] }>("/categories"),
    fetchJson<{ items: BusinessItem[] }>("/businesses?limit=100"),
  ]);

  const categoryEntries: MetadataRoute.Sitemap =
    categoriesRes?.items?.map((c) => ({
      url: `${SITE_URL}/search/${encodeURIComponent(c.slug)}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    })) ?? [];

  const businessEntries: MetadataRoute.Sitemap =
    businessesRes?.items?.map((b) => ({
      url: `${SITE_URL}/details/${b.id}`,
      lastModified: new Date(b.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    })) ?? [];

  return [...staticEntries, ...categoryEntries, ...businessEntries];
}
