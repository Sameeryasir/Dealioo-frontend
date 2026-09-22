import type { Metadata } from "next";
import { TermsOfServiceContent } from "@/app/components/legal/TermsOfServiceContent";

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/$/, "") ??
  "http://localhost:3002";
const termsUrl = `${baseUrl}/terms`;

export const metadata: Metadata = {
  title: "Terms of Service | Dealioo",
  description:
    "Review the terms governing your use of Dealioo, including subscriptions, advertising integrations, payments, messaging, promotions, and platform responsibilities.",
  alternates: {
    canonical: termsUrl,
  },
  openGraph: {
    title: "Terms of Service | Dealioo",
    url: termsUrl,
  },
};

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />;
}
