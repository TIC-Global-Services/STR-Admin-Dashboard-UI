import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns:[
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io'
      }
    ]
  },
  reactCompiler: true,
};

export default nextConfig;
