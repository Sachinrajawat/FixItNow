import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    instrumentationHook: true,
  },
  images: {
    // Phase 2 Step 3: remote business/category images are served `unoptimized`
    // because the API can return arbitrary HTTPS URLs. We keep a few common
    // hosts whitelisted in case a caller wants to opt-in to optimisation.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
    ],
  },
};

// Only wrap with Sentry when configured. This avoids needing a SENTRY_AUTH_TOKEN
// at build time in environments that don't use Sentry (CI, contributors, etc).
const sentryEnabled =
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT);

const sentryOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
};

export default sentryEnabled
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
