import type { MetadataRoute } from "next";

function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/$/, "");
  if (
    fromEnv &&
    fromEnv.startsWith("https://") &&
    !fromEnv.includes("localhost") &&
    !fromEnv.includes("ngrok")
  ) {
    return fromEnv;
  }
  return "https://dealioo.io";
}

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/business/",
          "/auth/",
          "/pass/",
          "/stripe/",
          "/facebook/",
          "/google/",
          "/accept-invitation",
          "/payment/",
          "/register",
          "/meta/success",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
