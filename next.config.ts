import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Profile photos + card images live in Supabase Storage (kit-media bucket).
      {
        protocol: "https",
        hostname: "nickawqnasvpmyrsgwdk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
