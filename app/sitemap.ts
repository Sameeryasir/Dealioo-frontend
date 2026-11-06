import { getSiteOrigin } from "@/app/lib/site-origin";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();

  return [
    { url: `${origin}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${origin}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${origin}/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${origin}/meta/privacy-policy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${origin}/book-meeting`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
