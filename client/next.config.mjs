/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@argent/tma-wallet'],
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false
    };
    return config;
  },
  publicRuntimeConfig: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://default-api.example.com',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy-key',
    BRIAN_API_KEY: process.env.BRIAN_API_KEY || 'dummy-key'
  }
}

export default nextConfig;