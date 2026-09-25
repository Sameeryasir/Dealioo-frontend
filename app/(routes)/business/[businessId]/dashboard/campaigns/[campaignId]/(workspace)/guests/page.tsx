"use client";

import dynamic from "next/dynamic";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const CampaignGuestsPanel = dynamic(
  () =>
    import("@/app/components/campaign/CampaignGuestsPanel").then(
      (mod) => mod.CampaignGuestsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-4" aria-busy="true" aria-label="Loading guests">
        <Skeleton className="mb-4 h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function CampaignGuestsPage() {
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
  const { funnelId, isLoading: isFunnelIdLoading } =
    useCampaignFunnelId(campaignId);
  const { can, isFetched, isOwnerLike } = useBusinessMembershipPermissions(
    businessId ?? null,
  );
  const canAccess = isOwnerLike || can("campaigns_guests");

  useEffect(() => {
    if (!isFetched || campaignId == null || businessId == null) return;
    if (!canAccess) {
      router.replace(`/business/${businessId}/dashboard/campaigns/${campaignId}`);
    }
  }, [businessId, campaignId, canAccess, isFetched, router]);

  if (campaignId == null) {
    return <InvalidRouteMessage />;
  }

  if (!isFetched || !canAccess) {
    return null;
  }

  return (
    <div className="campaign-immersive-overview">
      <CampaignGuestsPanel
        embedded
        funnelId={funnelId}
        isFunnelIdLoading={isFunnelIdLoading}
      />
    </div>
  );
}
