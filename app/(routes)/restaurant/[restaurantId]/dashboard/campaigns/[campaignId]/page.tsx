"use client";

import { CrmTemplateEditor } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import CampaignHeader from "@/app/components/CampaignHeader";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  fetchCampaignsByRestaurant,
  type Funnel,
} from "@/app/services/funnel/get-campaigns-by-restaurant";
import { useCampaignFunnelId } from "@/app/hooks/use-campaign-funnel-id";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function parseId(raw: unknown): number | undefined {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return undefined;
  const n = Number.parseInt(raw, 10);
  return n >= 1 ? n : undefined;
}

export default function CampaignWelcomePage() {
  const params = useParams();
  const restaurantId = useMemo(
    () => parseId(params.restaurantId),
    [params.restaurantId],
  );
  const campaignId = useMemo(
    () => parseId(params.campaignId),
    [params.campaignId],
  );

  const [campaign, setCampaign] = useState<Funnel | null | undefined>(
    undefined,
  );
  const [activeTabId, setActiveTabId] = useState("overview");
  const funnelId = useCampaignFunnelId(campaignId);

  useEffect(() => {
    if (restaurantId == null || campaignId == null) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchCampaignsByRestaurant(
          getSetupAccessToken(),
          restaurantId,
        );
        const found = list.find((f) => f.id === campaignId) ?? null;
        if (!cancelled) setCampaign(found);
      } catch {
        if (!cancelled) setCampaign(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, campaignId]);

  if (restaurantId == null || campaignId == null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm text-zinc-700">
        <p>Invalid link.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block font-medium text-zinc-900 underline underline-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0">
        <CampaignHeader
          restaurantId={restaurantId}
          campaignId={campaignId}
          funnelId={funnelId}
          offer={campaign?.offer}
          price={campaign?.price}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
        />
      </div>
      {activeTabId === "funnel" ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <CrmTemplateEditor
            restaurantId={restaurantId}
            campaignId={campaignId}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          <p className="text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Welcome to Campaign page
          </p>
          {campaign === null ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Could not load this campaign from the list.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
