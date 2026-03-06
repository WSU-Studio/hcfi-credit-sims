/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require("next-intl/plugin");

// Relative path (Turbopack rejects absolute). Plugin aliases "next-intl/config" -> this file.
const withNextIntl = createNextIntlPlugin("i18n/request.ts");

const nextConfig = {
  // Using Webpack for better Prisma compatibility
  // Turbopack has issues with Prisma module resolution in Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
};

module.exports = withNextIntl(nextConfig);
