"use client";

import { AutomationFilterDropdown } from "@/app/components/automation/AutomationFilterDropdown";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { Skeleton } from "@/app/components/skeleton";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { standardEase } from "@/app/lib/motion";
import {
  BUSINESS_HISTORY_PAGE_SIZE,
  businessHistoryQueryKey,
  getBusinessHistory,
  type BusinessHistoryEvent,
  type BusinessHistoryEventType,
  type HistoryCategory,
} from "@/app/services/business-history/get-business-history";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownToLine,
  Bot,
  Calendar,
  CreditCard,
  Filter,
  History,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const historyCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const EVENT_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: "", label: "Event type" },
  { id: "funnel_updated", label: "Funnel updated" },
  { id: "funnel_deleted", label: "Funnel deleted" },
  { id: "automation_activated", label: "Automation activated" },
  { id: "automation_deactivated", label: "Automation deactivated" },
  { id: "automation_updated", label: "Automation updated" },
  { id: "automation_deleted", label: "Automation deleted" },
  { id: "campaign_created", label: "Campaign created" },
  { id: "campaign_updated", label: "Campaign updated" },
  { id: "campaign_deleted", label: "Campaign deleted" },
  { id: "scanner_payment", label: "Payment" },
  { id: "scanner_purchase", label: "Purchase" },
  { id: "scanner_redeemed", label: "Redeemed" },
  { id: "business_created", label: "Business created" },
  { id: "business_updated", label: "Business updated" },
];

const TABS: {
  id: HistoryCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: "All Activity", icon: LayoutGrid },
  { id: "funnels", label: "Funnels", icon: Filter },
  { id: "automations", label: "Automations", icon: Bot },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "payments", label: "Payments", icon: CreditCard },
];

const AVATAR_TONES = [
  "bg-[#7c3aed] text-white",
  "bg-[#16a34a] text-white",
  "bg-[#2563eb] text-white",
  "bg-[#db2777] text-white",
  "bg-[#0f766e] text-white",
  "bg-[#d97706] text-white",
  "bg-[#e11d48] text-white",
];

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
    case "scanner_redeemed":
      return "Reward redeemed";
    case "scanner_payment":
      return "Payment collected";
    case "scanner_purchase":
      return "Purchase completed";
    default:
      return "History";
  }
}

function eventVisual(type: BusinessHistoryEventType): {
  dot: string;
  title: string;
  iconWrap: string;
  icon: LucideIcon;
} {
  if (type.startsWith("funnel_")) {
    return {
      dot: "bg-[#1877f2]",
      title: "text-[#1877f2]",
      iconWrap: "bg-[#e8f2ff] text-[#1877f2]",
      icon: Filter,
    };
  }
  if (type.startsWith("automation_")) {
    return {
      dot: "bg-[#1877f2]",
      title: "text-[#1877f2]",
      iconWrap: "bg-[#e8f2ff] text-[#1877f2]",
      icon: Bot,
    };
  }
  if (type.startsWith("campaign_")) {
    return {
      dot: "bg-[#1877f2]",
      title: "text-[#1877f2]",
      iconWrap: "bg-[#e8f2ff] text-[#1877f2]",
      icon: Megaphone,
    };
  }
  if (type.startsWith("scanner_")) {
    return {
      dot: "bg-[#1877f2]",
      title: "text-[#1877f2]",
      iconWrap: "bg-[#e8f2ff] text-[#1877f2]",
      icon: CreditCard,
    };
  }
  return {
    dot: "bg-[#1877f2]",
    title: "text-[#1877f2]",
    iconWrap: "bg-[#e8f2ff] text-[#1877f2]",
    icon: History,
  };
}

function actorInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts[0].charAt(0).toUpperCase();
}

