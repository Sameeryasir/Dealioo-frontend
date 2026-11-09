"use client";

import { CampaignAddonsPanel } from "@/app/components/campaign/CampaignAddonsPanel";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function CampaignAddonsPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );
  const { can, isFetched, isOwnerLike } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const canAccess = isOwnerLike || can("campaigns") || can("activity");

  useEffect(() => {
    if (!isFetched || campaignId == null || businessId == null) return;
    if (!canAccess) {
      router.replace(
        `/business/${businessId}/dashboard/campaigns/${campaignId}`,
      );
    }
  }, [businessId, campaignId, canAccess, isFetched, router]);

  if (campaignId == null || businessId == null) {
    return <InvalidRouteMessage />;
  }

  if (!isFetched || !canAccess) {
    return null;
  }

  return (
    <div className="campaign-immersive-overview">
      <CampaignAddonsPanel
        embedded
        businessId={businessId}
        campaignId={campaignId}
      />
    </div>
  );
}
