"use client";

import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { Skeleton } from "@/app/components/skeleton";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import {
  DASHBOARD_EVENT_BADGE,
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  BUSINESS_HISTORY_PAGE_SIZE,
  getBusinessHistory,
  type BusinessHistoryEvent,
  type BusinessHistoryEventType,
} from "@/app/services/business-history/get-business-history";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  History,
  Layers,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { standardEase } from "@/app/lib/motion";

const historyCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-700 first:pl-5 last:pr-5";

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

function HistoryTableBodySkeleton() {
  return (
    <>
      <div className="border-b border-[#e8edf5] px-5 py-3">
        <div className="flex gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} funnel className="h-3 w-12" />
          ))}
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#f1f5f9] px-5 py-3.5 last:border-0"
        >
          <Skeleton funnel className="h-3 w-4" />
          <Skeleton funnel className="h-6 w-24 rounded-full" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Skeleton funnel className="size-8 shrink-0 rounded-full" />
            <Skeleton funnel className="h-4 w-28" />
          </div>
          <Skeleton funnel className="h-4 w-40" />
          <Skeleton funnel className="h-4 w-24" />
        </div>
      ))}
    </>
  );
}

function eventTypeLabel(type: BusinessHistoryEventType): string {
  switch (type) {
    case "campaign_created":
      return "Campaign created";
    case "campaign_updated":
      return "Campaign updated";
    case "campaign_deleted":
      return "Campaign deleted";
    case "business_created":
      return "Business created";
    case "business_updated":
      return "Business updated";
    case "business_deleted":
      return "Business deleted";
    case "automation_updated":
      return "Automation updated";
    case "automation_activated":
      return "Automation activated";
    case "automation_deactivated":
      return "Automation deactivated";
    case "automation_deleted":
      return "Automation deleted";
    case "funnel_updated":
      return "Funnel updated";
    case "funnel_deleted":
      return "Funnel deleted";
    default:
      return "History";
  }
}

function EventTypeBadge({ type }: { type: BusinessHistoryEventType }) {
  const label = eventTypeLabel(type);

  switch (type) {
    case "campaign_created":
    case "business_created":
      return (
        <span className={DASHBOARD_EVENT_BADGE.campaignCreated}>
          <span
            className={DASHBOARD_EVENT_BADGE.campaignCreatedDot}
            aria-hidden
          />
          {label}
        </span>
      );
    case "campaign_updated":
    case "business_updated":
    case "automation_updated":
    case "automation_activated":
    case "funnel_updated":
      return (
        <span className={DASHBOARD_EVENT_BADGE.campaignUpdated}>
          <span
            className={DASHBOARD_EVENT_BADGE.campaignUpdatedDot}
            aria-hidden
          />
          {label}
        </span>
      );
    case "campaign_deleted":
    case "business_deleted":
    case "automation_deactivated":
    case "automation_deleted":
    case "funnel_deleted":
      return (
        <span className={DASHBOARD_EVENT_BADGE.campaignDeleted}>
          <span
            className={DASHBOARD_EVENT_BADGE.campaignDeletedDot}
            aria-hidden
          />
          {label}
        </span>
      );
    default:
      return <span className={DASHBOARD_EVENT_BADGE.default}>{label}</span>;
  }
}

function actorInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts[0].charAt(0).toUpperCase();
}

function HistoryRow({
  event,
  rowNumber,
}: {
  event: BusinessHistoryEvent;
  rowNumber: number;
}) {
  const actor = event.actorName?.trim() || "Team";

  return (
    <motion.tr
      variants={tableRowReveal}
      className="group border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
    >
      <td className={tdClass}>
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {rowNumber}
        </span>
      </td>
      <td className={`${tdClass} whitespace-nowrap`}>
        <EventTypeBadge type={event.eventType} />
      </td>
      <td className={tdClass}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[0.72rem] font-bold text-white">
            {actorInitial(actor)}
          </span>
          <span className="block truncate font-bold text-[#07111f]">
            {actor}
          </span>
        </div>
      </td>
      <td className={`${tdClass} max-w-[18rem]`}>
        <span className="line-clamp-2 text-slate-600">{event.description}</span>
      </td>
      <td className={`${tdClass} whitespace-nowrap text-slate-600`}>
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
          <Calendar className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          {formatDateTimeShort(event.occurredAt)}
        </span>
      </td>
    </motion.tr>
  );
}

