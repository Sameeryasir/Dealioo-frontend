"use client";

import { CampaignBuilderWizard } from "@/app/components/google-ads/campaign-builder/CampaignBuilderWizard";

type GoogleAdsCreateCampaignFlowProps = {
  open: boolean;
  onClose: () => void;
  businessId: number;
  adsConsoleUrl?: string;
  defaultBusinessName?: string;
  defaultWebsiteUrl?: string;
};

export function GoogleAdsCreateCampaignFlow({
  open,
  onClose,
  businessId,
  adsConsoleUrl,
  defaultBusinessName,
  defaultWebsiteUrl,
}: GoogleAdsCreateCampaignFlowProps) {
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
