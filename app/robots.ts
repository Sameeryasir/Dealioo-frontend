import { getSiteOrigin } from "@/app/lib/site-origin";
import type { MetadataRoute } from "next";

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
