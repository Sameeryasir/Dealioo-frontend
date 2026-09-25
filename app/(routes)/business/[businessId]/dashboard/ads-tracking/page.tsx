"use client";

import dynamic from "next/dynamic";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { Skeleton } from "@/app/components/skeleton";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const AdsTrackingPanel = dynamic(
  () =>
    import("@/app/components/business/AdsTrackingPanel").then(
      (mod) => mod.AdsTrackingPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-6" aria-busy="true" aria-label="Loading ads tracking">
        <Skeleton className="mb-4 h-10 w-56 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    ),
  },
);

export default function BusinessAdsTrackingPage() {
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );

  if (businessId == null) {
    return <InvalidRouteMessage />;
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Ads Tracking">
      <div className="rd-premium-page campaign-immersive-page">
        <article className="campaign-immersive-shell rd-premium-panel min-h-0">
          <div className="campaign-immersive-tab-panel min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <AdsTrackingPanel businessId={businessId} />
          </div>
        </article>
      </div>
    </section>
  );
}
