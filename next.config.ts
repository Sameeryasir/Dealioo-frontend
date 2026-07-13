import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the app through the public ngrok frontend URL in local dev.
  allowedDevOrigins: ["washday-grooving-maximize.ngrok-free.dev"],
  async redirects() {
    return [
      {
        source: "/restaurant/register",
        destination: "/business/register",
        permanent: false,
      },
      {
        source: "/restaurant/upload-menu",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/business/upload-menu",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/setup/menu",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/restaurant/:businessId/dashboard/:path*",
        destination: "/business/:businessId/dashboard/:path*",
        permanent: false,
      },
    ];
  },
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
