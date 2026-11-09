"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  CircleDollarSign,
  Gift,
  Layers,
  LayoutGrid,
  MessageSquare,
  Search,
  Store,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { TableNoResultsEmptyState } from "@/app/components/shared/TableNoResultsEmptyState";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DASHBOARD_EVENT_BADGE,
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatMessageSentDescription } from "@/app/lib/activity-message-preview";
import { formatDateTimeShort } from "@/app/lib/datetime";
import {
  activityCalendarYearMonthCount,
  currentActivityDateKey,
  currentActivityMonthKey,
  getActivityMonthRangeForKey,
  resolveActivityDateRange,
} from "@/app/lib/activity-month-filter";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { useSidebarSectionLiveReload } from "@/app/hooks/use-sidebar-section-live-reload";
import {
  getRestaurantActivityEvents,
  RESTAURANT_ACTIVITY_PAGE_SIZE,
  type ActivityEventType,
  type RestaurantActivityEvent,
} from "@/app/services/activity/get-business-activity";
import { standardEase } from "@/app/lib/motion";

const activityCardClass = "overflow-hidden rounded-none border-0 bg-white shadow-none";

const thClass =
  "sticky top-0 z-[1] whitespace-nowrap bg-[#f8fafc] px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
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

function ActivityDescriptionDisplay({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverMounted, setPopoverMounted] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | undefined>();

  useEffect(() => {
    setPopoverMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;

    const measure = () => {
      setIsTruncated(
        el.scrollHeight > el.clientHeight + 1 ||
          el.scrollWidth > el.clientWidth + 1,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const updatePopoverPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 320;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8,
    );
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openAbove = spaceBelow < 160 && rect.top > spaceBelow;
    setPopoverStyle({
      position: "fixed",
      left,
      width,
      zIndex: 120,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, []);

  const showPopover = useCallback(() => {
    if (!isTruncated) return;
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    updatePopoverPosition();
    setPopoverOpen(true);
  }, [isTruncated, updatePopoverPosition]);

  const scheduleHidePopover = useCallback(() => {
    if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setPopoverOpen(false);
      hideTimerRef.current = null;
    }, 120);
  }, []);

  useEffect(() => {
    if (!popoverOpen) return;
    const onScrollOrResize = () => updatePopoverPosition();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopoverOpen(false);
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [popoverOpen, updatePopoverPosition]);

  return (
    <>
      <span
        ref={anchorRef}
        tabIndex={isTruncated ? 0 : undefined}
        onMouseEnter={showPopover}
        onMouseLeave={scheduleHidePopover}
        onFocus={showPopover}
        onBlur={scheduleHidePopover}
        className={`line-clamp-2 text-slate-600 ${isTruncated ? "cursor-help" : ""} ${className}`.trim()}
      >
        {text}
      </span>

      {popoverMounted &&
      popoverOpen &&
      isTruncated &&
      popoverStyle &&
      createPortal(
        <div
          role="tooltip"
          style={popoverStyle}
          onMouseEnter={showPopover}
          onMouseLeave={scheduleHidePopover}
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
        >
          <p className="m-0 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-zinc-900">
            {text}
          </p>
        </div>,
        document.body,
      )}
    </>
  );
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
      <div className="mt-3">
        <ActivityDescriptionDisplay
          text={activityDescription(event)}
          className="text-[0.8rem] font-medium leading-snug"
        />
      </div>
    </article>
  );
}

export function BusinessActivityPanel({
  businessId,
}: {
  businessId: number;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const calendarMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);

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

  const periodRange = useMemo(() => {
    if (calendarMode === "day") {
      return resolveActivityDateRange(dateFilter, calendarMonthCount);
    }
    return (
      getActivityMonthRangeForKey(monthFilter, calendarMonthCount) ??
      resolveActivityDateRange(currentActivityDateKey(), calendarMonthCount)
    );
  }, [calendarMode, calendarMonthCount, dateFilter, monthFilter]);

  const hasActiveFilters =
    eventFilter !== "all" ||
    calendarMode !== "month" ||
    monthFilter !== currentActivityMonthKey() ||
    Boolean(debouncedSearch);

  const eventsQuery = useQuery({
    queryKey: [
      "business-activity-events",
      businessId,
      page,
      eventFilter,
      periodRange.from,
      periodRange.to,
      debouncedSearch,
    ],
    queryFn: () =>
      getRestaurantActivityEvents(businessId, {
        page,
        limit: RESTAURANT_ACTIVITY_PAGE_SIZE,
        eventType: eventFilter,
        from: periodRange.from,
        to: periodRange.to,
        search: debouncedSearch || undefined,
      }),
    enabled: businessId > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  useSidebarSectionLiveReload(businessId, "activity", () => {
    setPage(1);
    void queryClient.invalidateQueries({
      queryKey: ["business-activity-events", businessId],
    });
  });

  const events = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta ?? null;
  const summary = eventsQuery.data?.counts ?? null;
  const initialLoading = eventsQuery.isLoading && eventsQuery.data == null;
  const fetchingResults =
    eventsQuery.isFetching && !eventsQuery.isLoading && eventsQuery.data != null;
  const error = eventsQuery.error
    ? getApiErrorMessage(eventsQuery.error, "Could not load activity.")
    : null;

  const totalEvents = meta?.total ?? 0;
  const allEventsTotal = meta?.allEventsTotal ?? totalEvents;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const rowOffset = meta ? (meta.page - 1) * meta.limit : 0;

  useEffect(() => {
    setPage(1);
  }, [eventFilter, calendarMode, monthFilter, dateFilter, debouncedSearch]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (error) setAlertDismissed(false);
  }, [error]);

  const showEmpty =
    !initialLoading && !error && !hasActiveFilters && allEventsTotal === 0;
  const showFilteredEmpty =
    !initialLoading && !error && !showEmpty && totalEvents === 0;
  const showNoResults = showEmpty || showFilteredEmpty;
  const showTable = !error && events.length > 0;
  const allCount = totalEvents;

  const activityHeader = (
    <div className="relative shrink-0 border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]"
            aria-hidden
          >
            <Activity className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
              Activity Log
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Track visits, payments, redemptions, and messages from your guests
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
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests…"
              aria-label="Search activity"
              className="h-9 w-44 rounded-xl border border-[#e8edf5] bg-white pl-8 pr-12 text-xs leading-none text-[#07111f] outline-none focus:border-[#0B69FC]/40 focus:ring-2 focus:ring-[#0B69FC]/15 sm:w-56"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-[#e8edf5] bg-[#f8fafc] px-1.5 py-0.5 text-[0.6rem] font-semibold text-slate-400">
              ⌘K
            </span>
          </label>
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
          <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-3 text-xs font-semibold text-slate-600">
            <Activity className="size-3.5 text-slate-400" aria-hidden />
            {allCount} {allCount === 1 ? "activity" : "activities"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Activity">
      <OverviewAlertDialog
        open={error != null && !alertDismissed}
        message={error ?? ""}
        onClose={() => setAlertDismissed(true)}
      />

      <div className="rd-premium-page">
          <article className={`${activityCardClass} rd-premium-panel`}>
            {activityHeader}
            <div
              className="flex shrink-0 flex-wrap gap-1 border-b border-[#e8edf5] px-5 sm:px-6"
              aria-label="Activity filters"
            >
              {EVENT_FILTERS.map((filter) => (
                <FilterTab
                  key={filter.id}
                  label={filter.label}
                  icon={filter.icon}
                  count={
                    filter.countKey != null
                      ? (summary?.[filter.countKey] ?? 0)
                      : 0
                  }
                  active={eventFilter === filter.id}
                  onClick={() => setEventFilter(filter.id)}
                />
              ))}
            </div>

            <div
              className={`rd-premium-panel__body${
                showNoResults ? " rd-premium-panel__body--center" : ""
              }`}
            >
              {initialLoading && events.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: standardEase }}
                >
                  <ActivityTableBodySkeleton />
                </motion.div>
              ) : null}

              {showNoResults ? (
                <TableNoResultsEmptyState
                  icon={Search}
                  title="No matching activity"
                  description="Nothing matches this search, filter, or date. Try another day or month."
                />
              ) : null}

              {showTable ? (
                <div
                  className="table-scroll-shell"
                  aria-busy={fetchingResults}
                >
                  <div className="table-h-scroll hidden md:block">
                    <table className="border-collapse">
                      <thead>
                        <tr className="border-b border-[#e8edf5]">
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
                        </tr>
                      </thead>
                      <tbody
                        key={`activity-rows-${page}-${eventFilter}-${periodRange.from}-${periodRange.to}-${debouncedSearch}`}
                        className={`transition-opacity duration-200 ease-out ${
                          fetchingResults ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        {events.map((event, index) => {
                          const rowNumber = rowOffset + index + 1;
                          const name = guestName(event);

                          return (
                            <tr
                              key={event.id}
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
                                <ActivityDescriptionDisplay
                                  text={activityDescription(event)}
                                />
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className={`flex flex-col gap-2.5 p-3.5 transition-opacity duration-200 ease-out md:hidden ${
                      fetchingResults ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    {events.map((event, index) => (
                      <ActivityEventMobileCard
                        key={event.id}
                        event={event}
                        rowNumber={rowOffset + index + 1}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
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
                      disabled={initialLoading || fetchingResults || page <= 1}
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
                      disabled={
                        initialLoading ||
                        fetchingResults ||
                        page >= meta.totalPages
                      }
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
      </div>
    </section>
  );
}
