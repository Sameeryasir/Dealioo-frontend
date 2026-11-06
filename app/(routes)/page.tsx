import { HomeLandingGate } from "@/app/components/landing/HomeLandingGate";
import { LandingJsonLd } from "@/app/components/landing/LandingJsonLd";
import { getSiteOrigin } from "@/app/lib/site-origin";
import type { Metadata } from "next";

const siteOrigin = getSiteOrigin();
const homeUrl = `${siteOrigin}/`;

const title = "Dealioo | AI Growth Platform for Local Businesses";
const description =
  "Dealioo helps local businesses create branded deal funnels, collect payments, issue QR passes, run Meta and Google Ads, track redemptions, and automate repeat visits from one dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: title,
    absolute: title,
  },
  applicationName: "Dealioo",
  description,
  keywords: [
    "Dealioo",
    "local business marketing",
    "deal funnel",
    "Meta ads",
    "Google Ads",
    "QR pass",
    "customer retention",
    "restaurant promotions",
  ],
  authors: [{ name: "Dealioo", url: siteOrigin }],
  creator: "Dealioo",
  publisher: "Dealioo",
  category: "business",
  alternates: {
    canonical: homeUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title,
    description,
    url: homeUrl,
    siteName: "Dealioo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function Home() {
  return (
    <>
      <LandingJsonLd />
      <HomeLandingGate />
    </>
  );
}
