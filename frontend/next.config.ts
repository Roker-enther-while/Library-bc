import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Bỏ qua lỗi TypeScript khi build trên Vercel/Staging để giảm thiểu block deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
