import type { Metadata } from "next";
import { MetaPrivacyPolicyContent } from "@/app/components/legal/MetaPrivacyPolicyContent";

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/$/, "") ??
  "http://localhost:3002";
const privacyUrl = `${baseUrl}/privacy`;

export const metadata: Metadata = {
  title: "Privacy Policy | Dealioo",
  description:
    "Dealioo privacy policy, Meta integration, data collection, and how we protect your information.",
  alternates: {
    canonical: privacyUrl,
  },
  openGraph: {
    title: "Privacy Policy | Dealioo",
    url: privacyUrl,
  },
};

export default function PrivacyPolicyPage() {
  return <MetaPrivacyPolicyContent />;
}
