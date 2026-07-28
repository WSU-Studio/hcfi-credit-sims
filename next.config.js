/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS for plain Node (EB, next.config.js) */
/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require("next-intl/plugin");

// Relative path (Turbopack rejects absolute). Plugin aliases "next-intl/config" -> this file.
const withNextIntl = createNextIntlPlugin("i18n/request.ts");

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // CSP is applied at runtime in middleware (`lib/security/csp.ts`) via
  // CSP_ENFORCE so QA can flip Report-Only → enforce without a rebuild.
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig = {
  // Hide framework fingerprint from response headers (SOC finding #5).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
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
      // Pin to this project's S3 bucket host (not **.amazonaws.com wildcard).
      // Override via AWS_S3_BUCKET + AWS_REGION at build time when set.
      ...(process.env.AWS_S3_BUCKET && process.env.AWS_REGION
        ? [
            {
              protocol: 'https',
              hostname: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
            },
            {
              protocol: 'https',
              hostname: `${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`,
            },
          ]
        : [
            {
              protocol: 'https',
              hostname: 'hcfi-credit-sims-media.s3.ap-southeast-3.amazonaws.com',
            },
            {
              protocol: 'https',
              hostname: 'hcfi-credit-sims-media.s3.amazonaws.com',
            },
          ]),
      ...(process.env.NODE_ENV !== 'production'
        ? [{ protocol: 'http', hostname: 'localhost' }]
        : []),
    ],
    // SVG via next/image is disabled — serve SVG through the media proxy with CSP sandbox if needed.
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
};

module.exports = withNextIntl(nextConfig);
