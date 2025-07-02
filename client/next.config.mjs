// next.config.mjs
import mdx from "@next/mdx";

/** @type {import('@next/mdx').NextMDXOptions} */
const mdxOptions = { /* … */ };
const withMDX = mdx(mdxOptions);

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ["js","jsx","ts","tsx","md","mdx"],
  transpilePackages: ["@argent/tma-wallet"],
  experimental: { mdxRs: true },
  eslint:    { ignoreDuringBuilds: true },
  typescript:{ ignoreBuildErrors: true },
  images:    { unoptimized: true },
  webpack: (config) => {
    config.resolve.fallback = { fs:false, net:false, tls:false };
    return config;
  },

  env: {
    NEXT_PUBLIC_DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  }
});

export default nextConfig;
