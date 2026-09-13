/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // The API base can be overridden at build time for deployments.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
};

module.exports = nextConfig;