function avatarTone(index: number): string {
  return AVATAR_TONES[index % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

function formatDateParts(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  } catch {
    return { date: "—", time: "" };
  }
}

function roleLabel(event: BusinessHistoryEvent): string {
  if (!event.actorName?.trim()) return "System";
  const role = event.actorRole?.trim();
  if (!role) return "Admin";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function exportRowsCsv(rows: BusinessHistoryEvent[]) {
  const header = ["Activity", "Description", "Performed by", "Date"];
  const lines = rows.map((event) => {
    const when = formatDateParts(event.occurredAt);
    return [
      eventTypeLabel(event.eventType),
      event.description,
      event.actorName?.trim() || "Team",
      `${when.date} ${when.time}`,
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
  link.download = "history-activity.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ActivityCell({ event }: { event: BusinessHistoryEvent }) {
  const visual = eventVisual(event.eventType);
  const Icon = visual.icon;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`size-1.5 shrink-0 rounded-full ${visual.dot}`}
        aria-hidden
      />
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${visual.iconWrap}`}
      >
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <p className={`m-0 min-w-0 text-[0.88rem] font-semibold leading-snug ${visual.title}`}>
        {eventTypeLabel(event.eventType)}
      </p>
    </div>
  );
}

function DescriptionCell({ event }: { event: BusinessHistoryEvent }) {
  const description = event.description?.trim() || "No details";
  return (
    <p className="m-0 max-w-[22rem] text-[0.82rem] leading-snug text-slate-500">
      {description}
    </p>
  );
}

function HistoryRow({
  event,
  index,
}: {
  event: BusinessHistoryEvent;
  index: number;
}) {
  const actor = event.actorName?.trim() || "Team";
  const when = formatDateParts(event.occurredAt);

  return (
    <tr className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc]">
      <td className="px-4 py-3.5 align-middle first:pl-5">
        <ActivityCell event={event} />
      </td>
      <td className="px-4 py-3.5 align-middle">
        <DescriptionCell event={event} />
      </td>
      <td className="px-4 py-3.5 align-middle">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${avatarTone(index)}`}
          >
            {actorInitial(actor)}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-semibold text-slate-900">
              {actor}
            </p>
            <p className="m-0 text-[0.72rem] text-slate-400">
              {roleLabel(event)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 align-middle last:pr-5">
        <p className="m-0 text-sm font-semibold text-slate-800">{when.date}</p>
        <p className="m-0 text-[0.72rem] text-slate-400">{when.time}</p>
      </td>
    </tr>
  );
}

export function BusinessHistoryPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<HistoryCategory>("all");
  const [eventType, setEventType] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [businessId, category, eventType, actorUserId, debouncedSearch]);

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

  const filters = useMemo(
    () => ({
      page,
      category,
      eventType: eventType || undefined,
      actorUserId: actorUserId ? Number(actorUserId) : undefined,
      q: debouncedSearch || undefined,
    }),
    [page, category, eventType, actorUserId, debouncedSearch],
  );

  const historyQuery = useQuery({
    queryKey: businessHistoryQueryKey(businessId, filters),
    queryFn: () => getBusinessHistory(businessId, filters),
    enabled: businessId > 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  const events = historyQuery.data?.data ?? [];
  const meta = historyQuery.data?.meta ?? null;
  const counts = historyQuery.data?.counts;
  const actors = historyQuery.data?.actors ?? [];
  const loading = historyQuery.isLoading || historyQuery.isFetching;
  const error = historyQuery.error
    ? getApiErrorMessage(historyQuery.error, "Could not load history.")
    : null;

  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const rowOffset = meta ? (meta.page - 1) * meta.limit : 0;
  const showTable = !error && events.length > 0;
  const allCount = counts?.all ?? total;

  const userOptions = useMemo(
    () => [
      { id: "", label: "User" },
      ...actors.map((actor) => ({ id: String(actor.id), label: actor.name })),
    ],
    [actors],
  );

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
          <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
            <div>
              <h2 className="m-0 text-[1.45rem] font-extrabold tracking-tight text-[#07111f]">
                History & Activity
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Track changes and actions across your workspace
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E8EDF5] bg-white px-3 text-xs font-semibold text-slate-600">
                <Activity className="size-3.5 text-slate-400" aria-hidden />
                {allCount} {allCount === 1 ? "activity" : "activities"}
              </span>
              <button
                type="button"
                onClick={() => exportRowsCsv(events)}
                disabled={events.length === 0}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E8EDF5] bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                <ArrowDownToLine className="size-3.5" strokeWidth={2.25} />
                Export
              </button>
            </div>
          </header>

          <div className="mt-4 flex flex-wrap items-center gap-2 px-5 sm:px-6">
            <label className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities, users, or events..."
                className="h-10 w-full rounded-xl border border-[#E8EDF5] bg-white py-2 pl-9 pr-16 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c7d7f5] focus:ring-2 focus:ring-[#e8f1ff]"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[#E8EDF5] bg-[#f8fafc] px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-400">
                ⌘ K
              </span>
            </label>
            <AutomationFilterDropdown
              className="w-[11.5rem] shrink-0"
              ariaLabel="Filter by event type"
              value={eventType}
              options={EVENT_TYPE_OPTIONS}
              onChange={setEventType}
            />
            <AutomationFilterDropdown
              className="w-[10.5rem] shrink-0"
              ariaLabel="Filter by user"
              value={actorUserId}
              options={userOptions}
              onChange={setActorUserId}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-1 border-b border-[#e8edf5] px-5 sm:px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = category === tab.id;
              const count = counts?.[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-2.5 text-sm font-semibold ${
                    selected
                      ? "text-[#1877f2]"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                      selected
                        ? "bg-[#e8f2ff] text-[#1877f2]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                  {selected ? (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#1877f2]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="rd-premium-panel__body">
            {loading && events.length === 0 ? (
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b border-[#f1f5f9] px-5 py-4 last:border-0"
                  >
                    <Skeleton funnel className="size-8 shrink-0 rounded-lg" />
                    <Skeleton funnel className="h-4 w-72" />
                    <Skeleton funnel className="ml-auto size-8 rounded-full" />
                    <Skeleton funnel className="h-4 w-16" />
                  </div>
                ))}
              </div>
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
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[44rem] border-collapse">
                    <thead>
                      <tr className="border-b border-[#e8edf5] bg-[#f8fafc]/80">
                        <th className="px-4 py-3 text-left first:pl-5">
                          <TableColumnHeader
                            icon={Activity}
                            label="Activity"
                            iconClassName="text-[#1877f2]"
                            labelClassName="text-[#1877f2]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left">
                          <TableColumnHeader
                            icon={MessageSquare}
                            label="Description"
                            iconClassName="text-[#1877f2]"
                            labelClassName="text-[#1877f2]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left">
                          <TableColumnHeader
                            icon={UserRound}
                            label="Performed by"
                            iconClassName="text-[#1877f2]"
                            labelClassName="text-[#1877f2]"
                          />
                        </th>
                        <th className="px-4 py-3 text-left last:pr-5">
                          <TableColumnHeader
                            icon={Calendar}
                            label="Date"
                            iconClassName="text-[#1877f2]"
                            labelClassName="text-[#1877f2]"
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, index) => (
                        <HistoryRow key={event.id} event={event} index={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="m-0 list-none p-0 md:hidden">
                  {events.map((event, index) => {
                    const actor = event.actorName?.trim() || "Team";
                    const when = formatDateParts(event.occurredAt);
                    return (
                      <li
                        key={event.id}
                        className="border-b border-[#f1f5f9] px-4 py-3.5 last:border-0"
                      >
                        <ActivityCell event={event} />
                        <p className="m-0 mt-2 pl-8 text-[0.82rem] leading-snug text-slate-500">
                          {event.description?.trim() || "No details"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3 pl-8">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold ${avatarTone(index)}`}
                            >
                              {actorInitial(actor)}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {actor}
                            </span>
                          </div>
                          <p className="m-0 text-xs text-slate-400">
                            {when.date} · {when.time}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </div>

          {showTable && meta && meta.total > 0 ? (
            <div className="shrink-0 border-t border-[#e8edf5] px-5 py-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-xs text-slate-500">
                  Showing {meta.total === 0 ? 0 : rowOffset + 1} to{" "}
                  {Math.min(rowOffset + meta.limit, meta.total)} of {meta.total}
                  {meta.limit > 0
                    ? ` · ${meta.limit || BUSINESS_HISTORY_PAGE_SIZE} per page`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
