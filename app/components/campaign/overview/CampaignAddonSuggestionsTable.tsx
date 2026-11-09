"use client";

import {
  addonMatchKey,
  CAMPAIGN_ADDON_MIN_TRUSTED_VISITS,
  compareSuggestionToPrior,
  formatLift,
  formatShare,
  momBadgeClass,
  priorityClass,
  priorityLabel,
  type MomTrend,
} from "@/app/components/campaign/overview/campaign-addon-suggestion-ui";
import { formatAddonDisplayName } from "@/app/lib/addon-suggestion-copy";
import { formatCents } from "@/app/lib/money";
import type {
  AddonSuggestionPagination,
  CampaignAddonSuggestionItem,
} from "@/app/services/addon-suggestion/get-campaign-addon-suggestions";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Info,
  Minus,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

type CampaignAddonSuggestionsTableProps = {
  suggestions: CampaignAddonSuggestionItem[];
  pagination: AddonSuggestionPagination;
  periodLabel: string;
  priorMonthLabel: string | null;
  priorByAddonKey: Map<string, CampaignAddonSuggestionItem>;
  isEarlySignal: boolean;
  onPageChange: (page: number) => void;
};

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

export function CampaignAddonSuggestionsTable({
  suggestions,
  pagination,
  periodLabel,
  priorMonthLabel,
  priorByAddonKey,
  isEarlySignal,
  onPageChange,
}: CampaignAddonSuggestionsTableProps) {
  const [hoverTip, setHoverTip] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);

  const showMomCompare = priorMonthLabel != null;
  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <>
      {isEarlySignal ? (
        <div className="flex gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3.5 py-3">
          <Info
            className="mt-0.5 size-3.5 shrink-0 text-[#b45309]"
            aria-hidden
          />
          <p className="m-0 text-xs leading-snug text-[#92400e]">
            Early signal — under {CAMPAIGN_ADDON_MIN_TRUSTED_VISITS} add-on
            visits for this deal in {periodLabel}. Rankings can shift as more
            guests buy; treat these as hints, not proof.
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.2rem] border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
        <div className="border-b border-[#eef2f7] px-5 py-4 sm:px-6 sm:py-5">
          <h4 className="m-0 text-sm font-semibold text-[#07111f]">
            Suggested add-ons for this deal
          </h4>
          <p className="m-0 mt-1.5 text-xs leading-relaxed text-slate-500">
            Ranked tips from real purchases in {periodLabel}
            {showMomCompare && priorMonthLabel
              ? ` · compared with ${priorMonthLabel}`
              : ""}
            .
          </p>
        </div>

        <div className="overflow-x-auto">
          <table
            className={`w-full border-collapse text-left ${
              showMomCompare ? "min-w-[980px]" : "min-w-[860px]"
            }`}
          >
            <thead>
              <tr className="border-b border-[#eef2f7] bg-[#f8fafc]">
                <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  #
                </th>
                <th className="px-3 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Add-on
                </th>
                <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Priority
                </th>
                <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Share
                </th>
                <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Lift
                </th>
                {showMomCompare ? (
                  <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                    vs last month
                  </th>
                ) : null}
                <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Times
                </th>
                <th className="px-3 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Visits
                </th>
                <th className="px-3 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Revenue
                </th>
                <th className="px-3 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-slate-400">
                  Suggestion
                </th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => {
                const addonLabel =
                  formatAddonDisplayName(suggestion.addonName) ||
                  suggestion.addonName;
                const shareLabel = formatShare(suggestion.sharePercent);
                const liftLabel = formatLift(suggestion.lift);
                const showLift = suggestion.lift >= 1.1;
                const message =
                  suggestion.message || "Of this deal's add-ons.";
                const revenueCents = Math.max(
                  0,
                  suggestion.revenueCents || 0,
                );
                const mom =
                  showMomCompare && priorMonthLabel
                    ? compareSuggestionToPrior(
                        suggestion,
                        priorByAddonKey.get(
                          addonMatchKey(suggestion.addonName),
                        ) ?? null,
                        priorMonthLabel,
                      )
                    : null;

                return (
                  <tr
                    key={`${suggestion.addonName}:${suggestion.rank}:${index}`}
                    className="border-b border-[#eef2f7] last:border-b-0 transition hover:bg-[#fbfdff]"
                  >
                    <td className="px-3 py-3.5 text-center align-middle text-sm font-semibold tabular-nums text-[#1877f2]">
                      {suggestion.rank || index + 1}
                    </td>
                    <td className="px-3 py-3.5 text-left align-middle">
                      <span className="text-sm font-medium text-[#07111f]">
                        {addonLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${priorityClass(suggestion.priority)}`}
                      >
                        {priorityLabel(suggestion.priority)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <span className="inline-flex rounded-full bg-[#e8f2ff] px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-[#1877f2]">
                        {shareLabel}%
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
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
                      <td className="px-3 py-3.5 text-center align-middle">
                        <span
                          title={mom.detail}
                          className={`inline-flex cursor-help items-center justify-center gap-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${momBadgeClass(mom.trend)}`}
                        >
                          <MomTrendIcon trend={mom.trend} />
                          {mom.label}
                        </span>
                      </td>
                    ) : null}
                    <td className="px-3 py-3.5 text-center align-middle text-sm tabular-nums text-slate-600">
                      {suggestion.timesPurchased}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle text-sm tabular-nums text-slate-600">
                      {suggestion.visitCount}
                    </td>
                    <td className="px-3 py-3.5 text-right align-middle text-sm font-semibold tabular-nums text-[#07111f]">
                      {revenueCents > 0
                        ? formatCents(revenueCents, "USD")
                        : "—"}
                    </td>
                    <td className="max-w-[220px] px-3 py-3.5 text-left align-middle">
                      <p
                        className="m-0 cursor-pointer truncate text-xs leading-snug text-slate-500"
                        onMouseEnter={(event) => {
                          const rect =
                            event.currentTarget.getBoundingClientRect();
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

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-2 border-t border-[#eef2f7] px-5 py-3 sm:px-6">
            <p className="m-0 text-xs text-slate-400">
              {pagination.totalItems} suggestion
              {pagination.totalItems === 1 ? "" : "s"} in {periodLabel}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous suggestions page"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
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
                onClick={() =>
                  onPageChange(Math.min(totalPages, pagination.page + 1))
                }
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-600 transition hover:border-[#c7d7fe] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
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
    </>
  );
}
