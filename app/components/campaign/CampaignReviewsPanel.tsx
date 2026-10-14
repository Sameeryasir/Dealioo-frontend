"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { TableNoResultsEmptyState } from "@/app/components/shared/TableNoResultsEmptyState";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useCampaignReviews } from "@/app/hooks/use-campaign-reviews";
import {
  activityCalendarYearMonthCount,
  currentActivityDateKey,
  currentActivityMonthKey,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
} from "@/app/lib/activity-month-filter";
import {
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import {
  CAMPAIGN_REVIEWS_PAGE_SIZE,
  getCampaignReviews,
  type CampaignReviewRecord,
  type CampaignReviewSummary,
} from "@/app/services/campaign-review/campaign-review-api";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import {
  Activity,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Download,
  Mail,
  Search,
  Star,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const reviewsCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-700 first:pl-5 last:pr-5";

const AVATAR_TONES = [
  "bg-[#7c3aed] text-white",
  "bg-[#16a34a] text-white",
  "bg-[#2563eb] text-white",
  "bg-[#db2777] text-white",
  "bg-[#0f766e] text-white",
  "bg-[#d97706] text-white",
  "bg-[#e11d48] text-white",
];

function avatarTone(index: number): string {
  return AVATAR_TONES[index % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

const tableHeaderReveal = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: standardEase },
  },
};

const tableRowReveal = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: standardEase },
  },
};

const tableBodyStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

type CampaignReviewsPanelProps = {
  embedded?: boolean;
  businessId: number;
  campaignId: number;
  funnelId: number | null;
  isFunnelIdLoading?: boolean;
};

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index + 1 <= rating;
        return (
          <Star
            key={index}
            className={`size-3.5 ${
              active ? "fill-[#f5b301] text-[#f5b301]" : "text-slate-300"
            }`}
            strokeWidth={1.75}
          />
        );
      })}
    </div>
  );
}

function exportReviewsCsv(rows: CampaignReviewRecord[]) {
  const header = ["Guest", "Email", "Rating", "Feedback", "Submitted"];
  const lines = rows.map((review) => {
    const when = formatDateTimeShort(review.submittedAt);
    return [
      review.guestName?.trim() || "Guest",
      review.guestEmail?.trim() || "",
      String(review.rating),
      review.comment?.trim() || "",
      when,
    ]
      .map((value) => `"${value.replaceAll('"', '""')}"`)
      .join(",");
  });
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "campaign-reviews.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function CopyValueButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#e8f2ff] hover:text-[#1877f2]"
      aria-label={copied ? "Copied" : "Copy email"}
      title={copied ? "Copied" : "Copy email"}
    >
      {copied ? (
        <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="size-3.5" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}

function ReviewsTableSkeleton() {
  return (
    <>
      <div className="border-b border-[#e8edf5] px-5 py-3">
        <div className="flex gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} funnel className="h-3 w-12" />
          ))}
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#f1f5f9] px-5 py-3.5 last:border-0"
        >
          <Skeleton funnel className="h-3 w-4" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Skeleton funnel className="size-8 shrink-0 rounded-full" />
            <Skeleton funnel className="h-4 w-36" />
          </div>
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="h-4 w-20" />
          <Skeleton funnel className="h-4 w-40" />
          <Skeleton funnel className="h-4 w-24" />
        </div>
      ))}
    </>
  );
}

const REVIEW_RATING_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: "All stars" },
  { value: 5, label: "5 stars" },
  { value: 4, label: "4 stars" },
  { value: 3, label: "3 stars" },
  { value: 2, label: "2 stars" },
  { value: 1, label: "1 star" },
];

function RatingOptionLabel({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1">
        All
        <Star
          className="size-3.5 fill-[#f5b301] text-[#f5b301]"
          strokeWidth={1.75}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span>{value}</span>
      <Star
        className="size-3.5 fill-[#f5b301] text-[#f5b301]"
        strokeWidth={1.75}
        aria-hidden
      />
    </span>
  );
}

function ReviewsRatingFilter({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: 132,
    align: "left",
    estimatedHeight: 220,
  });

  const menu =
    open && menuPosition ? (
      <div ref={menuRef}>
        <div
          role="listbox"
          aria-label="Filter by rating"
          style={menuStyle}
          className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.1)]"
        >
          {REVIEW_RATING_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.label}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition ${
                  selected
                    ? "bg-[#eff6ff] text-[#1877f2]"
                    : "text-[#07111f] hover:bg-[#f8fafc]"
                }`}
              >
                <RatingOptionLabel value={option.value} />
                {selected ? (
                  <Check className="size-3.5 shrink-0" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className="relative h-9">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by rating"
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-3 text-xs font-semibold text-[#07111f] outline-none transition hover:border-[#0B69FC]/35 focus:border-[#0B69FC]/40 focus:ring-2 focus:ring-[#0B69FC]/15"
      >
        <RatingOptionLabel value={value} />
        <ChevronDown
          className={`size-3.5 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

