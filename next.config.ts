import type { NextConfig } from "next";

// Photos are served from Cloudflare R2 (custom domain), not from Supabase storage.
const photosBaseUrl = process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: photosBaseUrl
      ? [
          {
            protocol: "https",
            hostname: new URL(photosBaseUrl).hostname,
          },
        ]
      : [],
  },
};

export default nextConfig;
