import './src/lib/env'; // Validates all env vars at build/dev startup
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
