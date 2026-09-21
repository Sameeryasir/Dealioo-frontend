"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { BusinessOptionSelect } from "@/app/components/business/BusinessOptionSelect";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { Skeleton } from "@/app/components/skeleton";
import {
  ACTIVITY_ALL_MONTHS_ID,
  activityCalendarYearMonthCount,
  buildActivityMonthFilterOptions,
  buildActivityMonthKey,
  formatActivityMonthLabel,
  parseActivityMonthKey,
  resolveActivityMonthRange,
  resolveCollectiveMonthRange,
} from "@/app/lib/activity-month-filter";
import { campaignDashboardHref } from "@/app/lib/campaign-dashboard-tab";
import { formatCents } from "@/app/lib/money";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  resolveUploadImageUrl,
  spacesImageEagerLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import { getCampaignAddonCounts } from "@/app/services/addon-suggestion/get-campaign-addon-counts";
import {
  getCampaignAddonSuggestions,
  type AddonSuggestionPagination,
  type CampaignAddonSuggestionItem,
  type CampaignAddonSuggestionsGroup,
} from "@/app/services/addon-suggestion/get-campaign-addon-suggestions";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Equal,
  Info,
  Layers,
  Minus,
  PackageSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const panelCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const SUGGESTIONS_PAGE_SIZE = 5;
const MIN_VISITS_FOR_TRUSTED_BUNDLE = 3;
const MOM_SHARE_GAP_PP = 3;
const MOM_LIFT_GAP = 0.15;
const PRIOR_MONTH_PAGE_SIZE = 50;

type MomTrend = "stronger" | "weaker" | "similar" | "new" | "unavailable";

type MomCompare = {
  trend: MomTrend;
  label: string;
  detail: string;
};

