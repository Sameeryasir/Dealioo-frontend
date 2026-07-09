"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleDollarSign,
  Gift,
  MapPin,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
import { ReportTable } from "@/app/components/shared/ReportTable";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { ActivityEventTypeDropdown } from "@/app/components/business/ActivityEventTypeDropdown";
import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { formatMessageSentDescription } from "@/app/lib/activity-message-preview";
import { formatDateTimeShort } from "@/app/lib/datetime";
import {
  ACTIVITY_ALL_MONTHS_ID,
  buildActivityMonthFilterOptions,
  resolveActivityMonthRange,
} from "@/app/lib/activity-month-filter";
import {
  getRestaurantActivityEvents,
  getRestaurantActivitySummary,
  RESTAURANT_ACTIVITY_PAGE_SIZE,
  type ActivityEventType,
  type ActivitySummary,
  type RestaurantActivityEvent,
} from "@/app/services/activity/get-business-activity";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-zinc-500 first:pl-6 last:pr-6";
const tdClass =
  "px-4 py-3.5 text-left align-middle text-sm text-zinc-700 first:pl-6 last:pr-6";

type EventFilter = "all" | ActivityEventType;

function activityDescription(event: RestaurantActivityEvent): string {
  const text = event.description?.trim();
  if (!text) {
    return "N/A";
  }
  if (event.eventType === "message_sent") {
    return formatMessageSentDescription(text);
  }
  return text;
}

function eventTypeLabel(type: ActivityEventType): string {
  switch (type) {
    case "visited":
      return "Visited";
    case "redeemed_reward":
      return "Redeemed reward";
    case "prepaid_for_offer":
      return "Prepaid for offer";
    case "message_sent":
      return "Text sent";
    default:
      return type;
  }
}

function EventTypeBadge({ type }: { type: ActivityEventType }) {
  switch (type) {
    case "visited":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
          <MapPin className="size-3.5" aria-hidden />
          Visited
        </span>
      );
    case "redeemed_reward":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-200">
          <Gift className="size-3.5" aria-hidden />
          Redeemed reward
        </span>
      );
    case "prepaid_for_offer":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 ring-1 ring-rose-200">
          <CircleDollarSign className="size-3.5" aria-hidden />
          Prepaid for offer
        </span>
      );
    case "message_sent":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-200">
          <MessageSquare className="size-3.5" aria-hidden />
          Text sent
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
          {eventTypeLabel(type)}
        </span>
      );
  }
}

function groupByDay(events: RestaurantActivityEvent[]): Array<{
  label: string;
  events: RestaurantActivityEvent[];
}> {
  const groups = new Map<string, RestaurantActivityEvent[]>();

  for (const event of events) {
    const day = new Date(event.occurredAt).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const bucket = groups.get(day) ?? [];
    bucket.push(event);
    groups.set(day, bucket);
  }

  return [...groups.entries()].map(([label, dayEvents]) => ({
    label,
    events: dayEvents,
  }));
}

export function BusinessActivityPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [monthFilter, setMonthFilter] = useState(ACTIVITY_ALL_MONTHS_ID);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<RestaurantActivityEvent[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
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

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [eventsResponse, summaryResponse] = await Promise.all([
        getRestaurantActivityEvents(businessId, {
          page,
          limit: RESTAURANT_ACTIVITY_PAGE_SIZE,
          eventType: eventFilter,
          from: range.from,
          to: range.to,
        }),
        getRestaurantActivitySummary(businessId, {
          from: range.from,
          to: range.to,
        }),
      ]);

      setEvents(eventsResponse.data);
      setMeta(eventsResponse.meta);
      setSummary(summaryResponse);
    } catch (err) {
      setEvents([]);
      setMeta(null);
      setSummary(null);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load activity.",
      );
    } finally {
      setLoading(false);
    }
  }, [eventFilter, page, range.from, range.to, businessId]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    setPage(1);
  }, [eventFilter, monthFilter]);

  const groupedEvents = useMemo(() => groupByDay(events), [events]);
  const showEmpty = !loading && !errorMessage && events.length === 0;

  return (
    <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Activity Log
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedMonthOption?.label ?? "Last 12 months"}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <ActivityMonthCalendarPicker
              value={monthFilter}
              onChange={setMonthFilter}
            />
            <ActivityEventTypeDropdown
              value={eventFilter}
              onChange={setEventFilter}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {summary ? (
          <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Total events
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {summary.totalEvents}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Visits
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {summary.totalVisited}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Redemptions
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {summary.totalRedeemed}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Prepaid offers
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {summary.totalPrepaid}
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {loading && events.length === 0 ? (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white px-6 py-14 text-center text-sm text-zinc-500">
            Loading activity…
          </div>
        ) : null}

        {showEmpty ? (
          <div className="mt-6">
            <PanelEmptyState
              icon={Activity}
              title="No activity yet"
              description="When guests visit, redeem rewards, or pay through your funnel, events will appear here."
            />
          </div>
        ) : null}

        {!loading && events.length > 0 ? (
          <ReportTable
            className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            minWidthClass="min-w-[48rem]"
            header={
              <div className="flex flex-col gap-3 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                    <Activity className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-zinc-900">
                      Events
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Visits, redemptions, prepaid payments, and text sent
                    </p>
                  </div>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold tabular-nums text-white">
                  {meta?.total ?? 0} events
                </span>
              </div>
            }
            footer={
              meta && meta.totalPages > 1 ? (
                <OffsetPagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  loading={loading}
                  onPageChange={setPage}
                  itemLabel="events"
                />
              ) : null
            }
          >
            <div className="divide-y divide-zinc-100">
              {groupedEvents.map((group) => (
                <div key={group.label}>
                  <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:px-6">
                    {group.label}
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-white">
                        <th className={thClass}>
                          <TableColumnHeader label="Event time" />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader label="Event type" />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader icon={UserRound} label="Guest" />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader label="Description" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.events.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-zinc-100 last:border-0"
                        >
                          <td
                            className={`${tdClass} whitespace-nowrap tabular-nums text-zinc-600`}
                          >
                            {formatDateTimeShort(event.occurredAt)}
                          </td>
                          <td className={tdClass}>
                            <EventTypeBadge type={event.eventType} />
                            <span className="sr-only">
                              {eventTypeLabel(event.eventType)}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <span className="font-medium text-zinc-900">
                              {event.customerName?.trim() || "Guest"}
                            </span>
                            {event.customerEmail ? (
                              <span className="mt-0.5 block text-xs text-zinc-500">
                                {event.customerEmail}
                              </span>
                            ) : null}
                          </td>
                          <td className={tdClass}>
                            {activityDescription(event)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </ReportTable>
        ) : null}
      </div>
    </div>
  );
}
