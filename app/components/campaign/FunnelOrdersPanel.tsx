"use client";

import {
  Calendar,
  CircleCheck,
  CircleDollarSign,
  Hash,
  Layers,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { StripeIcon } from "@/app/components/StripeLogo";
import { Skeleton } from "@/app/components/skeleton";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { useFunnelPayments } from "@/app/hooks/use-funnel-payments";
import { paymentStatusBadgeClass } from "@/app/lib/badge-variants";
import { formatPaidAtParts } from "@/app/lib/datetime";
import { formatCents } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";

const thClass =
  "whitespace-nowrap px-4 py-3.5 text-left align-middle sm:px-5";
const tdClass = "px-4 py-3.5 text-left align-middle text-sm sm:px-5";

const tableRowReveal = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: standardEase },
  },
};

const tableBodyStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex w-full gap-6">
          <Skeleton funnel className="h-3 w-[10%]" />
          <Skeleton funnel className="h-3 w-[28%]" />
          <Skeleton funnel className="h-3 w-[12%]" />
          <Skeleton funnel className="h-3 w-[12%]" />
          <Skeleton funnel className="h-3 w-[20%]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full gap-6 border-b border-zinc-100 bg-white px-4 py-4 last:border-0 sm:px-5"
        >
          <Skeleton funnel className="size-8 shrink-0 rounded-lg" />
          <Skeleton funnel className="h-4 w-[28%]" />
          <Skeleton funnel className="h-4 w-[12%]" />
          <Skeleton funnel className="h-4 w-[12%]" />
          <Skeleton funnel className="h-4 w-[20%]" />
        </div>
      ))}
    </div>
  );
}

export function FunnelOrdersPanel({
  funnelId,
  isFunnelIdLoading = false,
  embedded = false,
}: {
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
  embedded?: boolean;
}) {
  const { payments, isLoading: isPaymentsLoading, error } =
    useFunnelPayments(funnelId);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const showSkeleton = isFunnelIdLoading || isPaymentsLoading;
  const showNoFunnelMessage =
    !isFunnelIdLoading && !isPaymentsLoading && funnelId == null;
  const showNoRecords =
    !showSkeleton && !error && funnelId != null && payments.length === 0;

  useEffect(() => {
    if (showSkeleton || !error || alertDismissed) return;
    setAlertMessage(error);
  }, [error, showSkeleton, alertDismissed]);

  useEffect(() => {
    setAlertDismissed(false);
    setAlertMessage(null);
  }, [funnelId]);

  return (
    <div
      className={
        embedded
          ? "min-h-0 w-full"
          : "min-h-0 flex-1 overflow-y-auto bg-zinc-50"
      }
    >
      <OverviewAlertDialog
        open={alertMessage != null}
        message={alertMessage ?? ""}
        onClose={() => {
          setAlertMessage(null);
          setAlertDismissed(true);
        }}
      />

      <div
        className={
          embedded
            ? "w-full px-0 py-4 sm:py-5"
            : "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        }
      >
        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: standardEase }}
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

        {showNoRecords ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
            <p className="px-4 py-14 text-center text-sm font-semibold text-zinc-900 sm:px-5">
              No records found
            </p>
          </div>
        ) : null}

        {!showSkeleton && !error && payments.length > 0 ? (
          <motion.div
            key="orders-table"
            className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.04]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: standardEase }}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <motion.tr
                    className="border-b border-zinc-200/90 bg-gradient-to-b from-zinc-50/95 to-white"
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: standardEase }}
                  >
                    <th className={`${thClass} w-12`}>
                      <TableColumnHeader variant="boxed" icon={Hash} label="" />
                    </th>
                    <th className={`${thClass} w-16`}>
                      <TableColumnHeader
                        variant="boxed"
                        icon={Layers}
                        label="Platform"
                        iconClassName="text-[#635bff]"
                        iconBoxClassName="border-[#635bff]/25 bg-[#635bff]/10"
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        variant="boxed"
                        icon={Mail}
                        label="Customer email"
                        iconClassName="text-blue-600"
                        iconBoxClassName="border-blue-200/80 bg-blue-50"
                      />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <TableColumnHeader
                        variant="boxed"
                        icon={CircleDollarSign}
                        label="Amount"
                        iconClassName="text-emerald-600"
                        iconBoxClassName="border-emerald-200/80 bg-emerald-50"
                      />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <TableColumnHeader
                        variant="boxed"
                        icon={CircleCheck}
                        label="Status"
                        iconClassName="text-teal-600"
                        iconBoxClassName="border-teal-200/80 bg-teal-50"
                      />
                    </th>
                    <th className={`${thClass} whitespace-nowrap`}>
                      <TableColumnHeader
                        variant="boxed"
                        icon={Calendar}
                        label="Paid at"
                        iconClassName="text-orange-600"
                        iconBoxClassName="border-orange-200/80 bg-orange-50"
                      />
                    </th>
                  </motion.tr>
                </thead>
                <motion.tbody
                  variants={tableBodyStagger}
                  initial="hidden"
                  animate="show"
                >
                  {payments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      variants={tableRowReveal}
                      className="group border-b border-zinc-100/90 bg-white transition-[background-color,box-shadow] duration-200 last:border-0 hover:bg-zinc-50/90 hover:shadow-[inset_3px_0_0_0_rgb(24_24_27)]"
                    >
                      <td className={`${tdClass} w-12`}>
                        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-100/90 text-xs font-semibold tabular-nums text-zinc-600 ring-1 ring-zinc-200/80">
                          {index + 1}
                        </span>
                      </td>
                      <td className={`${tdClass} w-16`}>
                        <span className="inline-flex rounded-xl border border-zinc-200/80 bg-white p-1 shadow-sm ring-1 ring-zinc-950/[0.03] transition-transform duration-200 group-hover:scale-[1.03]">
                          <StripeIcon className="!size-8 !rounded-lg shadow-none ring-0" />
                        </span>
                      </td>
                      <td
                        className={`${tdClass} max-w-[280px] truncate font-medium text-zinc-800`}
                        title={payment.customerEmail?.trim() || undefined}
                      >
                        {payment.customerEmail?.trim() || "N/A"}
                      </td>
                      <td
                        className={`${tdClass} whitespace-nowrap text-base font-bold tabular-nums tracking-tight text-zinc-900`}
                      >
                        {formatCents(payment.amount, payment.currency)}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold capitalize shadow-sm ring-1 ring-black/5 ${paymentStatusBadgeClass(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {(() => {
                          const paid = formatPaidAtParts(
                            payment.paidAt ?? payment.createdAt,
                          );
                          if (!paid) {
                            return <span className="text-zinc-300">N/A</span>;
                          }
                          return (
                            <span className="inline-flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-zinc-800">
                                {paid.date}
                              </span>
                              <span className="text-xs tabular-nums text-zinc-500">
                                {paid.time}
                              </span>
                            </span>
                          );
                        })()}
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
