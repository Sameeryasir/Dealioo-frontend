"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { Skeleton } from "@/app/components/skeleton";
import { AdSourceBadge } from "@/app/components/shared/AdSourceBadge";
import { TableNoResultsEmptyState } from "@/app/components/shared/TableNoResultsEmptyState";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
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
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  BUSINESS_CUSTOMERS_PAGE_SIZE,
  getBusinessCustomers,
  type BusinessCustomerRecord,
} from "@/app/services/customer/get-business-customers";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  Download,
  Loader2,
  Mail,
  Megaphone,
  Phone,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const LOGO = {
  blue: "#0B69FC",
  pink: "#F83071",
  orange: "#FD7137",
  purple: "#AD20E3",
  green: "#00B34C",
  yellow: "#FCB825",
} as const;

const panelCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-700 first:pl-5 last:pr-5";

const easeOut = [0.22, 1, 0.36, 1] as const;

function formatJoiningDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function customerInitials(customer: BusinessCustomerRecord): string {
  const parts = customer.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const email = customer.email.trim();
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  return (email.charAt(0) || "?").toUpperCase();
}

/** Same initials colors as the activity log. */
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

function exportGuestsCsv(customers: BusinessCustomerRecord[]) {
  const header = ["Name", "Email", "Phone", "Visits", "Joining date"];
  const rows = customers.map((c) => [
    c.name,
    c.email,
    c.phone ?? "",
    String(c.visitCount),
    formatJoiningDate(c.joiningDate),
  ]);
  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "guest-roster.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function CustomersTableSkeleton() {
  return (
    <div className="overflow-x-auto overscroll-x-contain" aria-busy="true">
      <table className="w-full min-w-[44rem] border-collapse">
        <thead>
          <tr className="border-b border-[#e8edf5] bg-[#f8fafc]/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className={thClass}>
                <Skeleton className="h-3 w-14" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, index) => (
            <tr
              key={index}
              className="border-b border-[#f1f5f9] last:border-0"
            >
              <td className={tdClass}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </td>
              <td className={tdClass}>
                <Skeleton className="h-4 w-40" />
              </td>
              <td className={tdClass}>
                <Skeleton className="h-4 w-24" />
              </td>
              <td className={tdClass}>
                <Skeleton className="h-5 w-16 rounded-full" />
              </td>
              <td className={tdClass}>
                <Skeleton className="h-4 w-8" />
              </td>
              <td className={tdClass}>
                <Skeleton className="h-4 w-24" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BusinessProgramCustomersPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const calendarMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);

  const periodRange = useMemo(() => {
    if (calendarMode === "day") {
      return resolveActivityDateRange(dateFilter, calendarMonthCount);
    }
    return (
      getActivityMonthRangeForKey(monthFilter, calendarMonthCount) ??
      resolveActivityDateRange(currentActivityDateKey(), calendarMonthCount)
    );
  }, [calendarMode, calendarMonthCount, dateFilter, monthFilter]);

  useEffect(() => {
    setPage(1);
  }, [calendarMode, monthFilter, dateFilter, search]);

  const customersQuery = useQuery({
    queryKey: [
      "business-customers",
      businessId,
      page,
      periodRange.from,
      periodRange.to,
    ],
    queryFn: () =>
      getBusinessCustomers(businessId, page, BUSINESS_CUSTOMERS_PAGE_SIZE, {
        from: periodRange.from,
        to: periodRange.to,
      }),
    staleTime: 30_000,
  });

  const customers = customersQuery.data?.data ?? [];
  const meta = customersQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const haystack = [c.name, c.email, c.phone ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, search]);

  const isLoading = customersQuery.isLoading;
  const loadError = customersQuery.isError
    ? getApiErrorMessage(customersQuery.error, "Could not load customers.")
    : null;

  const rangeLabel = useMemo(() => {
    if (!meta || total === 0) return null;
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, total);
    return `${start}–${end} of ${total}`;
  }, [meta, total]);

  const showEmpty =
    !isLoading &&
    !loadError &&
    (customers.length === 0 || filteredCustomers.length === 0);

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Guest roster">
      <div className="rd-premium-page">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOut }}
          className={`${panelCardClass} rd-premium-panel flex min-h-0 flex-1 flex-col`}
        >
          <div className="relative shrink-0 border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1877f2] ring-1 ring-[#e8edf5]"
                  aria-hidden
                >
                  <UserRound className="size-5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
                    Guest roster
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Contact details, visits, and joining date
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
                    placeholder="Search guests…"
                    aria-label="Search guests"
                    className="h-9 w-44 rounded-xl border border-[#e8edf5] bg-white pl-8 pr-3 text-xs leading-none text-[#07111f] outline-none focus:border-[#0B69FC]/40 focus:ring-2 focus:ring-[#0B69FC]/15 sm:w-56"
                  />
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
                <button
                  type="button"
                  onClick={() => exportGuestsCsv(filteredCustomers)}
                  disabled={filteredCustomers.length === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold leading-none text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: LOGO.blue }}
                >
                  <Download className="size-3.5 shrink-0" aria-hidden />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div
            className={`rd-premium-panel__body${
              showEmpty || loadError || isLoading
                ? " rd-premium-panel__body--center"
                : " overflow-hidden"
            }`}
          >
            {isLoading ? (
              <CustomersTableSkeleton />
            ) : loadError ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <AlertCircle
                  className="size-8 text-red-500"
                  strokeWidth={2}
                  aria-hidden
                />
                <p className="max-w-md text-sm text-red-700">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void customersQuery.refetch()}
                  className="h-10 cursor-pointer rounded-xl border border-[#e8edf5] px-4 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fafc]"
                >
                  Try again
                </button>
              </div>
            ) : showEmpty ? (
              <TableNoResultsEmptyState
                icon={Users}
                title={
                  search.trim()
                    ? `No guests match “${search.trim()}”`
                    : "No guests for this period"
                }
                description={
                  search.trim()
                    ? "Try another search, or clear filters to reset the date and search."
                    : "No guests joined in this month or day. Try another date, or clear filters to reset."
                }
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCalendarMode("month");
                      setMonthFilter(currentActivityMonthKey());
                      setDateFilter(currentActivityDateKey());
                    }}
                    className="cursor-pointer rounded-full border border-[#1877f2] bg-transparent px-5 py-2.5 text-[0.82rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[44rem] border-collapse">
                    <thead>
                      <tr className="border-b border-[#e8edf5] bg-[#f8fafc]/60">
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
                            icon={Phone}
                            label="Phone"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader
                            icon={Megaphone}
                            label="Ad source"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader
                            icon={BarChart3}
                            label="Visits"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                        <th className={thClass}>
                          <TableColumnHeader
                            icon={CalendarDays}
                            label="Joining date"
                            iconClassName={TABLE_HEAD_ICON_CLASS}
                            labelClassName={TABLE_HEAD_LABEL_CLASS}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer, index) => (
                        <tr
                          key={customer.id}
                          className="group border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
                        >
                          <td className={tdClass}>
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${avatarTone(index)}`}
                              >
                                {customerInitials(customer)}
                              </span>
                              <div className="min-w-0">
                                <span className="block truncate font-normal text-[#07111f]">
                                  {customer.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span className="block max-w-full truncate">
                              {customer.email}
                            </span>
                          </td>
                          <td className={tdClass}>
                            {customer.phone ? (
                              <span className="block max-w-full truncate">
                                {customer.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap`}>
                            <AdSourceBadge
                              source={customer.adSource}
                              label={customer.adSourceLabel}
                              detail={customer.adSourceDetail}
                            />
                          </td>
                          <td className={tdClass}>
                            <span className="tabular-nums">
                              {customer.visitCount}
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
                              {formatJoiningDate(customer.joiningDate)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-auto shrink-0 border-t border-[#e8edf5] px-2.5 py-3 sm:px-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="m-0 text-xs text-slate-500">{rangeLabel}</p>
                    {totalPages > 1 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={page <= 1 || customersQuery.isFetching}
                          onClick={() =>
                            setPage((current) => Math.max(1, current - 1))
                          }
                          className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="inline-flex min-w-[5rem] items-center justify-center gap-1.5 text-center text-sm font-medium tabular-nums text-slate-700">
                          {customersQuery.isFetching ? (
                            <Loader2
                              className="size-3.5 animate-spin text-[#1877f2]"
                              aria-hidden
                            />
                          ) : null}
                          Page {page} of {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={
                            page >= totalPages || customersQuery.isFetching
                          }
                          onClick={() =>
                            setPage((current) =>
                              Math.min(totalPages, current + 1),
                            )
                          }
                          className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.article>
      </div>
    </section>
  );
}
