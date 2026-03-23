import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "globalchat-2d669.firebasestorage.app",
    ],
  },
};

export default nextConfig;
