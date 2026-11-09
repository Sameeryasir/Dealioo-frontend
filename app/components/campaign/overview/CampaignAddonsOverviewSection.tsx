"use client";

import { CampaignAddonSuggestionsTable } from "@/app/components/campaign/overview/CampaignAddonSuggestionsTable";
import {
  buildPriorAddonMap,
  CAMPAIGN_ADDON_MIN_TRUSTED_VISITS,
  CAMPAIGN_ADDON_PRIOR_PAGE_SIZE,
  CAMPAIGN_ADDON_SUGGESTIONS_PAGE_SIZE,
} from "@/app/components/campaign/overview/campaign-addon-suggestion-ui";
import { Skeleton } from "@/app/components/skeleton";
import {
  activityCalendarYearMonthCount,
  buildActivityMonthKey,
  formatActivityMonthLabel,
  parseActivityMonthKey,
  resolveCollectiveMonthRange,
} from "@/app/lib/activity-month-filter";
import {
  ADDON_TIPS_SECTION,
  formatAddonDisplayName,
} from "@/app/lib/addon-suggestion-copy";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  getCampaignAddonSuggestions,
  type CampaignAddonSuggestionsGroup,
} from "@/app/services/addon-suggestion/get-campaign-addon-suggestions";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  Equal,
  Layers,
  ShoppingBag,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CampaignAddonsOverviewSectionProps = {
  businessId: number;
  campaignId: number;
  from: string;
  to: string;
  periodLabel: string;
  monthFilter: string;
};

function previousMonthKey(monthKey: string): string | null {
  const parsed = parseActivityMonthKey(monthKey);
  if (!parsed) return null;
  const prior = new Date(parsed.year, parsed.month - 2, 1);
  return buildActivityMonthKey(prior.getFullYear(), prior.getMonth() + 1);
}

