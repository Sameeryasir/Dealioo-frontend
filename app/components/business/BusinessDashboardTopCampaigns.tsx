"use client";

import { Skeleton } from "@/app/components/skeleton";
import {
  currentActivityMonthKey,
  formatActivityMonthLabel,
  resolveCollectiveMonthRange,
} from "@/app/lib/activity-month-filter";
import { campaignDashboardHref } from "@/app/lib/campaign-dashboard-tab";
import { getUserTimeZone } from "@/app/lib/datetime";
import { formatCents } from "@/app/lib/money";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { getBusinessTopEarningCampaigns } from "@/app/services/funnel-event/get-business-top-campaigns";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const TOP_CAMPAIGN_LIMIT = 3;

const RANK_BADGE = [
  "bg-[#f59e0b] text-white",
  "bg-[#64748b] text-white",
  "bg-[#c2410c] text-white",
] as const;

const CARD_TONE = [
  "bg-gradient-to-br from-[#fffbeb] via-white to-white ring-[#f59e0b]/35",
  "bg-gradient-to-br from-[#f8fafc] via-white to-white ring-[#cbd5e1]",
  "bg-gradient-to-br from-[#fff7ed] via-white to-white ring-[#fdba74]/70",
] as const;

const PHOTO_RING = [
  "ring-[#f59e0b]",
  "ring-[#94a3b8]",
  "ring-[#ea580c]",
] as const;

export function BusinessDashboardTopCampaigns({
  businessId,
  monthKey: monthKeyProp,
}: {
  businessId: number;
  monthKey?: string;
}) {
  const monthKey = monthKeyProp?.trim() || currentActivityMonthKey();
  const monthLabel = formatActivityMonthLabel(monthKey);
  const monthRange = useMemo(
    () => resolveCollectiveMonthRange(`${monthKey}-01`),
    [monthKey],
  );
  const viewerTimeZone = useMemo(() => getUserTimeZone(), []);

  const query = useQuery({
    queryKey: [
      "business-dashboard-top-campaigns",
      businessId,
      monthRange.from,
      monthRange.to,
      viewerTimeZone,
    ],
    enabled: businessId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getBusinessTopEarningCampaigns(businessId, {
        from: monthRange.from,
        to: monthRange.to,
        limit: TOP_CAMPAIGN_LIMIT,
        timezone: viewerTimeZone,
      }),
  });

  const campaigns = (query.data?.campaigns ?? []).slice(0, TOP_CAMPAIGN_LIMIT);

  return (
    <section className="rd-premium-section" aria-label="Top earning campaigns">
      <div className="rd-premium-section-head">
        <div className="min-w-0">
          <h2>Top earning campaigns</h2>
          <p className="m-0 mt-1 text-[0.78rem] font-medium text-slate-500">
            The three deals that brought in the most money in {monthLabel}.
          </p>
        </div>
        <Link href={`/business/${businessId}/dashboard/performance`}>
          View Performance
          <ArrowRight className="size-3.5" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      {query.isPending ? (
        <div
          className="grid gap-3 sm:grid-cols-3"
          aria-busy="true"
          aria-label="Loading top campaigns"
        >
          {Array.from({ length: TOP_CAMPAIGN_LIMIT }).map((_, index) => (
            <Skeleton key={index} className="h-[4.75rem] w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="m-0 text-sm text-slate-500">
          Top campaigns for {monthLabel} could not be loaded.
        </p>
      ) : campaigns.length === 0 ? (
        <p className="m-0 text-sm text-slate-500">
          No paid campaigns in {monthLabel} yet.
        </p>
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {campaigns.map((campaign, index) => {
            const imageSrc = resolveUploadImageUrl(campaign.imageUrl);
            return (
              <li key={campaign.campaignId}>
                <Link
                  href={campaignDashboardHref(businessId, campaign.campaignId)}
                  className={`group flex h-full items-center gap-3 rounded-2xl px-3.5 py-3 text-inherit no-underline ring-1 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${CARD_TONE[index] ?? CARD_TONE[2]}`}
                >
                  <span className="relative size-16 shrink-0">
                    <span
                      className={`flex size-16 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ${PHOTO_RING[index] ?? PHOTO_RING[2]}`}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          className="size-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="size-5 text-slate-300" aria-hidden />
                      )}
                    </span>
                    <span
                      className={`absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-extrabold shadow-sm ring-2 ring-white ${RANK_BADGE[index] ?? RANK_BADGE[2]}`}
                    >
                      {index + 1}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-[#07111f]">
                      {campaign.campaignName}
                    </span>
                    <span className="text-base font-extrabold tabular-nums tracking-tight text-[#07111f]">
                      {formatCents(campaign.earningsCents, "usd")}
                    </span>
                    <span className="text-[0.72rem] font-medium text-slate-500">
                      {campaign.orderCount === 1
                        ? "1 order"
                        : `${campaign.orderCount} orders`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