export function BusinessHistoryPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [page, setPage] = useState(1);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const historyQuery = useQuery({
    queryKey: ["business-history", businessId, page],
    queryFn: () => getBusinessHistory(businessId, { page }),
    enabled: businessId > 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  const events = historyQuery.data?.data ?? [];
  const meta = historyQuery.data?.meta ?? null;
  const loading = historyQuery.isLoading || historyQuery.isFetching;
  const error = historyQuery.error
    ? getApiErrorMessage(historyQuery.error, "Could not load history.")
    : null;

  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const rowOffset = meta ? (meta.page - 1) * meta.limit : 0;
  const showTable = !loading && !error && events.length > 0;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (error) setAlertDismissed(false);
  }, [error]);

  return (
    <section className="rd-premium rd-premium--fill" aria-label="History">
      <OverviewAlertDialog
        open={error != null && !alertDismissed}
        message={error ?? ""}
        onClose={() => setAlertDismissed(true)}
      />

      <div className="rd-premium-page">

        <article className={`${historyCardClass} rd-premium-panel`}>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-2.5 py-3.5 sm:px-3">
            <div>
              <h2 className="m-0 text-[1.1rem] font-extrabold tracking-tight text-[#07111f]">
                History Log
              </h2>
              <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                Records every business, campaign, funnel, and automation event.
              </p>
            </div>
            <span className="rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
              {total} total
            </span>
          </div>

          <div className="rd-premium-panel__body">
            {loading && events.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: standardEase }}
              >
                <HistoryTableBodySkeleton />
              </motion.div>
            ) : null}

            {!loading && !error && total === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: standardEase }}
                className="flex flex-col items-center px-6 py-10 text-center"
              >
                <History className="size-8 text-slate-300" aria-hidden />
                <p className="m-0 mt-3 text-[0.95rem] font-extrabold text-[#07111f]">
                  No history yet
                </p>
                <p className="m-0 mt-1 max-w-sm text-[0.8rem] font-medium text-slate-500">
                  Changes to your business, campaigns, funnels, and automations
                  will show up here.
                </p>
              </motion.div>
            ) : null}

            {showTable ? (
              <motion.div
                key={`history-page-${page}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: standardEase }}
              >
                <div className="hidden overflow-x-auto overscroll-x-contain md:block">
                  <table className="w-full min-w-[44rem] border-collapse">
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
                        <th className={`${thClass} whitespace-nowrap`}>
                          <TableColumnHeader
                            icon={Layers}
                            label="Type"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader
                            icon={UserRound}
                            label="By"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader
                            icon={MessageSquare}
                            label="Description"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader
                            icon={Calendar}
                            label="Date"
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
                      {events.map((event, index) => (
                        <HistoryRow
                          key={event.id}
                          event={event}
                          rowNumber={rowOffset + index + 1}
                        />
                      ))}
                    </motion.tbody>
                  </table>
                </div>

                <motion.div
                  variants={tableBodyStagger}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-2.5 p-3.5 md:hidden"
                >
                  {events.map((event, index) => {
                    const actor = event.actorName?.trim() || "Team";
                    return (
                      <motion.div
                        key={event.id}
                        variants={tableRowReveal}
                        className="rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <EventTypeBadge type={event.eventType} />
                          <span className="text-[0.72rem] font-medium text-slate-500">
                            {formatDateTimeShort(event.occurredAt)}
                          </span>
                        </div>
                        <p className="m-0 mt-2.5 text-sm font-bold text-[#07111f]">
                          {event.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[0.68rem] font-bold text-white">
                            {actorInitial(actor)}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {actor}
                          </span>
                          <span className="ml-auto text-[0.7rem] font-semibold tabular-nums text-slate-400">
                            #{rowOffset + index + 1}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            ) : null}
          </div>

          {showTable && meta && meta.total > 0 ? (
            <div className="shrink-0 border-t border-[#e8edf5] px-2.5 py-3 sm:px-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-xs text-slate-500">
                  Showing {meta.total === 0 ? 0 : rowOffset + 1} to{" "}
                  {Math.min(rowOffset + meta.limit, meta.total)} of {meta.total}{" "}
                  events
                  {meta.limit > 0
                    ? ` · ${meta.limit || BUSINESS_HISTORY_PAGE_SIZE} per page`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={loading || page >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
