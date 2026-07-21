"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CircleDollarSign,
  Gift,
  Layers,
  MapPin,
  MessageSquare,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  DASHBOARD_EVENT_BADGE,
  DASHBOARD_KPI_ICON,
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatMessageSentDescription } from "@/app/lib/activity-message-preview";
import { formatDateTimeShort } from "@/app/lib/datetime";
import {
  ACTIVITY_ALL_MONTHS_ID,
  buildActivityMonthFilterOptions,
  resolveActivityMonthRange,
} from "@/app/lib/activity-month-filter";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getRestaurantActivityEvents,
  getRestaurantActivitySummary,
  RESTAURANT_ACTIVITY_PAGE_SIZE,
  type ActivityEventType,
  type RestaurantActivityEvent,
} from "@/app/services/activity/get-business-activity";
import { standardEase } from "@/app/lib/motion";

const activityCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-700 first:pl-5 last:pr-5";

type EventFilter = "all" | ActivityEventType;

const EVENT_FILTERS: { id: EventFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "visited", label: "Visits" },
  { id: "redeemed_reward", label: "Redemptions" },
  { id: "prepaid_for_offer", label: "Prepaid" },
  { id: "message_sent", label: "Texts" },
  { id: "campaign_created", label: "Campaign created" },
  { id: "campaign_updated", label: "Campaign updated" },
  { id: "campaign_deleted", label: "Campaign deleted" },
];

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

function activityDescription(event: RestaurantActivityEvent): string {
  const text = event.description?.trim();
  if (!text) return "No details";
  if (event.eventType === "message_sent") {
    return formatMessageSentDescription(text);
  }
  return text;
}

function guestName(event: RestaurantActivityEvent): string {
  if (
    event.eventType === "campaign_created" ||
    event.eventType === "campaign_updated" ||
    event.eventType === "campaign_deleted"
  ) {
    return event.customerName?.trim() || "Team";
  }
  return event.customerName?.trim() || "User";
}

function guestInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts[0].charAt(0).toUpperCase();
}

function eventTypeLabel(type: ActivityEventType): string {
  switch (type) {
    case "visited":
      return "Visited";
    case "redeemed_reward":
      return "Redeemed";
    case "prepaid_for_offer":
      return "Prepaid";
    case "message_sent":
      return "Text sent";
    case "campaign_created":
      return "Campaign created";
    case "campaign_updated":
      return "Campaign updated";
    case "campaign_deleted":
      return "Campaign deleted";
    default:
      return type;
  }
}

