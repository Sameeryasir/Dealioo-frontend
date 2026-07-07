import type { NextConfig } from "next";

const ngrokHost =
  process.env.NGROK_DEV_HOST?.trim() ||
  process.env.NEXT_PUBLIC_NGROK_HOST?.trim() ||
  "454c-182-185-34-34.ngrok-free.app";

const backendUrl =
  process.env.BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://localhost:4001";

const nextConfig: NextConfig = {
  allowedDevOrigins: [ngrokHost],
  async rewrites() {
    const apiBase = backendUrl.replace(/\/$/, "");
    return [
      {
        source: "/backend/:path*",
        destination: `${apiBase}/:path*`,
      },
      {
        source: "/sms/twilio/:path*",
        destination: `${apiBase}/sms/twilio/:path*`,
      },
    ];
  },
};

export default nextConfig;
