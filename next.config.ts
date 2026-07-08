import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      "http://localhost:4001/api";
    const apiBase = backendUrl.replace(/\/$/, "");

    return [
      {
        source: "/sms/twilio/:path*",
        destination: `${apiBase}/sms/twilio/:path*`,
      },
    ];
  },
};

export default nextConfig;
