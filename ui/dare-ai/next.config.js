/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  generateEtags: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:8000/api/:path*',
      },
      {
        source: '/rasa/:path*',
        destination: process.env.NEXT_PUBLIC_RASA_URL
          ? `${process.env.NEXT_PUBLIC_RASA_URL}/:path*`
          : 'http://localhost:5005/:path*',
      },
    ];
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RASA_URL: process.env.NEXT_PUBLIC_RASA_URL,
    NEXT_PUBLIC_DSPACE_URL: process.env.NEXT_PUBLIC_DSPACE_URL,
    NEXT_PUBLIC_APP_NAME: 'DARE AI Assistant',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  images: {
    unoptimized: true,
    domains: [
      'repo.dare.co.zw',
      'dare.co.zw',
      'localhost',
    ],
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