function currentMonthKey(): string {
  const now = new Date();
  return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

function previousMonthKey(monthKey: string): string | null {
  const parsed = parseActivityMonthKey(monthKey);
  if (!parsed) return null;
  const prior = new Date(Date.UTC(parsed.year, parsed.month - 2, 1));
  return buildActivityMonthKey(
    prior.getUTCFullYear(),
    prior.getUTCMonth() + 1,
  );
}

function addonMatchKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatShare(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatLift(value: number): string {
  if (Number.isInteger(value)) return value.toFixed(0);
  if (Math.abs(value * 10 - Math.round(value * 10)) < 0.001) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

function compareSuggestionToPrior(
  current: CampaignAddonSuggestionItem,
  prior: CampaignAddonSuggestionItem | null,
  priorMonthLabel: string,
): MomCompare {
  if (!prior) {
    return {
      trend: "new",
      label: "New",
      detail: `Did not appear with this deal in ${priorMonthLabel}.`,
    };
  }

  if (prior.visitCount < MIN_VISITS_FOR_TRUSTED_BUNDLE) {
    return {
      trend: "unavailable",
      label: "—",
      detail: `Not enough add-on visits in ${priorMonthLabel} to compare fairly.`,
    };
  }

  const shareDelta = current.sharePercent - prior.sharePercent;
  const liftDelta = current.lift - prior.lift;
  const detail = `Share ${formatShare(prior.sharePercent)}% → ${formatShare(current.sharePercent)}% · Lift ${formatLift(prior.lift)}x → ${formatLift(current.lift)}x vs ${priorMonthLabel}`;

  const clearlyUp =
    shareDelta >= MOM_SHARE_GAP_PP ||
    (shareDelta >= 1 && liftDelta >= MOM_LIFT_GAP);
  const clearlyDown =
    shareDelta <= -MOM_SHARE_GAP_PP ||
    (shareDelta <= -1 && liftDelta <= -MOM_LIFT_GAP);

  if (clearlyUp && !clearlyDown) {
    return { trend: "stronger", label: "Stronger", detail };
  }
  if (clearlyDown && !clearlyUp) {
    return { trend: "weaker", label: "Weaker", detail };
  }
  return { trend: "similar", label: "Similar", detail };
}

function buildPriorAddonMap(
  priorSuggestions: CampaignAddonSuggestionItem[],
): Map<string, CampaignAddonSuggestionItem> {
  const map = new Map<string, CampaignAddonSuggestionItem>();
  for (const row of priorSuggestions) {
    const key = addonMatchKey(row.addonName);
    if (!key || map.has(key)) continue;
    map.set(key, row);
  }
  return map;
}

function momBadgeClass(trend: MomTrend): string {
  if (trend === "stronger") return "bg-[#ecfdf5] text-[#15803d]";
  if (trend === "weaker") return "bg-[#fef2f2] text-[#b91c1c]";
  if (trend === "new") return "bg-[#e8f2ff] text-[#1877f2]";
  if (trend === "similar") return "bg-[#f1f5f9] text-slate-500";
  return "bg-[#f8fafc] text-slate-400";
}

function MomTrendIcon({ trend }: { trend: MomTrend }) {
  if (trend === "stronger") {
    return <ArrowUpRight className="size-3" aria-hidden />;
  }
  if (trend === "weaker") {
    return <ArrowDownRight className="size-3" aria-hidden />;
  }
  if (trend === "similar") {
    return <Minus className="size-3" aria-hidden />;
  }
  return null;
}

function formatTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function priorityLabel(priority: CampaignAddonSuggestionItem["priority"]): string {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function priorityClass(priority: CampaignAddonSuggestionItem["priority"]): string {
  if (priority === "high") {
    return "bg-[#ecfdf5] text-[#15803d]";
  }
  if (priority === "medium") {
    return "bg-[#e8f2ff] text-[#1877f2]";
  }
  return "bg-[#f1f5f9] text-slate-500";
}

function CampaignSuggestionsCard({
  businessId,
  campaign,
  pagination,
  periodLabel,
  onPageChange,
  showMomCompare,
  priorMonthLabel,
  priorByAddonKey,
}: {
  businessId: number;
  campaign: CampaignAddonSuggestionsGroup;
  pagination: AddonSuggestionPagination;
  periodLabel: string;
  onPageChange: (page: number) => void;
  showMomCompare: boolean;
  priorMonthLabel: string | null;
  priorByAddonKey: Map<string, CampaignAddonSuggestionItem> | null;
}) {
  const [hoverTip, setHoverTip] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);

  const campaignLabel =
    formatTitleCase(campaign.campaignName) || campaign.campaignName;
  const clearTopLabel = campaign.topAddonName
    ? formatTitleCase(campaign.topAddonName) || campaign.topAddonName
    : null;
  const campaignImageSrc = resolveUploadImageUrl(campaign.imageUrl ?? null);
  const campaignHref = campaignDashboardHref(businessId, campaign.campaignId);

  let statusLabel: string | null = null;
  let StatusIcon: typeof Crown | typeof Equal | typeof Sparkles | null = null;
  if (campaign.topStatus === "tied") {
    statusLabel = "Tied";
    StatusIcon = Equal;
  } else if (campaign.topStatus === "clear" && clearTopLabel) {
    statusLabel = `Top: ${clearTopLabel}`;
    StatusIcon = Crown;
  } else if (campaign.topStatus === "emerging" && clearTopLabel) {
    statusLabel = `Early: ${clearTopLabel}`;
    StatusIcon = Sparkles;
  }

  const totalPages = pagination.totalPages;
  const showPagination = totalPages > 1;
  const isEarlySignal =
    campaign.topStatus === "emerging" ||
    campaign.totalAddonVisits < MIN_VISITS_FOR_TRUSTED_BUNDLE;

  const tableMinWidth = showMomCompare ? "min-w-[980px]" : "min-w-[860px]";

  return (
    <div className={`${panelCardClass} px-4 py-4 sm:px-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {campaignImageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaignImageSrc}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-[#e8edf5]"
              {...spacesImageEagerLoadProps}
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#e8edf5]">
              <Layers className="size-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="m-0 truncate text-lg font-semibold text-[#07111f]">
              {campaignLabel}
            </h2>
            <p className="m-0 mt-0.5 text-sm text-slate-500">
              {campaign.totalAddonPurchases} add-on unit
              {campaign.totalAddonPurchases === 1 ? "" : "s"}
              {campaign.totalAddonVisits > 0
                ? ` · ${campaign.totalAddonVisits} visit${campaign.totalAddonVisits === 1 ? "" : "s"}`
                : ""}{" "}
              with this deal in {periodLabel}
              {showMomCompare && priorMonthLabel
                ? ` · compared with ${priorMonthLabel}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {statusLabel && StatusIcon ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f2ff] px-2.5 py-1 text-[0.7rem] font-semibold text-[#1877f2]">
              <StatusIcon className="size-3" aria-hidden />
              {statusLabel}
            </span>
          ) : null}
          <Link
            href={campaignHref}
            className="inline-flex items-center gap-1 rounded-full bg-[#1877f2] px-3 py-1.5 text-[0.75rem] font-semibold text-white no-underline"
          >
            Open campaign
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      {isEarlySignal ? (
        <div className="mt-3 flex gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5">
          <Info
            className="mt-0.5 size-3.5 shrink-0 text-[#b45309]"
            aria-hidden
          />
          <p className="m-0 text-xs leading-snug text-[#92400e]">
            Early signal — under {MIN_VISITS_FOR_TRUSTED_BUNDLE} add-on visits
            for this deal in {periodLabel}. Rankings can shift as more guests
            buy; treat these as hints, not proof.
          </p>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e8edf5]">
        <table className={`w-full ${tableMinWidth} border-collapse text-left`}>
          <thead>
            <tr className="border-b border-[#eef2f7] bg-[#f8fafc]">
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                #
              </th>
              <th className="px-3 py-2.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Add-on
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Priority
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Share
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Lift
              </th>
              {showMomCompare ? (
                <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  <span className="inline-flex items-center justify-center gap-1">
                    vs last month
                    <span
                      title="Share and lift vs the previous calendar month for this deal."
                      className="inline-flex cursor-help text-slate-300"
                    >
                      <Info className="size-3" aria-hidden />
                    </span>
                  </span>
                </th>
              ) : null}
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Times
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Visits
              </th>
              <th className="px-3 py-2.5 text-right text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Revenue
              </th>
              <th className="px-3 py-2.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Suggestion
              </th>
            </tr>
          </thead>
          <tbody>
            {campaign.suggestions.map((suggestion, index) => {
              const addonLabel =
                formatTitleCase(suggestion.addonName) || suggestion.addonName;
              const shareLabel = formatShare(suggestion.sharePercent);
              const liftLabel = formatLift(suggestion.lift);
              const showLift = suggestion.lift >= 1.1;
              const message =
                suggestion.message || "Of this deal's add-ons.";
              const revenueCents = Math.max(0, suggestion.revenueCents || 0);
              const mom =
                showMomCompare && priorMonthLabel
                  ? compareSuggestionToPrior(
                      suggestion,
                      priorByAddonKey?.get(
                        addonMatchKey(suggestion.addonName),
                      ) ?? null,
                      priorMonthLabel,
                    )
                  : null;

              return (
                <tr
                  key={`${campaign.campaignId}:${suggestion.addonName}:${index}`}
                  className="border-b border-[#eef2f7] last:border-b-0 transition hover:bg-[#fbfdff]"
                >
                  <td className="px-3 py-3 text-center align-middle text-sm font-semibold tabular-nums text-[#1877f2]">
                    {suggestion.rank || index + 1}
                  </td>
                  <td className="px-3 py-3 text-left align-middle">
                    <span className="text-sm font-medium text-[#07111f]">
                      {addonLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${priorityClass(suggestion.priority)}`}
                    >
                      {priorityLabel(suggestion.priority)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    <span className="inline-flex rounded-full bg-[#e8f2ff] px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-[#1877f2]">
                      {shareLabel}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    {showLift ? (
                      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-[#34a853]">
                        <TrendingUp className="size-3" aria-hidden />
                        {liftLabel}x
                      </span>
                    ) : (
                      <span className="inline-flex justify-center text-xs tabular-nums text-slate-400">
                        {liftLabel}x
                      </span>
                    )}
                  </td>
                  {mom ? (
                    <td className="px-3 py-3 text-center align-middle">
                      <span
                        title={mom.detail}
                        className={`inline-flex cursor-help items-center justify-center gap-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${momBadgeClass(mom.trend)}`}
                      >
                        <MomTrendIcon trend={mom.trend} />
                        {mom.label}
                      </span>
                    </td>
                  ) : null}
                  <td className="px-3 py-3 text-center align-middle text-sm tabular-nums text-slate-600">
                    {suggestion.timesPurchased}
                  </td>
                  <td className="px-3 py-3 text-center align-middle text-sm tabular-nums text-slate-600">
                    {suggestion.visitCount}
                  </td>
                  <td className="px-3 py-3 text-right align-middle text-sm font-semibold tabular-nums text-[#07111f]">
                    {revenueCents > 0
                      ? formatCents(revenueCents, "USD")
                      : "—"}
                  </td>
                  <td className="max-w-[220px] px-3 py-3 text-left align-middle">
                    <p
                      className="m-0 cursor-pointer truncate text-xs leading-snug text-slate-500"
                      onMouseEnter={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const width = 288;
                        const left = Math.min(
                          rect.left,
                          window.innerWidth - width - 12,
                        );
                        setHoverTip({
                          text: message,
                          left: Math.max(12, left),
                          top: rect.bottom + 8,
                        });
                      }}
                      onMouseLeave={() => setHoverTip(null)}
                    >
                      {message}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hoverTip ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[80] w-72 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-[#e8edf5] bg-white px-3 py-2 text-xs leading-snug text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
          style={{ left: hoverTip.left, top: hoverTip.top }}
        >
          {hoverTip.text}
        </div>
      ) : null}

      {showPagination ? (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#eef2f7] pt-3">
          <p className="m-0 text-xs text-slate-400">
            {pagination.totalItems} suggestion
            {pagination.totalItems === 1 ? "" : "s"} in {periodLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous suggestions page"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-slate-400">
              {pagination.page} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next suggestions page"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BusinessBundleOpportunitiesPanel({
  businessId,
}: {
  businessId: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dashboardMonthCount = useMemo(
    () => activityCalendarYearMonthCount(),
    [],
  );
  const monthOptions = useMemo(
    () => buildActivityMonthFilterOptions(dashboardMonthCount),
    [dashboardMonthCount],
  );

  const monthFromQuery = useMemo(() => {
    const fromQuery = searchParams.get("month")?.trim() ?? "";
    if (
      fromQuery === ACTIVITY_ALL_MONTHS_ID ||
      monthOptions.some((option) => option.id === fromQuery)
    ) {
      return fromQuery;
    }
    return currentMonthKey();
  }, [monthOptions, searchParams]);

  const campaignIdFromQuery = useMemo(() => {
    const raw = searchParams.get("campaignId");
    if (raw == null || raw.trim() === "") return null;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);

  const [monthFilter, setMonthFilter] = useState(monthFromQuery);
  const [campaignId, setCampaignId] = useState<number | null>(
    campaignIdFromQuery,
  );
  const [page, setPage] = useState(1);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    setMonthFilter(monthFromQuery);
  }, [monthFromQuery]);

  useEffect(() => {
    setCampaignId(campaignIdFromQuery);
  }, [campaignIdFromQuery]);

  useEffect(() => {
    setPage(1);
  }, [businessId, campaignId, monthFilter]);

  const replaceBundleQuery = (nextMonth: string, nextCampaignId: number | null) => {
    const params = new URLSearchParams();
    params.set("month", nextMonth);
    if (nextCampaignId != null && nextCampaignId > 0) {
      params.set("campaignId", String(nextCampaignId));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMonthChange = (nextMonth: string) => {
    setMonthFilter(nextMonth);
    replaceBundleQuery(nextMonth, campaignId);
  };

  const handleCampaignChange = (nextCampaignId: number | null) => {
    setCampaignId(nextCampaignId);
    replaceBundleQuery(monthFilter, nextCampaignId);
  };

  const range = useMemo(() => {
    if (monthFilter === ACTIVITY_ALL_MONTHS_ID) {
      return {
        ...resolveActivityMonthRange(monthFilter, monthOptions),
        inProgress: false,
      };
    }
    return resolveCollectiveMonthRange(
      `${monthFilter}-01`,
      dashboardMonthCount,
    );
  }, [dashboardMonthCount, monthFilter, monthOptions]);

  const priorMonthFilter = useMemo(() => {
    if (monthFilter === ACTIVITY_ALL_MONTHS_ID) return null;
    return previousMonthKey(monthFilter);
  }, [monthFilter]);

  const priorRange = useMemo(() => {
    if (!priorMonthFilter) return null;
    return resolveCollectiveMonthRange(
      `${priorMonthFilter}-01`,
      dashboardMonthCount,
    );
  }, [dashboardMonthCount, priorMonthFilter]);

  const monthLabel =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? monthOptions.find((option) => option.id === ACTIVITY_ALL_MONTHS_ID)
          ?.label ?? "All months"
      : formatActivityMonthLabel(monthFilter);
  const periodLabel =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? monthLabel
      : `${monthLabel}${range.inProgress ? " so far" : ""}`;
  const priorMonthLabel = priorMonthFilter
    ? formatActivityMonthLabel(priorMonthFilter)
    : null;

  const campaignListQuery = useQuery({
    queryKey: [
      "business-addon-counts",
      businessId,
      monthFilter,
      range.from,
      range.to,
    ],
    enabled: Number.isFinite(businessId) && businessId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getCampaignAddonCounts(businessId, {
        from: range.from,
        to: range.to,
        limit: 50,
      }),
  });

  const campaignOptions = campaignListQuery.data?.campaigns ?? [];

  const suggestionsQuery = useQuery({
    queryKey: [
      "business-addon-suggestions",
      businessId,
      campaignId,
      monthFilter,
      range.from,
      range.to,
      page,
      SUGGESTIONS_PAGE_SIZE,
    ],
    enabled:
      Number.isFinite(businessId) &&
      businessId > 0 &&
      campaignId != null &&
      campaignId > 0,
    staleTime: 30_000,
    queryFn: () =>
      getCampaignAddonSuggestions(businessId, {
        from: range.from,
        to: range.to,
        campaignId: campaignId ?? undefined,
        page,
        pageSize: SUGGESTIONS_PAGE_SIZE,
      }),
  });

  const priorSuggestionsQuery = useQuery({
    queryKey: [
      "business-addon-suggestions-prior",
      businessId,
      campaignId,
      priorMonthFilter,
      priorRange?.from,
      priorRange?.to,
      PRIOR_MONTH_PAGE_SIZE,
    ],
    enabled:
      Number.isFinite(businessId) &&
      businessId > 0 &&
      campaignId != null &&
      campaignId > 0 &&
      priorMonthFilter != null &&
      priorRange != null,
    staleTime: 30_000,
    queryFn: () =>
      getCampaignAddonSuggestions(businessId, {
        from: priorRange!.from,
        to: priorRange!.to,
        campaignId: campaignId ?? undefined,
        page: 1,
        pageSize: PRIOR_MONTH_PAGE_SIZE,
      }),
  });

  const priorByAddonKey = useMemo(() => {
    if (!priorMonthFilter || !priorSuggestionsQuery.data) return null;
    const rows =
      priorSuggestionsQuery.data.campaigns?.[0]?.suggestions ?? [];
    return buildPriorAddonMap(rows);
  }, [priorMonthFilter, priorSuggestionsQuery.data]);

  const showMomCompare =
    priorMonthFilter != null &&
    priorMonthLabel != null &&
    priorSuggestionsQuery.isSuccess;

  useEffect(() => {
    setAlertDismissed(false);
  }, [
    businessId,
    monthFilter,
    campaignId,
    page,
    suggestionsQuery.errorUpdatedAt,
  ]);

  useEffect(() => {
    if (campaignId != null) return;
    if (campaignListQuery.isPending) return;
    const first = campaignOptions[0]?.campaignId;
    if (first == null || first <= 0) return;
    setCampaignId(first);
    replaceBundleQuery(monthFilter, first);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-pick only when still empty
  }, [campaignId, campaignListQuery.isPending, campaignOptions.length]);

  const selectedSuggestions = suggestionsQuery.data?.campaigns?.[0] ?? null;
  const pagination = suggestionsQuery.data?.pagination ?? {
    page: 1,
    pageSize: SUGGESTIONS_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  };
  const errorMessage = suggestionsQuery.isError
    ? getApiErrorMessage(
        suggestionsQuery.error,
        "Could not load campaign add-on suggestions.",
      )
    : null;

  const campaignSelectOptions = useMemo(() => {
    const options = campaignOptions.map((option) => ({
      value: String(option.campaignId),
      label: formatTitleCase(option.campaignName) || option.campaignName,
    }));

    if (
      campaignId != null &&
      !options.some((option) => option.value === String(campaignId))
    ) {
      const fallbackLabel = selectedSuggestions
        ? formatTitleCase(selectedSuggestions.campaignName) ||
          selectedSuggestions.campaignName
        : `Campaign #${campaignId}`;
      options.unshift({
        value: String(campaignId),
        label: fallbackLabel,
      });
    }

    return options;
  }, [campaignId, campaignOptions, selectedSuggestions]);

  const campaignSelectPlaceholder = campaignListQuery.isPending
    ? "Loading campaigns…"
    : campaignSelectOptions.length === 0
      ? "No campaigns this period"
      : "Select a campaign";

  const performanceHref = `/business/${businessId}/dashboard/performance`;

  return (
    <section className="rd-premium w-full" aria-label="Bundle opportunities">
      <div className="flex flex-col gap-4">
        <header className={`${panelCardClass} px-4 py-4 sm:px-5`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link
                href={performanceHref}
                className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1877f2] no-underline"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to Performance
              </Link>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#1877f2]/12 text-[#1877f2]">
                  <Layers className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <div>
                  <h1 className="m-0 text-lg font-semibold text-[#07111f]">
                    Bundle opportunities
                  </h1>
                  <p className="m-0 mt-0.5 text-sm text-slate-500">
                    Suggested add-ons for this campaign in {periodLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-nowrap items-center gap-2 self-start lg:self-auto">
              <div className="w-[14rem] shrink-0 [&>div]:flex-none [&>div]:w-full">
                <BusinessOptionSelect
                  value={campaignId != null ? String(campaignId) : ""}
                  options={campaignSelectOptions}
                  placeholder={campaignSelectPlaceholder}
                  ariaLabel="Campaign"
                  disabled={
                    campaignListQuery.isPending ||
                    campaignSelectOptions.length === 0
                  }
                  menuZIndex={90}
                  triggerClassName="h-9 w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3 text-[0.75rem] font-bold text-[#07111f] transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] hover:text-[#1877f2]"
                  placeholderClassName="font-bold text-slate-400"
                  onChange={(nextValue) => {
                    const next = Number.parseInt(nextValue, 10);
                    handleCampaignChange(
                      Number.isFinite(next) && next > 0 ? next : null,
                    );
                  }}
                />
              </div>
              <ActivityMonthCalendarPicker
                value={monthFilter}
                onChange={handleMonthChange}
                compact
                monthCount={dashboardMonthCount}
                className="shrink-0"
              />
            </div>
          </div>
        </header>

        {campaignId == null ? (
          <div className={`${panelCardClass} px-4 py-12 text-center sm:px-5`}>
            <PackageSearch
              className="mx-auto size-8 text-slate-300"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="m-0 mt-3 text-sm font-semibold text-slate-600">
              Choose a campaign
            </p>
            <p className="m-0 mt-1 text-xs text-slate-400">
              Pick a deal above, or open Bundle opportunities from a Performance
              tip.
            </p>
            <Link
              href={performanceHref}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1877f2] no-underline"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back to Performance
            </Link>
          </div>
        ) : suggestionsQuery.isPending ? (
          <div className={`${panelCardClass} p-4`}>
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        ) : selectedSuggestions == null ||
          selectedSuggestions.suggestions.length === 0 ? (
          <div className={`${panelCardClass} px-4 py-12 text-center sm:px-5`}>
            <PackageSearch
              className="mx-auto size-8 text-slate-300"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="m-0 mt-3 text-sm font-semibold text-slate-600">
              No suggestions found
            </p>
            <p className="m-0 mt-1 text-xs text-slate-400">
              Try another campaign or month.
            </p>
          </div>
        ) : (
          <CampaignSuggestionsCard
            businessId={businessId}
            campaign={selectedSuggestions}
            pagination={pagination}
            periodLabel={periodLabel}
            onPageChange={setPage}
            showMomCompare={showMomCompare}
            priorMonthLabel={priorMonthLabel}
            priorByAddonKey={priorByAddonKey}
          />
        )}
      </div>

      {errorMessage && !alertDismissed ? (
        <OverviewAlertDialog
          open
          message={errorMessage}
          onClose={() => setAlertDismissed(true)}
        />
      ) : null}
    </section>
  );
}
