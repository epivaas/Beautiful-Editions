import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yonkrnkplxozqyxyuxyd.supabase.co",
      },
    ],
  },
};

export default nextConfig;