function ReviewsPanelHeader({
  total,
  summary,
  search,
  setSearch,
  ratingFilter,
  setRatingFilter,
  calendarMode,
  setCalendarMode,
  monthFilter,
  setMonthFilter,
  dateFilter,
  setDateFilter,
  calendarMonthCount,
  onExport,
  exporting,
}: {
  total: number;
  summary: CampaignReviewSummary;
  search: string;
  setSearch: (value: string) => void;
  ratingFilter: number | null;
  setRatingFilter: (value: number | null) => void;
  calendarMode: "month" | "day";
  setCalendarMode: (mode: "month" | "day") => void;
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  calendarMonthCount: number;
  onExport: () => void;
  exporting: boolean;
}) {
  const avgLabel =
    summary.averageRating != null
      ? summary.averageRating.toFixed(1)
      : "—";

  return (
    <div className="relative shrink-0 border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1877f2] ring-1 ring-[#e8edf5]"
            aria-hidden
          >
            <Star className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
              Reviews
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Guest feedback & ratings
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block h-9">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, feedback…"
              aria-label="Search reviews by name, email, or feedback"
              className="h-9 w-44 rounded-xl border border-[#e8edf5] bg-white pl-8 pr-3 text-xs leading-none text-[#07111f] outline-none focus:border-[#0B69FC]/40 focus:ring-2 focus:ring-[#0B69FC]/15 sm:w-56"
            />
          </label>
          <ReviewsRatingFilter
            value={ratingFilter}
            onChange={setRatingFilter}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-full border border-[#e8edf5] bg-white p-0.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              <button
                type="button"
                onClick={() => setCalendarMode("month")}
                className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
                  calendarMode === "month"
                    ? "bg-[#1877f2] text-white"
                    : "text-slate-600"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode("day")}
                className={`cursor-pointer rounded-full px-3 py-1 text-[0.72rem] font-bold ${
                  calendarMode === "day"
                    ? "bg-[#1877f2] text-white"
                    : "text-slate-600"
                }`}
              >
                Day
              </button>
            </div>
            {calendarMode === "month" ? (
              <ActivityMonthCalendarPicker
                value={monthFilter}
                onChange={setMonthFilter}
                compact
                showAllMonths={false}
                monthCount={calendarMonthCount}
              />
            ) : (
              <PerformanceDateCalendar
                value={dateFilter}
                onChange={setDateFilter}
                monthCount={calendarMonthCount}
              />
            )}
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting || total === 0}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1877f2] px-3 text-xs font-semibold leading-none text-white shadow-sm transition hover:bg-[#1464cc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-3.5 shrink-0" aria-hidden />
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3 text-[0.72rem] font-semibold text-slate-600">
          <Activity className="size-3.5 text-slate-400" aria-hidden />
          {total} {total === 1 ? "review" : "reviews"}
        </span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 text-[0.72rem] font-semibold text-[#92400e]">
          <Star className="size-3.5 fill-[#f5b301] text-[#f5b301]" aria-hidden />
          Avg {avgLabel}
        </span>
      </div>
    </div>
  );
}

