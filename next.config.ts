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
      // YouTube thumbnails for the Portfolio card.
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      // Amazon image CDN — used for VDP video thumbnails (og:image).
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
