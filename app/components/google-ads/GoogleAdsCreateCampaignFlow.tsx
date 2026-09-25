"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/app/components/skeleton";

type GoogleAdsCreateCampaignFlowProps = {
  open: boolean;
  onClose: () => void;
  businessId: number;
  adsConsoleUrl?: string;
  defaultBusinessName?: string;
  defaultWebsiteUrl?: string;
};

const CampaignBuilderWizard = dynamic(
  () =>
    import("@/app/components/google-ads/campaign-builder/CampaignBuilderWizard").then(
      (mod) => mod.CampaignBuilderWizard,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f8fafc]"
        aria-busy="true"
        aria-label="Loading campaign builder"
      >
        <div className="w-full max-w-md space-y-3 px-6">
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    ),
  },
);

export function GoogleAdsCreateCampaignFlow({
  open,
  onClose,
  businessId,
  adsConsoleUrl,
  defaultBusinessName,
  defaultWebsiteUrl,
}: GoogleAdsCreateCampaignFlowProps) {
  if (!open) return null;

  return (
    <CampaignBuilderWizard
      open={open}
      onClose={onClose}
      businessId={businessId}
      adsConsoleUrl={adsConsoleUrl}
      defaultBusinessName={defaultBusinessName}
      defaultWebsiteUrl={defaultWebsiteUrl}
    />
  );
}
