"use client";

import { OverviewChartLegend } from "@/app/components/campaign/overview/charts/OverviewChartLegend";
import { OverviewChartShell } from "@/app/components/campaign/overview/charts/OverviewChartShell";
import { OVERVIEW_CHART_COLORS } from "@/app/components/campaign/overview/charts/overview-chart-config";
import { Skeleton } from "@/app/components/skeleton";
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
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const JOINING_TREND_MONTHS = 6;

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

function CustomersTableSkeleton() {
  return (
    <div className="space-y-3 px-5 py-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

function JoiningTrendChart({ businessId }: { businessId: number }) {
  const trendQuery = useQuery({
    queryKey: ["business-joining-trend", businessId, JOINING_TREND_MONTHS],
    queryFn: () => getBusinessJoiningTrend(businessId, JOINING_TREND_MONTHS),
    staleTime: 30_000,
  });

  const data = trendQuery.data ?? [];
  const totalJoined = useMemo(
    () => data.reduce((sum, point) => sum + point.joined, 0),
    [data],
  );
  const peakJoined = useMemo(
    () => data.reduce((max, point) => Math.max(max, point.joined), 0),
    [data],
  );
  const currentMonthKey = data.length > 0 ? data[data.length - 1]?.monthKey : null;

  return (
    <OverviewChartShell
      title="Guest joining trend"
      subtitle={`Guests joined per month · last ${JOINING_TREND_MONTHS} months`}
      minHeightClass="min-h-[300px]"
      accent="blue"
      stat={
        trendQuery.isLoading || trendQuery.isError
          ? undefined
          : totalJoined.toLocaleString()
      }
    >
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
              <BarChart
                data={data}
                margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="22%"
              >
                <defs>
                  <linearGradient id="programJoinBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4da3ff" stopOpacity={1} />
                    <stop offset="55%" stopColor="#1877f2" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0d5bb8" stopOpacity={0.92} />
                  </linearGradient>
                  <linearGradient
                    id="programJoinBarMuted"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.55} />
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
                  cursor={{ fill: "rgba(24,119,242,0.06)", radius: 8 }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e8edf5",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    `${Number(value) || 0} guest${Number(value) === 1 ? "" : "s"}`,
                    "Joined",
                  ]}
                />
                <Bar
                  dataKey="joined"
                  name="Joined"
                  radius={[10, 10, 3, 3]}
                  maxBarSize={44}
                >
                  {data.map((point) => {
                    const isPeak =
                      peakJoined > 0 && point.joined === peakJoined;
                    const isCurrent = point.monthKey === currentMonthKey;
                    return (
                      <Cell
                        key={point.monthKey}
                        fill={
                          isPeak || isCurrent
                            ? "url(#programJoinBar)"
                            : "url(#programJoinBarMuted)"
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <OverviewChartLegend
            items={[
              {
                label: "Joined",
                value: totalJoined.toLocaleString(),
                color: OVERVIEW_CHART_COLORS.blue,
              },
            ]}
          />
        </>
      )}
    </OverviewChartShell>
  );
}

export function BusinessProgramCustomersPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [page, setPage] = useState(1);

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
      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-3 px-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f4f8ff] px-3 py-1.5 text-xs font-bold text-[#1877f2] ring-1 ring-[#bfdbfe]">
            <Users className="size-3.5" strokeWidth={2.25} aria-hidden />
            {total.toLocaleString()} guest{total === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: easeOut }}
      >
        <JoiningTrendChart businessId={businessId} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14, ease: easeOut }}
        className={panelCardClass}
      >
        <div className="relative border-b border-[#f1f5f9] bg-gradient-to-r from-[#e8f2ff]/70 via-white to-white px-5 py-4 sm:px-6">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1877f2]/80 via-[#1877f2]/35 to-transparent"
            aria-hidden
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-[#07111f]">
                Guest roster
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Contact details, visits, and joining date
              </p>
            </div>
            {rangeLabel ? (
              <span className="rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.7rem] font-bold text-[#1877f2] ring-1 ring-[#bfdbfe]">
                {rangeLabel}
              </span>
            ) : null}
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
            <span className="mb-5 flex size-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[#e8f2ff] to-white text-[#1877f2] shadow-[0_12px_30px_rgba(24,119,242,0.12)] ring-1 ring-[#bfdbfe]">
              <Users className="size-9" strokeWidth={2} aria-hidden />
            </span>
            <p className="text-base font-bold text-[#07111f]">No guests yet</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
              Guests appear here after they visit, chat, or complete a purchase
              with this business.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#e8edf5] bg-[#f8fafc]/80">
                    <th className="px-5 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Visits
                    </th>
                    <th className="px-5 py-3 text-left text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800">
                      Joining date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={`border-b border-[#f1f5f9] transition-colors last:border-b-0 hover:bg-[#f4f8ff]/70 ${
                        index % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-sm font-bold text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)] ring-2 ring-white">
                            {customerInitial(customer)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#07111f]">
                              {customer.name}
                            </p>
                            <p className="mt-0.5 truncate text-[0.7rem] font-medium text-slate-400">
                              Guest profile
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-700">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f4f8ff] text-[#1877f2] ring-1 ring-[#e8edf5]">
                            <Mail className="size-3.5" aria-hidden />
                          </span>
                          <span className="truncate">{customer.email}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {customer.phone ? (
                          <p className="flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-700">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#34a853] ring-1 ring-[#d1fae5]">
                              <Phone className="size-3.5" aria-hidden />
                            </span>
                            <span className="truncate">{customer.phone}</span>
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex min-w-[2.75rem] items-center justify-center rounded-full bg-gradient-to-r from-[#e8f2ff] to-[#f4f8ff] px-2.5 py-1 text-sm font-extrabold tabular-nums text-[#1877f2] ring-1 ring-[#bfdbfe]">
                          {customer.visitCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8fafc] px-2.5 py-1 text-sm font-semibold text-slate-700 ring-1 ring-[#e8edf5]">
                          <CalendarDays
                            className="size-3.5 text-[#1877f2]"
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

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f5f9] bg-gradient-to-r from-white to-[#f8fafc] px-5 py-3.5">
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
