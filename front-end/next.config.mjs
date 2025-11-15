/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['storewave-sdk'],
  serverExternalPackages: ['@mysten/walrus'],
}

export default nextConfig
