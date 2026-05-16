/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  i18n: {
    locales: ['en-GB', 'es-ES', 'fr-FR', 'pt-BR'],
    defaultLocale: 'en-GB',
  },
  async rewrites() {
    return [
      // disabling rewrites by an inconsistent bug in that stuff
      // https://github.com/vercel/next.js/issues/51605
      // {
      //   source: '/gateway/api/:v1*',
      //   destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/:v1*`,
      // },
      // {
      //   source: '/api/v1/:v1*',
      //   destination: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/v1/:v1*`,
      // },
    ]
  },
  async headers() {
    return [
      {
        // Allow CORS for all CDN assets (widget JS, CSS, Lottie, images)
        source: '/cdn/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },

}

module.exports = nextConfig
