import type { NextConfig } from "next";

/** Host only (no https://) — must match your ngrok subdomain. Restart `npm run dev` after changes. */
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
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
