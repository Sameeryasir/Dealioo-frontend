"use client";

import {
  Calendar,
  CircleCheck,
  CircleDollarSign,
  ExternalLink,
  Hash,
  Layers,
  Mail,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { StripeIcon } from "@/app/components/StripeLogo";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelPayments } from "@/app/hooks/use-funnel-payments";

const ordersEase = [0.22, 1, 0.36, 1] as const;

const ordersStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const ordersItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ordersEase },
  },
};

const thClass =
  "whitespace-nowrap px-5 py-3.5 text-left align-middle sm:px-6";
const tdClass = "px-5 py-4 text-left align-middle text-sm sm:px-6";

function ColumnLabel({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold text-zinc-900">
      <Icon className="size-4 shrink-0 text-black" strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-5">
        <div className="flex w-full gap-6">
          <Skeleton className="h-3 w-[10%]" />
          <Skeleton className="h-3 w-[28%]" />
          <Skeleton className="h-3 w-[12%]" />
          <Skeleton className="h-3 w-[12%]" />
          <Skeleton className="h-3 w-[20%]" />
          <Skeleton className="h-3 w-[12%]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full gap-6 border-b border-zinc-100 px-4 py-4 last:border-0 sm:px-5"
        >
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-[28%]" />
          <Skeleton className="h-4 w-[12%]" />
          <Skeleton className="h-4 w-[12%]" />
          <Skeleton className="h-4 w-[20%]" />
          <Skeleton className="h-4 w-[12%]" />
        </div>
      ))}
    </div>
  );
}

function formatMoney(amount: number, currency: string): string {
  const code = (currency || "usd").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code === "USD" ? "USD" : "USD",
  }).format(amount / 100);
}

function formatPaidAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s === "paid" || s === "succeeded") {
    return "bg-zinc-900 text-white";
  }
  if (s === "failed") return "bg-red-100 text-red-800";
  if (s === "cancelled" || s === "canceled") {
    return "bg-zinc-100 text-zinc-600";
  }
  return "bg-amber-100 text-amber-900";
}

export function FunnelOrdersPanel({
  funnelId,
  isFunnelIdLoading = false,
}: {
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
}) {
  const { payments, isLoading: isPaymentsLoading, error } =
    useFunnelPayments(funnelId);

  const showSkeleton = isFunnelIdLoading || isPaymentsLoading;
  const showNoFunnelMessage =
    !isFunnelIdLoading && !isPaymentsLoading && funnelId == null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: ordersEase }}
          >
            <TableSkeleton />
          </motion.div>
        ) : null}

        {showNoFunnelMessage ? (
          <p className="rounded-2xl border border-zinc-200/90 bg-white px-4 py-12 text-center text-sm text-zinc-500 shadow-sm">
            No funnel saved yet. Open the Funnel tab and save once to load
            orders.
          </p>
        ) : null}

        {error && !showSkeleton ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {!showSkeleton &&
        !error &&
        funnelId != null &&
        payments.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
            <p className="px-4 py-12 text-center text-sm text-zinc-500 sm:px-5">
              No payments yet for this funnel.
            </p>
          </div>
        ) : null}

        {!showSkeleton && !error && payments.length > 0 ? (
          <motion.div
            key="orders-table"
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-950/5"
            variants={ordersStagger}
            initial="hidden"
            animate="show"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className={`${thClass} w-12`}>
                      <ColumnLabel icon={Hash} label="" />
                    </th>
                    <th className={`${thClass} w-16`}>
                      <ColumnLabel icon={Layers} label="Platform" />
                    </th>
                    <th className={thClass}>
                      <ColumnLabel icon={Mail} label="Customer email" />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <ColumnLabel icon={CircleDollarSign} label="Amount" />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <ColumnLabel icon={CircleCheck} label="Status" />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <ColumnLabel icon={Calendar} label="Paid at" />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <ColumnLabel icon={Receipt} label="Receipt" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      variants={ordersItem}
                      className={`border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/70 ${
                        index % 2 === 1 ? "bg-zinc-50/40" : "bg-white"
                      }`}
                    >
                      <td
                        className={`${tdClass} w-12 text-xs font-medium tabular-nums text-zinc-400`}
                      >
                        {index + 1}
                      </td>
                      <td className={`${tdClass} w-16`}>
                        <StripeIcon className="!size-8 !rounded-lg shadow-none ring-0" />
                      </td>
                      <td
                        className={`${tdClass} max-w-[300px] truncate font-medium text-zinc-900`}
                      >
                        {payment.customerEmail?.trim() || "—"}
                      </td>
                      <td
                        className={`${tdClass} whitespace-nowrap font-semibold tabular-nums tracking-tight text-zinc-900`}
                      >
                        {formatMoney(payment.amount, payment.currency)}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td
                        className={`${tdClass} whitespace-nowrap text-zinc-500`}
                      >
                        {formatPaidAt(payment.paidAt ?? payment.createdAt)}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 underline-offset-2 hover:underline"
                          >
                            View receipt
                            <ExternalLink
                              className="size-3.5 text-zinc-400"
                              aria-hidden
                            />
                          </a>
                        ) : (
                          <span className="text-sm text-zinc-300">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