function AddonKpiTile({
  label,
  value,
  hint,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconBg: string;
}) {
  return (
    <div className="funnel-overview-kpi-tile group flex h-full min-h-[8rem] items-start gap-3.5 rounded-[1.2rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-[2px] hover:border-[#1877f2]/45 hover:shadow-[0_14px_32px_rgba(24,119,242,0.14)] sm:px-5 sm:py-5">
      <span
        className={`funnel-overview-kpi-tile__icon flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <p className="m-0 truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-600 transition group-hover:text-[#1877f2]">
          {label}
        </p>
        <p
          className="funnel-overview-kpi-tile__value m-0 mt-1.5 truncate text-[1.15rem] font-extrabold leading-none tracking-tight text-black tabular-nums transition group-hover:text-[#1877f2] sm:text-[1.2rem]"
          aria-label={`${label}: ${value}`}
        >
          {value}
        </p>
        <p className="m-0 mt-2 truncate text-[0.72rem] font-medium text-slate-500">
          {hint}
        </p>
      </div>
    </div>
  );
}

function AddonKpiSkeleton() {
  return (
    <div className="flex h-full min-h-[8rem] items-start gap-3.5 rounded-[1.2rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] sm:px-5 sm:py-5">
      <Skeleton funnel className="size-10 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <Skeleton funnel className="h-3 w-16" />
        <Skeleton funnel className="mt-2 h-7 w-20" />
        <Skeleton funnel className="mt-2 h-3 w-24" />
      </div>
    </div>
  );
}

function pickCampaignGroup(
  campaigns: CampaignAddonSuggestionsGroup[],
  campaignId: number,
): CampaignAddonSuggestionsGroup | null {
  return (
    campaigns.find((row) => row.campaignId === campaignId) ??
    campaigns[0] ??
    null
  );
}

export function CampaignAddonsOverviewSection({
  businessId,
  campaignId,
  from,
  to,
  periodLabel,
  monthFilter,
}: CampaignAddonsOverviewSectionProps) {
  const [page, setPage] = useState(1);

  const enabled =
    isPositiveInt(businessId) &&
    isPositiveInt(campaignId) &&
    Boolean(from?.trim()) &&
    Boolean(to?.trim());

  const dashboardMonthCount = useMemo(
    () => activityCalendarYearMonthCount(),
    [],
  );

  const priorMonthFilter = useMemo(
    () => previousMonthKey(monthFilter),
    [monthFilter],
  );
  const priorRange = useMemo(() => {
    if (!priorMonthFilter) return null;
    return resolveCollectiveMonthRange(
      `${priorMonthFilter}-01`,
      dashboardMonthCount,
    );
  }, [dashboardMonthCount, priorMonthFilter]);
  const priorMonthLabel = priorMonthFilter
    ? formatActivityMonthLabel(priorMonthFilter)
    : null;

  useEffect(() => {
    setPage(1);
  }, [businessId, campaignId, from, to]);

  const suggestionsQuery = useQuery({
    queryKey: [
      "campaign-addon-suggestions",
      businessId,
      campaignId,
      from,
      to,
      page,
      CAMPAIGN_ADDON_SUGGESTIONS_PAGE_SIZE,
    ],
    enabled,
    staleTime: 30_000,
    queryFn: () =>
      getCampaignAddonSuggestions(businessId, {
        from,
        to,
        campaignId,
        page,
        pageSize: CAMPAIGN_ADDON_SUGGESTIONS_PAGE_SIZE,
      }),
  });

  const priorSuggestionsQuery = useQuery({
    queryKey: [
      "campaign-addon-suggestions-prior",
      businessId,
      campaignId,
      priorMonthFilter,
      priorRange?.from,
      priorRange?.to,
      CAMPAIGN_ADDON_PRIOR_PAGE_SIZE,
    ],
    enabled: enabled && priorMonthFilter != null && priorRange != null,
    staleTime: 30_000,
    queryFn: () =>
      getCampaignAddonSuggestions(businessId, {
        from: priorRange!.from,
        to: priorRange!.to,
        campaignId,
        page: 1,
        pageSize: CAMPAIGN_ADDON_PRIOR_PAGE_SIZE,
      }),
  });

  const group = pickCampaignGroup(
    suggestionsQuery.data?.campaigns ?? [],
    campaignId,
  );
  const pagination = suggestionsQuery.data?.pagination ?? {
    page: 1,
    pageSize: CAMPAIGN_ADDON_SUGGESTIONS_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  };
  const suggestions = group?.suggestions ?? [];
  const totalPurchases = group?.totalAddonPurchases ?? 0;
  const totalVisits = group?.totalAddonVisits ?? 0;
  const topName = group?.topAddonName
    ? formatAddonDisplayName(group.topAddonName) || group.topAddonName
    : "—";
  const topTimes = suggestions[0]?.timesPurchased ?? 0;

  const priorByAddonKey = useMemo(() => {
    const priorGroup = pickCampaignGroup(
      priorSuggestionsQuery.data?.campaigns ?? [],
      campaignId,
    );
    return buildPriorAddonMap(priorGroup?.suggestions ?? []);
  }, [campaignId, priorSuggestionsQuery.data?.campaigns]);

  const isPending =
    suggestionsQuery.isPending && suggestionsQuery.data == null;
  const isEmpty = !isPending && suggestions.length === 0;
  const isEarlySignal =
    (group?.topStatus === "emerging" ||
      (group?.totalAddonVisits ?? 0) < CAMPAIGN_ADDON_MIN_TRUSTED_VISITS) &&
    !isEmpty;

  let statusLabel: string | null = null;
  let StatusIcon: typeof Crown | typeof Equal | typeof Sparkles | null = null;
  if (group?.topStatus === "tied") {
    statusLabel = "Tied";
    StatusIcon = Equal;
  } else if (group?.topStatus === "clear" && group.topAddonName) {
    statusLabel = `Top: ${topName}`;
    StatusIcon = Crown;
  } else if (group?.topStatus === "emerging" && group.topAddonName) {
    statusLabel = `Early: ${topName}`;
    StatusIcon = Sparkles;
  }

  return (
    <section
      className="flex min-w-0 w-full flex-col gap-5 sm:gap-6"
      aria-label={`Add-ons for ${periodLabel}`}
    >
      {statusLabel && StatusIcon ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2ff] px-2.5 py-1 text-[0.7rem] font-semibold text-[#1877f2]">
            <StatusIcon className="size-3" aria-hidden />
            {statusLabel}
          </span>
        </div>
      ) : null}

      {isPending ? (
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <div
            className="funnel-overview-kpi-grid funnel-overview-kpi-grid--three"
            aria-hidden
          >
            <AddonKpiSkeleton />
            <AddonKpiSkeleton />
            <AddonKpiSkeleton />
          </div>
          <div className="overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] sm:p-6">
            <Skeleton funnel className="h-5 w-48" />
            <Skeleton funnel className="mt-4 h-10 w-full" />
            <Skeleton funnel className="mt-3 h-10 w-full" />
            <Skeleton funnel className="mt-3 h-10 w-full" />
          </div>
        </div>
      ) : isEmpty ? (
        <div className="rounded-[1.2rem] border border-[#e8edf5] bg-white px-5 py-12 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] sm:px-6">
          <Layers className="mx-auto size-8 text-slate-300" aria-hidden />
          <p className="m-0 mt-4 text-sm font-medium text-slate-600">
            {ADDON_TIPS_SECTION.emptyDetailsTitle}
          </p>
          <p className="m-0 mt-2 text-xs leading-relaxed text-slate-400">
            {ADDON_TIPS_SECTION.emptyDetailsBody}
          </p>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <div
            className="funnel-overview-kpi-grid funnel-overview-kpi-grid--three"
            aria-label="Add-on summary"
          >
            <AddonKpiTile
              label="Add-on units"
              value={String(totalPurchases)}
              hint={periodLabel}
              icon={ShoppingBag}
              iconBg={DASHBOARD_KPI_ICON.blue}
            />
            <AddonKpiTile
              label="Visits with add-ons"
              value={String(totalVisits)}
              hint={periodLabel}
              icon={Users}
              iconBg={DASHBOARD_KPI_ICON.green}
            />
            <AddonKpiTile
              label="Top add-on"
              value={topName}
              hint={
                topTimes > 0
                  ? `Bought ${topTimes} time${topTimes === 1 ? "" : "s"}`
                  : periodLabel
              }
              icon={Sparkles}
              iconBg={DASHBOARD_KPI_ICON.orange}
            />
          </div>

          <CampaignAddonSuggestionsTable
            suggestions={suggestions}
            pagination={pagination}
            periodLabel={periodLabel}
            priorMonthLabel={priorMonthLabel}
            priorByAddonKey={priorByAddonKey}
            isEarlySignal={isEarlySignal}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}
