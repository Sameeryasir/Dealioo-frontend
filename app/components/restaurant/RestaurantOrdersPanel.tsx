"use client";

import {
  Calendar,
  CircleDollarSign,
  Hash,
  Layers,
  Megaphone,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { PanelEmptyState } from "@/app/components/shared/PanelEmptyState";
import { ReportTable } from "@/app/components/shared/ReportTable";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useRestaurantFunnelEvents } from "@/app/hooks/use-restaurant-registrations";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { formatCents } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import { RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE } from "@/app/services/funnel-event/get-restaurant-registrations";
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

function OrdersTableSkeleton() {
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
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function displayName(event: {
  customer: { name: string } | null;
  customerEmail: string | null;
}): string {
  const name = event.customer?.name?.trim();
  if (name) return name;
  const email = event.customer?.email?.trim() || event.customerEmail?.trim();
  if (email) return email.split("@")[0] ?? email;
  return "Guest";
}

function paymentStatusLabel(eventType: "signup" | "payment"): string {
  return eventType === "payment" ? "Paid" : "Not paid";
}

function paymentStatusBadgeClass(eventType: "signup" | "payment"): string {
  return eventType === "payment"
    ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200"
    : "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
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

export function RestaurantOrdersPanel({
  restaurantId,
}: {
  restaurantId: number;
}) {
  const { data: events, meta, page, setPage, loading, error } =
    useRestaurantFunnelEvents(restaurantId);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pageSize = meta?.limit ?? RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE;
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

      <div className="border-b border-zinc-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          All funnel activity across {meta?.campaignCount ?? 0} campaign
          {(meta?.campaignCount ?? 0) === 1 ? "" : "s"} and{" "}
          {meta?.funnelCount ?? 0} funnel
          {(meta?.funnelCount ?? 0) === 1 ? "" : "s"} — signups and payments.
        </p>
      </div>

      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loading && events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: standardEase }}
          >
            <OrdersTableSkeleton />
          </motion.div>
        ) : null}

        {showEmpty ? (
          <PanelEmptyState
            icon={ShoppingBag}
            title="No funnel events yet"
            description="When customers sign up or pay through any of your campaign funnels, activity will appear here."
          />
        ) : null}

        {!loading && !error && events.length > 0 ? (
          <motion.div
            key={`orders-page-${page}`}
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
                  <h3 className="text-base font-semibold text-zinc-900">
                    Funnel events
                  </h3>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-600 ring-1 ring-zinc-200">
                    {meta?.total ?? events.length} total
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
                    itemLabel="events"
                  />
                ) : null
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse">
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
                      <th className={`${thClass} whitespace-nowrap`}>
                        <TableColumnHeader
                          icon={Layers}
                          label="Status"
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
                          icon={Megaphone}
                          label="Campaign"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                      <th className={thClass}>
                        <TableColumnHeader
                          icon={CircleDollarSign}
                          label="Amount"
                          iconClassName="text-zinc-400"
                          labelClassName="text-zinc-500"
                        />
                      </th>
                      <th className={thClass}>
                        <TableColumnHeader
                          icon={Calendar}
                          label="Date"
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
                    {events.map((event, index) => {
                      const rowNumber = rowOffset + index + 1;
                      const name = displayName(event);
                      const initials = guestInitials(name);
                      const avatarColor = guestAvatarColor(
                        (event.customer?.id ?? event.id) * 13 + index * 7,
                      );

                      return (
                        <motion.tr
                          key={event.id}
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
                          <td className={`${tdClass} whitespace-nowrap`}>
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusBadgeClass(event.eventType)}`}
                            >
                              {paymentStatusLabel(event.eventType)}
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
                                {name}
                              </span>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span
                              className="block max-w-[14rem] truncate font-medium text-zinc-800"
                              title={event.campaignName}
                            >
                              {event.campaignName}
                            </span>
                          </td>
                          <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                            {event.eventType === "payment" &&
                            event.amount != null &&
                            event.currency ? (
                              formatCents(event.amount, event.currency)
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap text-zinc-600`}>
                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                              <Calendar
                                className="size-3.5 shrink-0 text-zinc-400"
                                aria-hidden
                              />
                              {formatDateTimeShort(event.createdAt)}
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
