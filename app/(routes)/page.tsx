import { HomeRoute } from "@/app/components/landing/HomeRoute";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealioo",
  applicationName: "Dealioo",
  description:
    "Dealioo helps local businesses create branded deal funnels, collect payments, issue QR passes, run Meta and Google Ads, track redemptions, and automate repeat visits from one dashboard.",
  openGraph: {
    title: "Dealioo",
    siteName: "Dealioo",
    description:
      "Dealioo is the AI growth platform for local businesses — funnels, ads, payments, QR passes, and repeat-visit automation in one place.",
    url: "https://dealioo.io",
    type: "website",
  },
};

export default function Home() {
  return <HomeRoute />;
}
