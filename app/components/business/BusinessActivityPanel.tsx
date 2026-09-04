"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CircleDollarSign,
  Gift,
  Layers,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Search,
  Store,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  DASHBOARD_EVENT_BADGE,
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

type EventFilter = "all" | ActivityEventType | "in_person";

const EVENT_FILTERS: {
  id: EventFilter;
  label: string;
  icon: LucideIcon;
  countKey?:
    | "totalEvents"
    | "totalVisited"
    | "totalRedeemed"
    | "totalPrepaid"
    | "totalInPerson"
    | "totalSignedUp"
    | "totalMessagesSent";
}[] = [
  { id: "all", label: "All", icon: LayoutGrid, countKey: "totalEvents" },
  { id: "signed_up", label: "Signups", icon: UserPlus, countKey: "totalSignedUp" },
  { id: "redeemed_reward", label: "Redemptions", icon: Gift, countKey: "totalRedeemed" },
  { id: "prepaid_for_offer", label: "Paid online", icon: CircleDollarSign, countKey: "totalPrepaid" },
  { id: "in_person", label: "In person", icon: Store, countKey: "totalInPerson" },
  { id: "message_sent", label: "Texts", icon: MessageSquare, countKey: "totalMessagesSent" },
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
  if (event.eventType === "signed_up") {
    return text
      .replace(/\s*·\s*(Prepaid|Postpaid)\s*·\s*/gi, " · ")
      .replace(/\s*·\s*(Prepaid|Postpaid)\s*$/gi, "")
      .trim();
  }
  if (
    event.eventType === "redeemed_reward" ||
    event.eventType === "prepaid_for_offer"
  ) {
    return text
      .replace(/\s*·\s*Prepaid\s*(?=·|at\b|$)/gi, " · ")
      .replace(/\s*·\s*Postpaid\s*(?=·|at\b|$)/gi, " · ")
      .replace(/\s{2,}/g, " ")
      .replace(/\s·\s·/g, " · ")
      .trim();
  }
  return text;
}

function guestName(event: RestaurantActivityEvent): string {
  return event.customerName?.trim() || "User";
}

function guestInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts[0].charAt(0).toUpperCase();
}

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

function eventTypeLabel(
  type: ActivityEventType,
  paymentChannel?: "online" | "in_store" | null,
  visitChannel?: "scanned" | "in_store" | null,
): string {
  switch (type) {
    case "visited":
      if (visitChannel === "scanned") return "Scanned";
      if (visitChannel === "in_store") return "In-person";
      return "Visited";
    case "redeemed_reward":
      return "Redeemed";
    case "signed_up":
      return "Signed up";
    case "prepaid_for_offer":
      return paymentChannel === "in_store" ? "In person" : "Paid online";
    case "message_sent":
      return "Text sent";
    default:
      return type;
  }
}

function EventTypeBadge({
  type,
  paymentChannel,
  visitChannel,
}: {
  type: ActivityEventType;
  paymentChannel?: "online" | "in_store" | null;
  visitChannel?: "scanned" | "in_store" | null;
}) {
  const label = eventTypeLabel(type, paymentChannel, visitChannel);
  let badgeClass = DASHBOARD_EVENT_BADGE.default;

  switch (type) {
    case "visited":
      if (visitChannel === "scanned") badgeClass = DASHBOARD_EVENT_BADGE.scanned;
      else if (visitChannel === "in_store")
        badgeClass = DASHBOARD_EVENT_BADGE.inStore;
      else badgeClass = DASHBOARD_EVENT_BADGE.visited;
      break;
    case "redeemed_reward":
      badgeClass = DASHBOARD_EVENT_BADGE.redeemed;
      break;
    case "signed_up":
      badgeClass = DASHBOARD_EVENT_BADGE.signedUp;
      break;
    case "prepaid_for_offer":
      badgeClass =
        paymentChannel === "in_store"
          ? DASHBOARD_EVENT_BADGE.inStore
          : DASHBOARD_EVENT_BADGE.prepaid;
      break;
    case "message_sent":
      badgeClass = DASHBOARD_EVENT_BADGE.messageSent;
      break;
    default:
      break;
  }

  return <span className={badgeClass}>{label}</span>;
}

