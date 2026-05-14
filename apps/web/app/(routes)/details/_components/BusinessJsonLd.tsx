import type { Business } from "@fixitnow/types";
import { env } from "@/lib/env";

/**
 * Emits schema.org LocalBusiness structured data so search engines (and
 * Google's rich results) can render the business name, rating, and address
 * directly in SERPs. The shape is intentionally conservative — only fields
 * we can guarantee are populated.
 *
 * Renders as a non-blocking inline <script type="application/ld+json">.
 */
export function BusinessJsonLd({ business }: { business: Business }) {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const url = `${siteUrl}/details/${business.id}`;

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name: business.name,
    description: business.about,
    image: business.images.map((i) => i.url),
    url,
    telephone: business.phone,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
    },
  };

  if (business.location) {
    const [lng, lat] = business.location.coordinates;
    ld.geo = {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    };
  }

  if (business.ratingCount > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: business.ratingAvg,
      reviewCount: business.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      // schema.org JSON-LD must NOT escape forward slashes; React's text
      // node would. Use dangerouslySetInnerHTML for the canonical form.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
