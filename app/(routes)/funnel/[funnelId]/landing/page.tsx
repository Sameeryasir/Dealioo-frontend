import { Suspense } from "react";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { LandingFunnelPreview } from "@/app/components/LandingFunnelPreview";
import { FunnelGuestPageShell } from "@/app/components/funnel/FunnelGuestPageShell";

export default function FunnelCampaignLandingPage() {
  return (
    <FunnelGuestPageShell>
      <Suspense fallback={<FunnelPreviewSkeleton />}>
        <LandingFunnelPreview />
      </Suspense>
    </FunnelGuestPageShell>
  );
}
