/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'] },
  images: { unoptimized: true },
}
module.exports = nextConfig