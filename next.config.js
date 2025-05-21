/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js', 'sharp'],
    outputFileTracingRoot: process.cwd(),
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mengabaikan type checking pada saat build untuk memaksimalkan performa di Replit Free Tier
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;