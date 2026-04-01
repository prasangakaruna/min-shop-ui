/** @type {import('next').NextConfig} */
const nextConfig = {
  // Behind nginx TLS termination: without this, Next builds request URLs as
  // https://localhost:3000 (proto from x-forwarded-proto + Node listen host),
  // which breaks Auth.js redirects and OAuth callbacks. AUTH_TRUST_HOST only
  // affects Auth.js; this flag is what makes Next use req.headers.host.
  experimental: {
    trustHostHeader: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
      },
      {
        protocol: 'https',
        hostname: 'mint-market-dev.s3.eu-north-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 's3.eu-north-1.amazonaws.com',
        pathname: '/mint-market-dev/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/storage/**',
      },
    ],
  },
}

module.exports = nextConfig
