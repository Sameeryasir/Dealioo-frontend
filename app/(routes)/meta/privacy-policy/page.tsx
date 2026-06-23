import type { Metadata } from "next";
import { MetaPrivacyPolicyContent } from "@/app/components/legal/MetaPrivacyPolicyContent";

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/$/, "") ??
  "http://localhost:3002";
const privacyUrl = `${baseUrl}/privacy`;

export const metadata: Metadata = {
  title: "Privacy Policy — Meta Integration | OnlyDeals",
  description:
    "How OnlyDeals uses Meta (Facebook) data when you connect your account, publish ads, and view campaign performance.",
  alternates: {
    canonical: privacyUrl,
  },
  openGraph: {
    title: "Privacy Policy | OnlyDeals",
    url: privacyUrl,
  },
};

export default function MetaPrivacyPolicyPage() {
  return <MetaPrivacyPolicyContent />;
}
