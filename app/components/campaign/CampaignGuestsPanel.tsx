"use client";

import { Calendar, Hash, Mail, Phone, UserRound, Users } from "lucide-react";
import { motion } from "framer-motion";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
import { ReportTable } from "@/app/components/shared/ReportTable";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useCustomers } from "@/app/hooks/use-customers";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import { CUSTOMERS_PAGE_SIZE } from "@/app/services/customer/get-customers";
import { useEffect, useMemo, useState } from "react";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-zinc-500 first:pl-6 last:pr-6";
const tdClass =
  "px-4 py-3.5 text-left align-middle text-sm text-zinc-700 first:pl-6 last:pr-6";

const tableHeaderReveal = {
  hidden: { opacity: 0, y: -14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: standardEase },
  },
};

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
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
  "from-red-500 to-rose-600",
  "from-indigo-500 to-violet-600",
] as const;

function GuestsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-6 py-4">
        <Skeleton funnel className="h-4 w-16" />
        <Skeleton funnel className="h-6 w-14 rounded-md" />
      </div>
      <div className="border-b border-zinc-200 bg-zinc-50/80 px-6 py-3">
        <div className="flex gap-8">
          <Skeleton funnel className="h-3 w-6" />
          <Skeleton funnel className="h-3 w-12" />
          <Skeleton funnel className="h-3 w-14" />
          <Skeleton funnel className="h-3 w-12" />
          <Skeleton funnel className="h-3 w-14" />
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 border-b border-zinc-100 px-6 py-3.5 last:border-0 ${
            i % 2 === 1 ? "bg-zinc-50/40" : ""
          }`}
        >
          <Skeleton funnel className="h-3 w-4" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Skeleton funnel className="size-9 shrink-0 rounded-full" />
            <Skeleton funnel className="h-4 w-28" />
          </div>
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="h-4 w-20" />
          <Skeleton funnel className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function guestAvatarColor(seed: number): string {
  return AVATAR_COLORS[Math.abs(seed) % AVATAR_COLORS.length];
}

export function CampaignGuestsPanel() {
  const { data: customers, meta, page, setPage, loading, error } =
    useCustomers(true);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pageSize = meta?.limit ?? CUSTOMERS_PAGE_SIZE;
  const rowOffset = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize],
  );

  useEffect(() => {
    if (loading || !error || alertDismissed) return;
    setAlertMessage(error);
  }, [error, loading, alertDismissed]);

  const showEmpty = !loading && !error && (meta?.total ?? 0) === 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
      <OverviewAlertDialog
        open={alertMessage != null}
        message={alertMessage ?? ""}
        onClose={() => {
          setAlertMessage(null);
          setAlertDismissed(true);
        }}
      />

      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loading && customers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: standardEase }}
          >
            <GuestsTableSkeleton />
          </motion.div>
        ) : null}

        {showEmpty ? (
          <PanelEmptyState
            icon={Users}
            title="No guests yet"
            description="Customers who sign up through your funnel will appear here."
          />
        ) : null}

        {!loading && !error && customers.length > 0 ? (
          <motion.div
            key={`guests-page-${page}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: standardEase }}
          >
            <ReportTable
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
              header={
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: standardEase }}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/60 px-6 py-4"
                >
                  <h3 className="text-base font-semibold text-zinc-900">Guests</h3>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-600 ring-1 ring-zinc-200">
                    {meta?.total ?? customers.length} total
                  </span>
                </motion.div>
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
                    itemLabel="guests"
                  />
                ) : null
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse">
                  <thead>
                    <motion.tr
                      variants={tableHeaderReveal}
                      initial="hidden"
                      animate="show"
                      className="border-b border-zinc-200 bg-zinc-50/80"
                    >
                      <th className={`${thClass} w-12`}>
                        <TableColumnHeader
                          icon={Hash}
                          label="#"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                      <th className={thClass}>
                        <TableColumnHeader
                          icon={UserRound}
                          label="Name"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                      <th className={thClass}>
                        <TableColumnHeader
                          icon={Mail}
                          label="Email"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                      <th className={thClass}>
                        <TableColumnHeader
                          icon={Phone}
                          label="Phone"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                      <th className={thClass}>
                        <TableColumnHeader
                          icon={Calendar}
                          label="Joined"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                    </motion.tr>
                  </thead>
                  <motion.tbody
                    variants={tableBodyStagger}
                    initial="hidden"
                    animate="show"
                  >
                    {customers.map((customer, index) => {
                      const rowNumber = rowOffset + index + 1;
                      const initials = guestInitials(customer.name);
                      const avatarColor = guestAvatarColor(
                        customer.id * 13 + index * 7,
                      );

                      return (
                        <motion.tr
                          key={customer.id}
                          variants={tableRowReveal}
                          className={`group border-b border-zinc-100 transition-colors duration-150 last:border-0 hover:bg-zinc-50/80 ${
                            index % 2 === 1 ? "bg-zinc-50/40" : "bg-white"
                          }`}
                        >
                          <td className={tdClass}>
                            <span className="text-xs font-medium tabular-nums text-zinc-400">
                              {rowNumber}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[11px] font-semibold text-white`}
                              >
                                {initials}
                              </span>
                              <span className="truncate font-medium text-zinc-900">
                                {customer.name}
                              </span>
                            </div>
                          </td>
                          <td className={`${tdClass} max-w-[12rem] sm:max-w-xs`}>
                            <a
                              href={`mailto:${customer.email}`}
                              className="block truncate text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
                              title={customer.email}
                            >
                              {customer.email}
                            </a>
                          </td>
                          <td className={tdClass}>
                            {customer.phone?.trim() ? (
                              <a
                                href={`tel:${customer.phone.trim()}`}
                                className="text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
                              >
                                {customer.phone}
                              </a>
                            ) : (
                              <span className="text-zinc-300">N/A</span>
                            )}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap text-zinc-600`}>
                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                              <Calendar
                                className="size-3.5 shrink-0 text-zinc-400"
                                aria-hidden
                              />
                              {formatDateTimeShort(customer.createdAt)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
            </ReportTable>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
