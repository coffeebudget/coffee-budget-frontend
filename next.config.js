/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.cy.{js,jsx,ts,tsx}': {
        loaders: [],
        as: '*.js',
      },
    },
  },

  // Webpack configuration (used during production build)
  webpack: (config) => {
    config.module.rules.push({
      test: /cypress/,
      use: 'ignore-loader',
    });
    return config;
  },

  // 🔒 SECURITY: Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 