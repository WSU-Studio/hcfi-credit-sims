import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using Webpack for better Prisma compatibility
  // Turbopack has issues with Prisma module resolution in Next.js 16
};

export default nextConfig;