function EventTypeBadge({ type }: { type: ActivityEventType }) {
  switch (type) {
    case "visited":
      return (
        <span className={DASHBOARD_EVENT_BADGE.visited}>
          <span className={DASHBOARD_EVENT_BADGE.visitedDot} aria-hidden />
          Visited
        </span>
      );
    case "redeemed_reward":
      return (
        <span className={DASHBOARD_EVENT_BADGE.redeemed}>
          <span className={DASHBOARD_EVENT_BADGE.redeemedDot} aria-hidden />
          Redeemed
        </span>
      );
    case "prepaid_for_offer":
      return (
        <span className={DASHBOARD_EVENT_BADGE.prepaid}>
          <span className={DASHBOARD_EVENT_BADGE.prepaidDot} aria-hidden />
          Prepaid
        </span>
      );
    case "message_sent":
      return (
        <span className={DASHBOARD_EVENT_BADGE.messageSent}>
          <span className={DASHBOARD_EVENT_BADGE.messageSentDot} aria-hidden />
          Text sent
        </span>
      );
    case "campaign_created":
      return (
        <span className={DASHBOARD_EVENT_BADGE.campaignCreated}>
          <span
            className={DASHBOARD_EVENT_BADGE.campaignCreatedDot}
            aria-hidden
          />
          Campaign created
        </span>
      );
    case "campaign_updated":
      return (
        <span className={DASHBOARD_EVENT_BADGE.campaignUpdated}>
          <span
            className={DASHBOARD_EVENT_BADGE.campaignUpdatedDot}
            aria-hidden
          />
          Campaign updated
        </span>
      );
    case "campaign_deleted":
      return (
        <span className={DASHBOARD_EVENT_BADGE.campaignDeleted}>
          <span
            className={DASHBOARD_EVENT_BADGE.campaignDeletedDot}
            aria-hidden
          />
          Campaign deleted
        </span>
      );
    default:
      return (
        <span className={DASHBOARD_EVENT_BADGE.default}>
          {eventTypeLabel(type)}
        </span>
      );
  }
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 cursor-pointer rounded-full px-2 py-1.5 text-[0.75rem] font-bold transition ${
        active
          ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
          : "bg-[#f4f7fb] text-slate-600 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({
  label,
  value,
  hint,
  hintTone,
  icon: Icon,
  iconBg,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  hintTone: string;
  icon: typeof TrendingUp;
  iconBg: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3 text-left shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-[2px] hover:border-[#1877f2]/35 hover:shadow-[0_12px_28px_rgba(24,119,242,0.12)] active:border-[#1877f2]/45 active:shadow-[0_12px_28px_rgba(24,119,242,0.14)]"
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-800">
          {label}
        </p>
        <p className="mt-0.5 mb-0 truncate text-[1.1rem] font-extrabold tracking-tight text-black">
          {value}
        </p>
        <p className={`mt-0.5 mb-0 truncate text-[0.72rem] font-medium ${hintTone}`}>
          {hint}
        </p>
      </div>
    </button>
  );
}

function ActivityTableBodySkeleton() {
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
          <Skeleton funnel className="h-6 w-20 rounded-full" />
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

function ActivityEmptyState({
  baseHref,
  embedded = false,
}: {
  baseHref: string;
  embedded?: boolean;
}) {
  const createCampaignHref = `${baseHref}/campaigns`;

  return (
    <div
      className={`flex flex-col items-center px-6 py-12 text-center sm:py-14 ${
        embedded
          ? "min-h-0 w-full flex-1 justify-center"
          : activityCardClass
      }`}
    >
      <div className="relative mb-5 flex size-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
          <Activity
            className="size-10 text-[#1877f2]"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#16a34a] text-white shadow-md">
          <MapPin className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
      </div>

      <h2 className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        No customer activity yet
      </h2>
      <p className="m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
        Launch your first campaign to start tracking sign ups, payments, QR
        check ins and return visits.
      </p>

      <Link
        href={createCampaignHref}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.82rem] font-bold text-white no-underline shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
      >
        Create Campaign
        <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
      </Link>

      <Link
        href={baseHref}
        className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-bold text-[#1877f2] no-underline transition hover:text-[#166fe5]"
      >
        Learn how Activity works
        <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}

function ActivityEventMobileCard({
  event,
  rowNumber,
}: {
  event: RestaurantActivityEvent;
  rowNumber: number;
}) {
  const name = guestName(event);

  return (
    <article className="rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[0.7rem] font-bold text-white">
            {guestInitial(name)}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-bold text-[#07111f]">
              {name}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(event.occurredAt)}
            </p>
          </div>
        </div>
        <EventTypeBadge type={event.eventType} />
      </div>
      <p className="m-0 mt-3 text-[0.8rem] font-medium leading-snug text-slate-600">
        {activityDescription(event)}
      </p>
    </article>
  );
}

export function BusinessActivityPanel({
  businessId,
}: {
  businessId: number;
}) {
  const baseHref = `/business/${businessId}/dashboard`;

  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [monthFilter, setMonthFilter] = useState(ACTIVITY_ALL_MONTHS_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const monthOptions = useMemo(() => buildActivityMonthFilterOptions(), []);
  const selectedMonthOption = useMemo(
    () =>
      monthOptions.find((option) => option.id === monthFilter) ??
      monthOptions[0],
    [monthFilter, monthOptions],
  );
  const range = useMemo(
    () => resolveActivityMonthRange(monthFilter, monthOptions),
    [monthFilter, monthOptions],
  );

  const hasActiveFilters =
    eventFilter !== "all" ||
    monthFilter !== ACTIVITY_ALL_MONTHS_ID ||
    deferredSearchQuery.trim().length > 0;

  const eventsQuery = useQuery({
    queryKey: [
      "business-activity-events",
      businessId,
      page,
      eventFilter,
      monthFilter,
      deferredSearchQuery,
      range.from,
      range.to,
    ],
    queryFn: () =>
      getRestaurantActivityEvents(businessId, {
        page,
        limit: RESTAURANT_ACTIVITY_PAGE_SIZE,
        eventType: eventFilter,
        from: range.from,
        to: range.to,
        search: deferredSearchQuery,
      }),
    enabled: businessId > 0,
    placeholderData: (previousData) => previousData,
  });

  const summaryQuery = useQuery({
    queryKey: [
      "business-activity-summary",
      businessId,
      monthFilter,
      range.from,
      range.to,
    ],
    queryFn: () =>
      getRestaurantActivitySummary(businessId, {
        from: range.from,
        to: range.to,
      }),
    enabled: businessId > 0,
  });

  const events = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta ?? null;
  const summary = summaryQuery.data ?? null;
  const loading = eventsQuery.isLoading || eventsQuery.isFetching;
  const error = eventsQuery.error
    ? getApiErrorMessage(eventsQuery.error, "Could not load activity.")
    : summaryQuery.error
      ? getApiErrorMessage(summaryQuery.error, "Could not load activity.")
      : null;

  const totalEvents = meta?.total ?? 0;
  const allEventsTotal = meta?.allEventsTotal ?? totalEvents;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const rowOffset = meta ? (meta.page - 1) * meta.limit : 0;

  useEffect(() => {
    setPage(1);
  }, [eventFilter, monthFilter, deferredSearchQuery]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (error) setAlertDismissed(false);
  }, [error]);

  const showEmpty =
    !loading && !error && !hasActiveFilters && allEventsTotal === 0;
  const showFilteredEmpty =
    !loading && !error && hasActiveFilters && totalEvents === 0;
  const showTable = !loading && !error && events.length > 0;

  const applyAllFilter = () => {
    setEventFilter("all");
    setMonthFilter(ACTIVITY_ALL_MONTHS_ID);
    setSearchQuery("");
  };

  const applyVisitedFilter = () => {
    setEventFilter("visited");
    setSearchQuery("");
  };

  const applyRedeemedFilter = () => {
    setEventFilter("redeemed_reward");
    setSearchQuery("");
  };

  const applyPrepaidFilter = () => {
    setEventFilter("prepaid_for_offer");
    setSearchQuery("");
  };

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Activity">
      <OverviewAlertDialog
        open={error != null && !alertDismissed}
        message={error ?? ""}
        onClose={() => setAlertDismissed(true)}
      />

      <div className="rd-premium-page">
        <header className="shrink-0 px-0.5">
          <h1 className="m-0 text-[clamp(1.15rem,2vw,1.45rem)] font-extrabold tracking-tight text-[#07111f]">
            Activity Log
          </h1>
          <p className="m-0 mt-1 max-w-[42ch] text-[0.8rem] font-medium leading-snug text-slate-500">
            Track visits, redemptions, prepaid offers and messages from your
            guests.
          </p>
        </header>

        {!loading && !error && summary && (summary.totalEvents ?? 0) > 0 ? (
          <section
            className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-2.5"
            aria-label="Activity summary"
          >
            <KpiCard
              label="Total Events"
              value={String(summary.totalEvents)}
              hint={selectedMonthOption?.label ?? "Last 6 months"}
              hintTone="text-slate-400"
              icon={TrendingUp}
              iconBg={DASHBOARD_KPI_ICON.blue}
              onClick={applyAllFilter}
            />
            <KpiCard
              label="Visits"
              value={String(summary.totalVisited)}
              hint={
                summary.totalVisited > 0
                  ? "Guests checked in"
                  : "No visits yet"
              }
              hintTone="text-slate-400"
              icon={MapPin}
              iconBg={DASHBOARD_KPI_ICON.green}
              onClick={applyVisitedFilter}
            />
            <KpiCard
              label="Redemptions"
              value={String(summary.totalRedeemed)}
              hint={
                summary.totalRedeemed > 0
                  ? "Rewards claimed"
                  : "No redemptions yet"
              }
              hintTone="text-slate-400"
              icon={Gift}
              iconBg={DASHBOARD_KPI_ICON.orange}
              onClick={applyRedeemedFilter}
            />
            <KpiCard
              label="Prepaid Offers"
              value={String(summary.totalPrepaid)}
              hint={
                summary.totalPrepaid > 0
                  ? "Offers paid online"
                  : "No prepaid offers yet"
              }
              hintTone="text-slate-400"
              icon={CircleDollarSign}
              iconBg={DASHBOARD_KPI_ICON.blue}
              onClick={applyPrepaidFilter}
            />
          </section>
        ) : null}

        {showEmpty ? (
          <article className={`${activityCardClass} rd-premium-panel`}>
            <div className="rd-premium-panel__body rd-premium-panel__body--center">
              <ActivityEmptyState baseHref={baseHref} embedded />
            </div>
          </article>
        ) : (
          <article className={`${activityCardClass} rd-premium-panel`}>
            <div
              className="flex shrink-0 flex-col gap-3 px-2.5 py-3.5 sm:px-3"
              aria-label="Activity filters"
            >
              <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex shrink-0 items-center gap-1.5">
                  {EVENT_FILTERS.map((filter) => (
                    <FilterPill
                      key={filter.id}
                      label={filter.label}
                      active={eventFilter === filter.id}
                      onClick={() => setEventFilter(filter.id)}
                    />
                  ))}
                </div>

                <span
                  className="hidden h-5 w-px shrink-0 bg-[#e8edf5] sm:block"
                  aria-hidden
                />

                <ActivityMonthCalendarPicker
                  value={monthFilter}
                  onChange={setMonthFilter}
                  compact
                />
              </div>

              <div className="relative min-w-0">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest or description..."
                  className="w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] py-2 pr-4 pl-9 text-[0.82rem] font-medium text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-[1.1rem] font-extrabold tracking-tight text-[#07111f]">
                    Activity
                  </h2>
                  <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                    {hasActiveFilters
                      ? `${totalEvents} matching events`
                      : "Visits, redemptions and guest actions"}
                  </p>
                </div>
                <span className="rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
                  {hasActiveFilters
                    ? `${totalEvents} shown`
                    : `${allEventsTotal} total`}
                </span>
              </div>
            </div>

            <div className="rd-premium-panel__body">
              {loading && events.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: standardEase }}
                >
                  <ActivityTableBodySkeleton />
                </motion.div>
              ) : null}

              {showFilteredEmpty ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
                    No matching events
                  </p>
                  <p className="m-0 mt-1 max-w-sm text-[0.8rem] font-medium text-slate-500">
                    Try a different filter or search term.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEventFilter("all");
                      setMonthFilter(ACTIVITY_ALL_MONTHS_ID);
                      setSearchQuery("");
                    }}
                    className="mt-4 cursor-pointer rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}

              {showTable ? (
                <motion.div
                  key={`activity-page-${page}-${eventFilter}-${monthFilter}-${deferredSearchQuery}`}
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
                              label="User"
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
                        {events.map((event, index) => {
                          const rowNumber = rowOffset + index + 1;
                          const name = guestName(event);

                          return (
                            <motion.tr
                              key={event.id}
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
                                    {guestInitial(name)}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="block truncate font-bold text-[#07111f]">
                                      {name}
                                    </span>
                                    {event.customerEmail ? (
                                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                                        {event.customerEmail}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className={`${tdClass} max-w-[18rem]`}>
                                <span className="line-clamp-2 text-slate-600">
                                  {activityDescription(event)}
                                </span>
                              </td>
                              <td
                                className={`${tdClass} whitespace-nowrap text-slate-600`}
                              >
                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                                  <Calendar
                                    className="size-3.5 shrink-0 text-slate-400"
                                    aria-hidden
                                  />
                                  {formatDateTimeShort(event.occurredAt)}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </motion.tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
                    {events.map((event, index) => (
                      <ActivityEventMobileCard
                        key={event.id}
                        event={event}
                        rowNumber={rowOffset + index + 1}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </div>

            {showTable && meta && meta.total > 0 ? (
              <div className="shrink-0 border-t border-[#e8edf5] px-2.5 py-3 sm:px-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-xs text-slate-500">
                    Showing {meta.total === 0 ? 0 : rowOffset + 1} to{" "}
                    {Math.min(rowOffset + meta.limit, meta.total)} of{" "}
                    {meta.total} events
                    {meta.limit > 0 ? ` · ${meta.limit} per page` : ""}
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
                      Page {page} of {meta.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={loading || page >= meta.totalPages}
                      onClick={() =>
                        setPage((prev) =>
                          Math.min(meta.totalPages, prev + 1),
                        )
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
        )}
      </div>
    </section>
  );
}
