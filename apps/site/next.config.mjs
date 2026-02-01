import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Note: Removed 'output: export' to support API routes for authentication
  images: {
    unoptimized: true,
  },
};

export default withMDX(config);
