/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for Replit deployment
  // Use default output (not standalone) for better Replit compatibility
  distDir: '.next',
}

module.exports = nextConfig
