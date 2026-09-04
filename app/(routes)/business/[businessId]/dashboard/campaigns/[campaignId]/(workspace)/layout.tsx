"use client";

import CampaignHeader from "@/app/components/CampaignHeader";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import { InvalidRouteMessage } from "@/app/components/InvalidRouteMessage";
import { campaignDashboardTabFromPathname } from "@/app/lib/campaign-dashboard-tab";
import { parseRoutePositiveInt } from "@/app/lib/numbers";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function CampaignWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const businessId = useMemo(
    () => parseRoutePositiveInt(params.businessId),
    [params.businessId],
  );
  const campaignId = useMemo(
    () => parseRoutePositiveInt(params.campaignId),
    [params.campaignId],
  );

  const { data: campaign } = useCampaignByIdQuery(campaignId);
  const { funnelId } = useCampaignFunnelId(campaignId);
  const [pattiHost, setPattiHost] = useState<HTMLElement | null>(null);

  const activeTabId =
    businessId != null && campaignId != null
      ? campaignDashboardTabFromPathname(pathname, businessId, campaignId)
      : "overview";

  useEffect(() => {
    setPattiHost(document.getElementById("campaign-immersive-patti-host"));
  }, []);

  if (businessId == null || campaignId == null) {
    return <InvalidRouteMessage />;
  }

  const campaignHeader = (
    <CampaignHeader
      embedded
      businessId={businessId}
      campaignId={campaignId}
      funnelId={funnelId}
      offer={campaign?.offer}
      price={campaign?.price}
      campaign={campaign}
    />
  );

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Campaign">
      {pattiHost ? createPortal(campaignHeader, pattiHost) : null}

      <div className="rd-premium-page campaign-immersive-page">
        <article
          className={`campaign-immersive-shell rd-premium-panel ${
            activeTabId === "funnel" ? "funnel-editor-shell" : ""
          }`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </article>
      </div>
    </section>
  );
}
