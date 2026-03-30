import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép truy cập từ các địa chỉ Network (IP cục bộ) khi dev
  allowedDevOrigins: [
    '172.28.32.1',
    '172.16.0.1',
    '192.168.227.1',
    '192.168.192.1',
    '192.168.100.147',
  ],
  typescript: {
    // !! WARN !!
    // Bỏ qua lỗi TypeScript khi build trên Vercel/Staging để giảm thiểu block deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bỏ qua lỗi ESLint khi build trên Vercel/Staging
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
