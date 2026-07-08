import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Character/actor photos are admin-entered from many different sites, so we
    // allow any HTTPS host. Tradeoff: the image optimizer will fetch/resize any
    // https URL used as a src (fine for this app; sources are curated by admin).
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;