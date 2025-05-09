// next.config.mjs
import mdx from "@next/mdx";

/** @type {import('@next/mdx').NextMDXOptions} */
const mdxOptions = {
  // Add MDX plugins here if needed:
  // remarkPlugins: [],
  // rehypePlugins: [],
  // Enable the new Rust-based MDX compiler (optional)
  options: {
    mdxRs: true,
  },
};

const withMDX = mdx(mdxOptions);

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  transpilePackages: ["@argent/tma-wallet"],
  experimental: {
    mdxRs: true, // Optional: Enable Rust-based MDX compiler
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  publicRuntimeConfig: {
    API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://default-api.example.com",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "dummy-key",
    BRIAN_API_KEY: process.env.BRIAN_API_KEY || "dummy-key",
  },
};

export default withMDX(nextConfig);
