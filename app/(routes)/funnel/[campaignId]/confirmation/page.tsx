"use client";

import { Suspense } from "react";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { FunnelConfirmationView } from "@/app/components/funnel/FunnelConfirmationView";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";
import { useFunnelGuestRoute } from "@/app/hooks/use-funnel-guest-route";
import { useFunnelStepGuard } from "@/app/hooks/use-funnel-step-guard";

function FunnelCampaignConfirmationInner() {
  const { funnelIdSegment, funnelId } = useFunnelGuestRoute();
  useFunnelStepGuard(funnelId, "confirmation");

  return (
    <FunnelConfirmationView
      funnelId={funnelId}
      templateStorageKey={funnelIdSegment}
    />
  );
}

export default function FunnelCampaignConfirmationPage() {
  return (
    <FunnelGuestPageShell>
      <Suspense fallback={<FunnelPreviewSkeleton />}>
        <FunnelCampaignConfirmationInner />
      </Suspense>
    </FunnelGuestPageShell>
  );
}
