"use client";

import type { ReactNode } from "react";
import {
  renderCampaignBuilderStep,
} from "@/app/components/google-ads/campaign-builder/CampaignBuilderSteps";
import type { GoogleCampaignBuilderDraft } from "@/app/components/google-ads/campaign-builder/types";

type CampaignBuilderStepHostProps = {
  step: number;
  businessId: number;
  draft: GoogleCampaignBuilderDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
  onEditStep: (step: number) => void;
  publishing: boolean;
  publishProgress: number;
  publishPhase: string | null;
  publishStep: string | null;
  publishError: string | null;
  publishSuccess: boolean;
};

export default function CampaignBuilderStepHost(
  props: CampaignBuilderStepHostProps,
): ReactNode {
  return renderCampaignBuilderStep(props.step, props);
}
