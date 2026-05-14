/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
  images: {
    domains: ['*'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Vercel serverless function configuration
  serverRuntimeConfig: {
    maxDuration: 60, // Maximum execution time for scraping
  },
};

module.exports = nextConfig;
