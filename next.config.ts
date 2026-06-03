import type { NextConfig } from "next";

/** Host only (no https://) — must match your ngrok subdomain. Restart `npm run dev` after changes. */
const ngrokHost =
  process.env.NGROK_DEV_HOST?.trim() ||
  process.env.NEXT_PUBLIC_NGROK_HOST?.trim() ||
  "00de-182-185-34-34.ngrok-free.app";

const nextConfig: NextConfig = {
  allowedDevOrigins: [ngrokHost],
};

export default nextConfig;
