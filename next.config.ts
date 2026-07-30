import path from "node:path";
import type { NextConfig } from "next";

// --- Dev origins for ngrok / public frontend URL ---
// Why: Next blocks client JS on unknown origins; stale ngrok host = stuck "Connecting Facebook…" with no redirect.
function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();
  if (frontendUrl) {
    try {
      origins.add(new URL(frontendUrl).host);
    } catch {
      /* ignore invalid FRONTEND_URL */
    }
  }
  // Keep prior tunnel host so older bookmarks still hydrate.
  origins.add("washday-grooving-maximize.ngrok-free.dev");
  origins.add("grimacing-antler-ensure.ngrok-free.dev");
  return [...origins];
}

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app so parent lockfiles cannot steal resolution.
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow opening the app through the public ngrok frontend URL in local dev.
  allowedDevOrigins: getAllowedDevOrigins(),
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
        source: "/api/:path*",
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
