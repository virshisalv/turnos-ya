import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Las fotos de perfil (hasta 2 MB) viajan en un server action.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