function FilterTab({
  active,
  label,
  icon: Icon,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-2.5 text-sm font-semibold ${
        active
          ? "text-[#1877f2]"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      {label}
      {count != null ? (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
            active
              ? "bg-[#e8f2ff] text-[#1877f2]"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      ) : null}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#1877f2]" />
      ) : null}
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
        <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-[#f4f8ff] shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
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
  index,
}: {
  event: RestaurantActivityEvent;
  rowNumber: number;
  index: number;
}) {
  const name = guestName(event);

  return (
    <article className="rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${avatarTone(index)}`}>
            {guestInitial(name)}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-normal text-[#07111f]">
              {name}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(event.occurredAt)}
            </p>
          </div>
        </div>
        <EventTypeBadge
          type={event.eventType}
          paymentChannel={event.paymentChannel}
          visitChannel={event.visitChannel}
        />
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const monthOptions = useMemo(() => buildActivityMonthFilterOptions(), []);
  const range = useMemo(
    () => resolveActivityMonthRange(monthFilter, monthOptions),
    [monthFilter, monthOptions],
  );

  const hasActiveFilters =
    eventFilter !== "all" ||
    monthFilter !== ACTIVITY_ALL_MONTHS_ID ||
    Boolean(debouncedSearch);

  const eventsQuery = useQuery({
    queryKey: [
      "business-activity-events",
      businessId,
      page,
      eventFilter,
      monthFilter,
      range.from,
      range.to,
      debouncedSearch,
    ],
    queryFn: () =>
      getRestaurantActivityEvents(businessId, {
        page,
        limit: RESTAURANT_ACTIVITY_PAGE_SIZE,
        eventType: eventFilter,
        from: range.from,
        to: range.to,
        search: debouncedSearch || undefined,
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
  }, [eventFilter, monthFilter, debouncedSearch]);

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
  const allCount = summary?.totalEvents ?? allEventsTotal;

  const activityHeader = (
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
            <div>
              <h2 className="m-0 text-[1.45rem] font-extrabold tracking-tight text-[#07111f]">
                Activity Log
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Track visits, payments, redemptions, and messages from your guests
              </p>
            </div>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E8EDF5] bg-white px-3 text-xs font-semibold text-slate-600">
        <Activity className="size-3.5 text-slate-400" aria-hidden />
        {allCount} {allCount === 1 ? "activity" : "activities"}
      </span>
    </header>
  );

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Activity">
      <OverviewAlertDialog
        open={error != null && !alertDismissed}
        message={error ?? ""}
        onClose={() => setAlertDismissed(true)}
      />

      <div className="rd-premium-page">
        {showEmpty ? (
          <article className={`${activityCardClass} rd-premium-panel`}>
            {activityHeader}
            <div className="rd-premium-panel__body rd-premium-panel__body--center">
              <ActivityEmptyState baseHref={baseHref} embedded />
            </div>
          </article>
        ) : (
          <article className={`${activityCardClass} rd-premium-panel`}>
            {activityHeader}
            <div
              className="flex shrink-0 flex-col"
              aria-label="Activity filters"
            >
              <div className="mt-4 flex flex-wrap items-center gap-2 px-5 sm:px-6">
                <label className="relative min-w-[14rem] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search guests, emails, or details..."
                    className="h-10 w-full rounded-xl border border-[#E8EDF5] bg-white py-2 pl-9 pr-16 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c7d7f5] focus:ring-2 focus:ring-[#e8f1ff]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[#E8EDF5] bg-[#f8fafc] px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-400">
                    ⌘ K
                  </span>
                </label>
                <ActivityMonthCalendarPicker
                  value={monthFilter}
                  onChange={setMonthFilter}
                  compact
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1 border-b border-[#e8edf5] px-5 sm:px-6">
                {EVENT_FILTERS.map((filter) => (
                  <FilterTab
                    key={filter.id}
                    label={filter.label}
                    icon={filter.icon}
                    count={
                      filter.countKey != null
                        ? (summary?.[filter.countKey] ?? 0)
                        : undefined
                    }
                    active={eventFilter === filter.id}
                    onClick={() => setEventFilter(filter.id)}
                  />
                ))}
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
                    Try a different search, filter, or month.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEventFilter("all");
                      setMonthFilter(ACTIVITY_ALL_MONTHS_ID);
                      setSearch("");
                    }}
                    className="mt-4 cursor-pointer rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}

              {showTable ? (
                <motion.div
                  key={`activity-page-${page}-${eventFilter}-${monthFilter}-${debouncedSearch}`}
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
                                <EventTypeBadge
                                  type={event.eventType}
                                  paymentChannel={event.paymentChannel}
                                  visitChannel={event.visitChannel}
                                />
                              </td>
                              <td className={tdClass}>
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${avatarTone(index)}`}>
                                    {guestInitial(name)}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="block truncate font-normal text-[#07111f]">
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
                        index={index}
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
