"use client";

import dynamic from "next/dynamic";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { hasAnyAutomationPermission } from "@/app/lib/member-permissions";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

const AutomationListPage = dynamic(
  () =>
    import("@/app/components/automation/AutomationListPage").then(
      (mod) => mod.AutomationListPage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-4" aria-busy="true" aria-label="Loading automations">
        <Skeleton className="mb-4 h-10 w-56 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function CampaignAutomationsPage() {
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
  const { funnelId } = useCampaignFunnelId(campaignId);
  const { permissionList, isFetched, isOwnerLike } =
    useBusinessMembershipPermissions(businessId ?? null);
  const canAccess =
    isOwnerLike || hasAnyAutomationPermission(permissionList);

  useEffect(() => {
    if (!isFetched || campaignId == null || businessId == null) return;
    if (!canAccess) {
      router.replace(`/business/${businessId}/dashboard/campaigns/${campaignId}`);
    }
  }, [businessId, campaignId, canAccess, isFetched, router]);

  const openAutomationBuilder = useCallback(
    (automationId: string, bootstrapping = false) => {
      if (businessId == null) return;
      const query = new URLSearchParams();
      if (campaignId != null) {
        query.set("campaignId", String(campaignId));
      }
      if (funnelId != null) {
        query.set("funnelId", String(funnelId));
      }
      if (bootstrapping) {
        query.set("bootstrapping", "1");
      }
      const qs = query.toString();
      router.push(
        `/business/${businessId}/dashboard/automations/${automationId}${
          qs ? `?${qs}` : ""
        }`,
      );
    },
    [router, businessId, campaignId, funnelId],
  );

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  if (!isFetched || !canAccess) {
    return null;
  }

  return (
    <div className="campaign-immersive-overview">
      <AutomationListPage
        embedded
        businessId={businessId}
        campaignId={campaignId}
        funnelId={funnelId}
        onOpenBuilder={openAutomationBuilder}
      />
    </div>
  );
}
