"use client";

import { Calendar, Mail, Phone, UserRound, Users } from "lucide-react";
import { motion } from "framer-motion";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useCustomers } from "@/app/hooks/use-customers";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import { CUSTOMERS_PAGE_SIZE } from "@/app/services/customer/get-customers";
import { useEffect, useMemo, useState } from "react";

const guestsCardClass =
  "overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-700 first:pl-5 last:pr-5";

const guestsHeadIconClass = "text-[#1877f2]";
const guestsHeadLabelClass = "text-slate-800";

const tableHeaderReveal = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: standardEase },
  },
};

const tableRowReveal = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: standardEase },
  },
};

const tableBodyStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

const AVATAR_COLORS = [
  "from-[#1877f2] to-[#4f9cf9]",
  "from-[#166fe5] to-[#60a5fa]",
  "from-[#0ea5e9] to-[#7dd3fc]",
  "from-[#2563eb] to-[#93c5fd]",
] as const;

function GuestsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white ring-1 ring-black/[0.02]">
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
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Skeleton funnel className="size-8 shrink-0 rounded-full" />
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

function GuestsEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
      <div className="relative mb-5 flex size-24 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-20 items-center justify-center rounded-[1.35rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
          <Users className="size-9 text-[#1877f2]" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
        No guests yet
      </p>
      <h3 className="m-0 mt-2 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        Your guest list is empty
      </h3>
      <p className="mx-auto m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
        Customers who sign up through your funnel will appear here.
      </p>
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

function GuestsPanelHeader({ total }: { total: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8edf5] pb-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
          Guests
        </span>
        <span className="text-[0.72rem] font-medium text-slate-500">
          Funnel signups & members
        </span>
      </div>
      <span className="rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
        {total} total
      </span>
    </div>
  );
}

export function CampaignGuestsPanel({
  embedded = false,
}: { embedded?: boolean } = {}) {
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
  const totalGuests = meta?.total ?? customers.length;

  const panelContent = (
    <>
      {loading && customers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: standardEase }}
        >
          <GuestsPanelHeader total={0} />
          <GuestsTableSkeleton />
        </motion.div>
      ) : null}

      {showEmpty ? <GuestsEmptyState /> : null}

      {!loading && !error && customers.length > 0 ? (
        <motion.div
          key={`guests-page-${page}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: standardEase }}
        >
          <GuestsPanelHeader total={totalGuests} />

          <div className="overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white ring-1 ring-black/[0.02]">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[40rem] border-collapse">
                <thead>
                  <motion.tr
                    variants={tableHeaderReveal}
                    initial="hidden"
                    animate="show"
                    className="border-b border-[#e8edf5] bg-[#f8fafc]/60"
                  >
                    <th className={`${thClass} w-12`}>
                      <TableColumnHeader
                        label="#"
                        iconClassName={guestsHeadIconClass}
                        labelClassName={guestsHeadLabelClass}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={UserRound}
                        label="Name"
                        iconClassName={guestsHeadIconClass}
                        labelClassName={guestsHeadLabelClass}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={Mail}
                        label="Email"
                        iconClassName={guestsHeadIconClass}
                        labelClassName={guestsHeadLabelClass}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={Phone}
                        label="Phone"
                        iconClassName={guestsHeadIconClass}
                        labelClassName={guestsHeadLabelClass}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={Calendar}
                        label="Joined"
                        iconClassName={guestsHeadIconClass}
                        labelClassName={guestsHeadLabelClass}
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
                        className="group border-b border-[#f1f5f9] bg-white transition-colors duration-150 last:border-0 hover:bg-[#f8fafc]/80"
                      >
                        <td className={tdClass}>
                          <span className="text-xs font-semibold tabular-nums text-slate-400">
                            {rowNumber}
                          </span>
                        </td>
                        <td className={tdClass}>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(15,23,42,0.12)]`}
                            >
                              {initials}
                            </span>
                            <span className="truncate font-semibold text-[#07111f]">
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className={`${tdClass} max-w-[12rem] sm:max-w-xs`}>
                          <a
                            href={`mailto:${customer.email}`}
                            className="block truncate text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                            title={customer.email}
                          >
                            {customer.email}
                          </a>
                        </td>
                        <td className={tdClass}>
                          {customer.phone?.trim() ? (
                            <a
                              href={`tel:${customer.phone.trim()}`}
                              className="text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                            >
                              {customer.phone}
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td
                          className={`${tdClass} whitespace-nowrap text-slate-600`}
                        >
                          {formatDateTimeShort(customer.createdAt)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 ? (
              <div className="border-t border-[#e8edf5] bg-[#f8fafc]/40 px-3 py-2 sm:px-4">
                <OffsetPagination
                  page={page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  limit={meta.limit}
                  loading={loading}
                  onPageChange={setPage}
                  itemLabel="guests"
                />
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </>
  );

  return (
    <div
      className={
        embedded
          ? "min-h-0 w-full"
          : "min-h-0 flex-1 overflow-y-auto bg-[#eef2f7]"
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

      {embedded ? (
        <div className="w-full px-0 py-3.5 sm:py-4">
          {panelContent}
        </div>
      ) : (
        <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <article className={`${guestsCardClass} p-4 sm:p-5`}>
            {panelContent}
          </article>
        </div>
      )}
    </div>
  );
}
