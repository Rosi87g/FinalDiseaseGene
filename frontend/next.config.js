/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const baseUrl = rawUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig