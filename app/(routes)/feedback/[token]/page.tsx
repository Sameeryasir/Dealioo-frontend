"use client";

import { use } from "react";
import { CampaignFeedbackForm } from "@/app/components/campaign/CampaignFeedbackForm";

export default function CampaignFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = use(params);
  const token = decodeURIComponent(raw ?? "").trim();

  return <CampaignFeedbackForm token={token} />;
}
