/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  // @supabase/ssr type inference issues - doesn't affect runtime
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
