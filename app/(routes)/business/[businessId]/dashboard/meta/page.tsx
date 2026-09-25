"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const CampaignAdsPanel = dynamic(
  () =>
    import("@/app/components/campaign/CampaignAdsPanel").then(
      (mod) => mod.CampaignAdsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading Meta Ads">
        <Skeleton className="mb-4 h-10 w-56 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessMetaAdsPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Meta Ads">
      <div className="rd-premium-page campaign-immersive-page">
        <article className="campaign-immersive-shell rd-premium-panel">
          <div className="campaign-immersive-tab-panel flex min-h-0 flex-1 flex-col overflow-y-auto">
            <CampaignAdsPanel embedded businessId={businessId} />
          </div>
        </article>
      </div>
    </section>
  );
}
