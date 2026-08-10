"use client";

import { Skeleton } from "@/app/components/skeleton";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  BUSINESS_CUSTOMERS_PAGE_SIZE,
  getBusinessCustomers,
  getBusinessJoiningTrend,
  type BusinessCustomerRecord,
} from "@/app/services/customer/get-business-customers";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Download,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const JOINING_TREND_MONTHS = 6;
const BRAND = "#1877f2";

const panelCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

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

function customerInitial(customer: BusinessCustomerRecord): string {
  const fromName = customer.name.trim().charAt(0);
  if (fromName) return fromName.toUpperCase();
  return (customer.email.charAt(0) || "?").toUpperCase();
}

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)]"
      style={{ background: BRAND }}
      aria-hidden
    >
      {children}
    </span>
  );
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
    <div className="overflow-x-auto" aria-busy="true">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-[#e8edf5] bg-[#f8fafc]">
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 text-left">
                <Skeleton className="h-3 w-14" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, index) => (
            <tr
              key={index}
              className={`border-b border-[#f1f5f9] last:border-b-0 ${
                index % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
              }`}
            >
              <td className="px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3.5">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3.5">
                <Skeleton className="h-4 w-8" />
              </td>
              <td className="px-4 py-3.5">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3.5">
                <Skeleton className="size-8 rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JoiningTrendChart({
  businessId,
  totalGuests,
}: {
  businessId: number;
  totalGuests: number;
}) {
  const trendQuery = useQuery({
    queryKey: ["business-joining-trend", businessId, JOINING_TREND_MONTHS],
    queryFn: () => getBusinessJoiningTrend(businessId, JOINING_TREND_MONTHS),
    staleTime: 30_000,
  });

  const chartData = trendQuery.data ?? [];
  const totalJoined = useMemo(
    () => chartData.reduce((sum, point) => sum + point.joined, 0),
    [chartData],
  );
  const guestsLabel = totalGuests > 0 ? totalGuests : totalJoined;

  return (
    <div className={panelCardClass}>
      <div className="relative border-b border-[#f1f5f9] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <SectionIcon>
              <Users className="size-5" strokeWidth={2.25} />
            </SectionIcon>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
                  Guest joining trend
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f8ff] px-2 py-0.5 text-[10px] font-semibold leading-none text-[#1877f2] ring-1 ring-[#bfdbfe]">
                  <CalendarDays className="size-2.5 shrink-0" aria-hidden />
                  {JOINING_TREND_MONTHS} mo
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Guests joined per month
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 text-xs font-bold text-[#1877f2] ring-1 ring-[#bfdbfe]">
              <Users className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="leading-none">
                {guestsLabel.toLocaleString()} guest
                {guestsLabel === 1 ? "" : "s"}
              </span>
            </span>
            {!trendQuery.isLoading && !trendQuery.isError ? (
              <div className="flex h-14 min-w-[5.5rem] flex-col items-center justify-center rounded-2xl border border-[#e8edf5] bg-white px-3.5 text-center shadow-sm">
                <p className="text-xl font-extrabold tabular-nums leading-none text-[#07111f]">
                  {guestsLabel.toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Total Guests
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-[#eef2f7] bg-[#fbfdff] p-3 sm:p-4">
          {trendQuery.isLoading ? (
            <Skeleton className="h-[250px] w-full rounded-xl" />
          ) : trendQuery.isError ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <p className="text-sm text-red-700">
                {getApiErrorMessage(
                  trendQuery.error,
                  "Could not load joining trend.",
                )}
              </p>
              <button
                type="button"
                onClick={() => void trendQuery.refetch()}
                className="h-9 cursor-pointer rounded-xl border border-[#e8edf5] px-3 text-xs font-semibold text-slate-700 transition hover:bg-[#f8fafc]"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="h-[250px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 16, right: 12, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="programJoinArea"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={BRAND}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={BRAND}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 6"
                      stroke="#e8edf5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: "#e8edf5" }}
                      tickLine={false}
                      interval={0}
                      height={34}
                      dy={6}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e8edf5",
                        boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                        fontSize: 12,
                      }}
                      formatter={(value) => [
                        `${Number(value) || 0} guest${
                          Number(value) === 1 ? "" : "s"
                        }`,
                        "Joined",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="joined"
                      name="Joined"
                      stroke={BRAND}
                      strokeWidth={2.5}
                      fill="url(#programJoinArea)"
                      dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 pt-1 text-xs font-semibold leading-none text-slate-500">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: BRAND }}
                  aria-hidden
                />
                Joined
              </div>
            </>
          )}
        </div>
      </div>
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

  const customersQuery = useQuery({
    queryKey: ["business-customers", businessId, page],
    queryFn: () =>
      getBusinessCustomers(businessId, page, BUSINESS_CUSTOMERS_PAGE_SIZE),
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

  return (
    <section className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: easeOut }}
      >
        <JoiningTrendChart businessId={businessId} totalGuests={total} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14, ease: easeOut }}
        className={panelCardClass}
      >
        <div className="relative border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <SectionIcon>
                <UserRound className="size-5" strokeWidth={2.25} />
              </SectionIcon>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
                  Guest roster
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Contact details, visits, and joining date
                </p>
              </div>
            </div>

            <div className="flex h-10 flex-wrap items-center gap-2">
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
                  className="h-9 w-44 rounded-xl border border-[#e8edf5] bg-white pl-8 pr-3 text-xs leading-none text-[#07111f] outline-none focus:border-[#1877f2]/40 focus:ring-2 focus:ring-[#1877f2]/15 sm:w-56"
                />
              </label>
              <button
                type="button"
                onClick={() => exportGuestsCsv(filteredCustomers)}
                disabled={filteredCustomers.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#1877f2] px-3 text-xs font-semibold leading-none text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="size-3.5 shrink-0" aria-hidden />
                Export
              </button>
              {rangeLabel ? (
                <span className="inline-flex h-9 items-center rounded-full bg-[#f4f8ff] px-2.5 text-[0.7rem] font-bold leading-none text-[#1877f2] ring-1 ring-[#bfdbfe]">
                  {rangeLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

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
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-5 flex size-20 items-center justify-center rounded-[1.35rem] bg-[#e8f2ff] text-[#1877f2] shadow-[0_12px_30px_rgba(24,119,242,0.12)] ring-1 ring-[#bfdbfe]">
              <Users className="size-9" strokeWidth={2} aria-hidden />
            </span>
            <p className="text-base font-bold text-[#07111f]">No guests yet</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
              Guests appear here after they visit, chat, or complete a purchase
              with this business.
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">
            No guests match “{search.trim()}”.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#e8edf5] bg-[#f8fafc]">
                    <th className="whitespace-nowrap px-5 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={UserRound}
                        label="Guest"
                        iconClassName="text-[#1877f2]"
                        labelClassName="text-[#1877f2]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={Mail}
                        label="Email"
                        iconClassName="text-[#1877f2]"
                        labelClassName="text-[#1877f2]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={Phone}
                        label="Phone"
                        iconClassName="text-[#1877f2]"
                        labelClassName="text-[#1877f2]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={BarChart3}
                        label="Visits"
                        iconClassName="text-[#1877f2]"
                        labelClassName="text-[#1877f2]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <TableColumnHeader
                        icon={CalendarDays}
                        label="Joining date"
                        iconClassName="text-[#1877f2]"
                        labelClassName="text-[#1877f2]"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left align-middle">
                      <span className="inline-flex items-center text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#1877f2]">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={`border-b border-[#f1f5f9] transition-colors last:border-b-0 hover:bg-[#f4f8ff]/70 ${
                        index % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold leading-none text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]">
                            {customerInitial(customer)}
                          </span>
                          <div className="min-w-0 leading-tight">
                            <p className="truncate text-sm font-bold text-[#07111f]">
                              {customer.name}
                            </p>
                            <p className="mt-0.5 truncate text-[0.7rem] font-medium text-slate-400">
                              Guest profile
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="inline-flex max-w-full items-center gap-1.5 text-sm leading-none text-slate-700">
                          <Mail
                            className="size-3.5 shrink-0 text-[#1877f2]"
                            aria-hidden
                          />
                          <span className="truncate">{customer.email}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        {customer.phone ? (
                          <span className="inline-flex max-w-full items-center gap-1.5 text-sm leading-none text-slate-700">
                            <Phone
                              className="size-3.5 shrink-0 text-[#1877f2]"
                              aria-hidden
                            />
                            <span className="truncate">{customer.phone}</span>
                          </span>
                        ) : (
                          <span className="text-sm leading-none text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-sm font-normal tabular-nums leading-none text-slate-700">
                          <BarChart3
                            className="size-3.5 shrink-0 text-[#1877f2]"
                            aria-hidden
                          />
                          {customer.visitCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold leading-none text-slate-700">
                          <CalendarDays
                            className="size-3.5 shrink-0 text-[#1877f2]"
                            aria-hidden
                          />
                          {formatJoiningDate(customer.joiningDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <button
                          type="button"
                          aria-label={`Actions for ${customer.name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf5] text-slate-400 transition hover:bg-[#f8fafc] hover:text-slate-600"
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f5f9] bg-white px-5 py-3.5">
                <p className="text-xs font-semibold text-slate-500">
                  {rangeLabel}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || customersQuery.isFetching}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="h-9 cursor-pointer rounded-xl border border-[#e8edf5] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    {customersQuery.isFetching ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || customersQuery.isFetching}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className="h-9 cursor-pointer rounded-xl border border-[#e8edf5] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </motion.div>
    </section>
  );
}