function ReviewsPagination({
  meta,
  page,
  loading,
  setPage,
}: {
  meta: NonNullable<ReturnType<typeof useCampaignReviews>["meta"]>;
  page: number;
  loading: boolean;
  setPage: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  const rowOffset = (page - 1) * meta.limit;

  return (
    <div className="shrink-0 border-t border-[#e8edf5] px-2.5 py-3 sm:px-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-xs text-slate-500">
          Showing {meta.total === 0 ? 0 : rowOffset + 1} to{" "}
          {Math.min(rowOffset + meta.limit, meta.total)} of {meta.total}{" "}
          reviews
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage(page - 1)}
            className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
            Page {page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewMobileCard({
  review,
  rowNumber,
  index,
}: {
  review: CampaignReviewRecord;
  rowNumber: number;
  index: number;
}) {
  const name = review.guestName || review.guestEmail || "Guest";
  const initials = guestInitials(name);

  return (
    <article className="rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${avatarTone(index)}`}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-normal text-[#07111f]">
              {name}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(review.submittedAt)}
            </p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>
      {review.guestEmail && review.guestName ? (
        <p className="m-0 mt-2 truncate text-[0.8rem] text-slate-600">
          {review.guestEmail}
        </p>
      ) : null}
    </article>
  );
}

function ReviewsTableSection({
  reviews,
  rowOffset,
}: {
  reviews: CampaignReviewRecord[];
  rowOffset: number;
}) {
  return (
    <div>
      <div className="table-h-scroll hidden md:block">
        <table className="w-full min-w-[40rem] border-collapse">
          <thead>
            <motion.tr
              variants={tableHeaderReveal}
              initial="hidden"
              animate="show"
              className="border-b border-[#e8edf5] bg-[#f8fafc]/60"
            >
              <th className={`${thClass} w-12`}>
                <TableColumnHeader
                  label="#"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={UserRound}
                  label="Guest"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={Mail}
                  label="Email"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={Star}
                  label="Rating"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={Calendar}
                  label="Submitted"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
            </motion.tr>
          </thead>
          <motion.tbody
            variants={tableBodyStagger}
            initial="hidden"
            animate="show"
          >
            {reviews.map((review, index) => {
              const name = review.guestName || review.guestEmail || "Guest";
              const email = review.guestEmail?.trim() || "";
              const initials = guestInitials(name);

              return (
                <motion.tr
                  key={review.id}
                  variants={tableRowReveal}
                  className="group border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
                >
                  <td className={tdClass}>
                    <span className="text-xs font-semibold tabular-nums text-slate-400">
                      {rowOffset + index + 1}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${avatarTone(index)}`}
                      >
                        {initials}
                      </span>
                      <span className="block min-w-0 truncate font-normal text-[#07111f]">
                        {name}
                      </span>
                    </div>
                  </td>
                  <td className={tdClass}>
                    {email ? (
                      <div className="flex min-w-0 items-center gap-0.5">
                        <a
                          href={`mailto:${email}`}
                          className="block min-w-0 truncate text-sm font-normal text-slate-700 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                          title={email}
                        >
                          {email}
                        </a>
                        <CopyValueButton value={email} />
                      </div>
                    ) : (
                      <span className="text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <div className="flex items-center gap-2">
                      <StarRow rating={review.rating} />
                      <span className="text-xs font-semibold tabular-nums text-slate-500">
                        {review.rating}.0
                      </span>
                    </div>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                      <Calendar
                        className="size-3.5 shrink-0 text-slate-400"
                        aria-hidden
                      />
                      {formatDateTimeShort(review.submittedAt)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
        {reviews.map((review, index) => (
          <ReviewMobileCard
            key={review.id}
            review={review}
            rowNumber={rowOffset + index + 1}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export function CampaignReviewsPanel({
  embedded = false,
  businessId,
  campaignId,
  funnelId,
  isFunnelIdLoading = false,
}: CampaignReviewsPanelProps) {
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const calendarMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const periodRange = useMemo(() => {
    const dateRange =
      calendarMode === "day"
        ? resolveActivityDateRange(dateFilter, calendarMonthCount)
        : (getActivityMonthRangeForKey(monthFilter, calendarMonthCount) ??
          resolveActivityDateRange(currentActivityDateKey(), calendarMonthCount));
    return {
      ...dateRange,
      q: debouncedSearch || undefined,
      rating: ratingFilter ?? undefined,
    };
  }, [
    calendarMode,
    calendarMonthCount,
    dateFilter,
    debouncedSearch,
    monthFilter,
    ratingFilter,
  ]);

  const {
    data: reviews,
    meta,
    loading,
    error,
    page,
    setPage,
    summary,
  } = useCampaignReviews(
    businessId,
    campaignId,
    CAMPAIGN_REVIEWS_PAGE_SIZE,
    periodRange,
  );

  const [exportAlert, setExportAlert] = useState<string | null>(null);
  const [queryAlertDismissed, setQueryAlertDismissed] = useState(false);
  const [alertCampaignId, setAlertCampaignId] = useState(campaignId);

  if (alertCampaignId !== campaignId) {
    setAlertCampaignId(campaignId);
    setQueryAlertDismissed(false);
    setExportAlert(null);
  }

  const pageSize = meta?.limit ?? CAMPAIGN_REVIEWS_PAGE_SIZE;
  const rowOffset = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize],
  );

  const showSkeleton =
    isFunnelIdLoading || (loading && reviews.length === 0);
  const showNoFunnelMessage =
    !isFunnelIdLoading && !loading && funnelId == null;
  const showNoRecords =
    !showSkeleton && !error && funnelId != null && (meta?.total ?? 0) === 0;
  const showTable = !showSkeleton && !error && reviews.length > 0;
  const showCenteredEmpty = showNoFunnelMessage || showNoRecords;
  const total = meta?.total ?? 0;
  const queryAlert =
    !showSkeleton && error && !queryAlertDismissed ? error : null;
  const alertMessage = exportAlert ?? queryAlert;

  const clearReviewsFilters = () => {
    setSearch("");
    setRatingFilter(null);
    setCalendarMode("month");
    setMonthFilter(currentActivityMonthKey());
    setDateFilter(currentActivityDateKey());
  };

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const collected: CampaignReviewRecord[] = [];
      let exportPage = 1;
      let totalPages = 1;
      do {
        const result = await getCampaignReviews({
          businessId,
          campaignId,
          page: exportPage,
          limit: 50,
          from: periodRange.from,
          to: periodRange.to,
          q: periodRange.q,
          rating: periodRange.rating,
        });
        collected.push(...result.data);
        totalPages = Math.max(1, result.meta.totalPages || 1);
        exportPage += 1;
      } while (exportPage <= totalPages && exportPage <= 40);
      exportReviewsCsv(collected);
    } catch (err: unknown) {
      setExportAlert(
        err instanceof Error ? err.message : "Could not export reviews.",
      );
    } finally {
      setExporting(false);
    }
  }, [
    businessId,
    campaignId,
    exporting,
    periodRange.from,
    periodRange.q,
    periodRange.rating,
    periodRange.to,
  ]);

  const panelContent = (
    <article className={`${reviewsCardClass} rd-premium-panel h-full min-h-0`}>
      <ReviewsPanelHeader
        total={total}
        summary={summary}
        search={search}
        setSearch={setSearch}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        calendarMode={calendarMode}
        setCalendarMode={setCalendarMode}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        calendarMonthCount={calendarMonthCount}
        onExport={() => {
          void handleExport();
        }}
        exporting={exporting}
      />
      <div
        className={`rd-premium-panel__body${
          showCenteredEmpty
            ? " rd-premium-panel__body--center min-h-[min(24rem,60vh)]"
            : ""
        }`}
      >
        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: standardEase }}
          >
            <ReviewsTableSkeleton />
          </motion.div>
        ) : null}

        {showNoFunnelMessage ? (
          <TableNoResultsEmptyState
            icon={Star}
            title="No funnel saved yet"
            description="Open the Funnel tab and save once to load reviews."
          />
        ) : null}

        {showNoRecords ? (
          <TableNoResultsEmptyState
            icon={debouncedSearch || ratingFilter != null ? Search : Star}
            title={
              debouncedSearch
                ? `No reviews match “${debouncedSearch}”`
                : ratingFilter != null
                  ? `No ${ratingFilter}★ reviews for this period`
                  : "No reviews for this period"
            }
            description={
              debouncedSearch || ratingFilter != null
                ? "Try another search or star filter, or clear filters to reset."
                : "No reviews in this month or day. Try another date, or clear filters to reset."
            }
            action={
              <button
                type="button"
                onClick={clearReviewsFilters}
                className="cursor-pointer rounded-full border border-[#1877f2] bg-transparent px-5 py-2.5 text-[0.82rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
              >
                Clear filters
              </button>
            }
          />
        ) : null}

        {showTable ? (
          <motion.div
            key={`reviews-page-${page}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: standardEase }}
          >
            <ReviewsTableSection reviews={reviews} rowOffset={rowOffset} />
          </motion.div>
        ) : null}
      </div>

      {showTable && meta ? (
        <ReviewsPagination
          meta={meta}
          page={page}
          loading={loading}
          setPage={setPage}
        />
      ) : null}
    </article>
  );

  const alert = (
    <OverviewAlertDialog
      open={alertMessage != null}
      message={alertMessage ?? ""}
      onClose={() => {
        setExportAlert(null);
        if (error) setQueryAlertDismissed(true);
      }}
    />
  );

  if (embedded) {
    return (
      <div className="campaign-immersive-reviews funnel-reviews-root">
        {alert}
        <div className="funnel-reviews-panel">
          <div className="funnel-reviews-body flex flex-col">{panelContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="funnel-reviews-root min-h-0 flex-1 overflow-y-auto bg-[#eef2f7]">
      {alert}
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {panelContent}
      </div>
    </div>
  );
}
