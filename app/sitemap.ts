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
