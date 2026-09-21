"use client";

import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { Skeleton } from "@/app/components/skeleton";
import {
  ACTIVITY_ALL_MONTHS_ID,
  buildActivityMonthFilterOptions,
  buildActivityMonthKey,
  formatActivityMonthLabel,
  resolveActivityMonthRange,
  resolveCollectiveMonthRange,
} from "@/app/lib/activity-month-filter";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  resolveUploadImageUrl,
  spacesImageEagerLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import {
  getCampaignAddonSuggestions,
  type AddonSuggestionPagination,
  type CampaignAddonSuggestionsGroup,
} from "@/app/services/addon-suggestion/get-campaign-addon-suggestions";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  Equal,
  Layers,
  PackageSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const panelCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const SUGGESTIONS_PAGE_SIZE = 5;

function currentMonthKey(): string {
  const now = new Date();
  return buildActivityMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

function formatTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function CampaignSuggestionsCard({
  campaign,
  pagination,
  periodLabel,
  onPageChange,
}: {
  campaign: CampaignAddonSuggestionsGroup;
  pagination: AddonSuggestionPagination;
  periodLabel: string;
  onPageChange: (page: number) => void;
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

  return (
    <div className={`${panelCardClass} px-4 py-4 sm:px-5`}>
      <div className="flex items-start justify-between gap-3">
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
            </p>
          </div>
        </div>
        {statusLabel && StatusIcon ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e8f2ff] px-2.5 py-1 text-[0.7rem] font-semibold text-[#1877f2]">
            <StatusIcon className="size-3" aria-hidden />
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e8edf5]">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#eef2f7] bg-[#f8fafc]">
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                #
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Add-on
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Share
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Lift
              </th>
              <th className="px-3 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                Visits
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
              const shareLabel = Number.isInteger(suggestion.sharePercent)
                ? String(suggestion.sharePercent)
                : suggestion.sharePercent.toFixed(1);
              const liftLabel =
                Number.isInteger(suggestion.lift) ||
                Math.abs(
                  suggestion.lift * 10 - Math.round(suggestion.lift * 10),
                ) < 0.001
                  ? suggestion.lift.toFixed(
                      Number.isInteger(suggestion.lift) ? 0 : 2,
                    )
                  : suggestion.lift.toFixed(2);
              const showLift = suggestion.lift >= 1.1;
              const message =
                suggestion.message || "Of this deal's add-ons.";

              return (
                <tr
                  key={`${campaign.campaignId}:${suggestion.addonName}:${index}`}
                  className="border-b border-[#eef2f7] last:border-b-0 transition hover:bg-[#fbfdff]"
                >
                  <td className="px-3 py-3 text-center align-middle text-sm font-semibold tabular-nums text-[#1877f2]">
                    {suggestion.rank || index + 1}
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    <span className="text-sm font-normal text-[#07111f]">
                      {addonLabel}
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
                  <td className="px-3 py-3 text-center align-middle text-sm tabular-nums text-slate-600">
                    {suggestion.visitCount}
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
  const searchParams = useSearchParams();
  const monthOptions = useMemo(() => buildActivityMonthFilterOptions(), []);
  const initialMonth = useMemo(() => {
    const fromQuery = searchParams.get("month")?.trim() ?? "";
    if (
      fromQuery === ACTIVITY_ALL_MONTHS_ID ||
      monthOptions.some((option) => option.id === fromQuery)
    ) {
      return fromQuery;
    }
    return currentMonthKey();
  }, [monthOptions, searchParams]);

  const campaignId = useMemo(() => {
    const raw = searchParams.get("campaignId");
    if (raw == null || raw.trim() === "") return null;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);

  const monthFilter = initialMonth;
  const [page, setPage] = useState(1);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [businessId, campaignId, monthFilter]);

  const range = useMemo(() => {
    if (monthFilter === ACTIVITY_ALL_MONTHS_ID) {
      return {
        ...resolveActivityMonthRange(monthFilter, monthOptions),
        inProgress: false,
      };
    }
    return resolveCollectiveMonthRange(`${monthFilter}-01`);
  }, [monthFilter, monthOptions]);

  const monthLabel =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? monthOptions.find((option) => option.id === ACTIVITY_ALL_MONTHS_ID)
          ?.label ?? "All months"
      : formatActivityMonthLabel(monthFilter);
  const periodLabel =
    monthFilter === ACTIVITY_ALL_MONTHS_ID
      ? monthLabel
      : `${monthLabel}${range.inProgress ? " so far" : ""}`;

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

  useEffect(() => {
    setAlertDismissed(false);
  }, [businessId, monthFilter, campaignId, page, suggestionsQuery.errorUpdatedAt]);

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

  const performanceHref = `/business/${businessId}/dashboard/performance`;

  return (
    <section className="rd-premium w-full" aria-label="Bundle opportunities">
      <div className="flex flex-col gap-4">
        <header className={`${panelCardClass} px-4 py-4 sm:px-5`}>
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
        </header>

        {campaignId == null ? (
          <div className={`${panelCardClass} px-4 py-12 text-center sm:px-5`}>
            <PackageSearch
              className="mx-auto size-8 text-slate-300"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="m-0 mt-3 text-sm font-semibold text-slate-600">
              Choose a campaign from Performance
            </p>
            <p className="m-0 mt-1 text-xs text-slate-400">
              Open Bundle opportunities from a deal tip to see suggestions.
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
            campaign={selectedSuggestions}
            pagination={pagination}
            periodLabel={periodLabel}
            onPageChange={setPage}
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
