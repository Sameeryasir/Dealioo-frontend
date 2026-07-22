"use client";

import { Calendar, Mail, Phone, UserRound, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelGuests } from "@/app/hooks/use-funnel-guests";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import {
  FUNNEL_GUESTS_PAGE_SIZE,
  type FunnelGuestRecord,
} from "@/app/services/funnel-event/get-funnel-guests";

const guestsCardClass =
  "overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass = "funnel-guests-th whitespace-nowrap text-left align-middle";
const tdClass = "funnel-guests-td text-left align-middle text-slate-700";

const guestsHeadIconClass = "text-white/90";
const guestsHeadLabelClass = "text-white";

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

function GuestsTableSkeleton() {
  return (
    <div className="funnel-guests-table-skeleton overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white ring-1 ring-black/[0.02]">
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

function GuestsPanelHeader({ total }: { total: number }) {
  return (
    <div className="funnel-guests-header">
      <div className="funnel-guests-header__copy">
        <span className="inline-flex items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
          Guests
        </span>
        <span className="text-[0.72rem] font-medium text-slate-500">
          Funnel signups & members
        </span>
      </div>
      <span className="funnel-guests-header__total rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
        {total} total
      </span>
    </div>
  );
}

function GuestsTableSection({
  guests,
  rowOffset,
  page,
  meta,
  loading,
  setPage,
}: {
  guests: FunnelGuestRecord[];
  rowOffset: number;
  page: number;
  meta: NonNullable<ReturnType<typeof useFunnelGuests>["meta"]> | null;
  loading: boolean;
  setPage: (page: number) => void;
}) {
  return (
    <div className="funnel-guests-surface">
      <p className="funnel-guests-scroll-hint">
        Swipe sideways to see all columns
      </p>

      <div className="funnel-guests-table-wrap">
        <div className="funnel-guests-sidebar-head" aria-hidden>
          <div className="funnel-guests-sidebar-head__glow" />
        </div>
        <table className="funnel-guests-table">
          <thead>
            <motion.tr
              variants={tableHeaderReveal}
              initial="hidden"
              animate="show"
              className="funnel-guests-head-row"
            >
              <th className={`${thClass} funnel-guests-th--index`}>
                <TableColumnHeader
                  label="#"
                  iconClassName={guestsHeadIconClass}
                  labelClassName={guestsHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-guests-th--name`}>
                <TableColumnHeader
                  icon={UserRound}
                  label="Name"
                  iconClassName={guestsHeadIconClass}
                  labelClassName={guestsHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-guests-th--email`}>
                <TableColumnHeader
                  icon={Mail}
                  label="Email"
                  iconClassName={guestsHeadIconClass}
                  labelClassName={guestsHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-guests-th--phone`}>
                <TableColumnHeader
                  icon={Phone}
                  label="Phone"
                  iconClassName={guestsHeadIconClass}
                  labelClassName={guestsHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-guests-th--joined`}>
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
            {guests.map((guest, index) => {
              const rowNumber = rowOffset + index + 1;
              const initials = guestInitials(guest.name);

              return (
                <motion.tr
                  key={guest.id}
                  variants={tableRowReveal}
                  className="group border-b border-[#f1f5f9] bg-white transition-colors duration-150 last:border-0 hover:bg-[#f8fafc]/80"
                >
                  <td className={`${tdClass} funnel-guests-td--index`}>
                    <span className="text-xs font-semibold tabular-nums text-slate-400">
                      {rowNumber}
                    </span>
                  </td>
                  <td className={`${tdClass} funnel-guests-td--name`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="funnel-guests-avatar flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(24,119,242,0.28)]">
                        {initials}
                      </span>
                      <span className="truncate font-semibold text-[#07111f]">
                        {guest.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`${tdClass} funnel-guests-td--email`}
                    title={guest.email}
                  >
                    <a
                      href={`mailto:${guest.email}`}
                      className="block truncate text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                    >
                      {guest.email}
                    </a>
                  </td>
                  <td className={`${tdClass} funnel-guests-td--phone`}>
                    {guest.phone?.trim() ? (
                      <a
                        href={`tel:${guest.phone.trim()}`}
                        className="whitespace-nowrap text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                      >
                        {guest.phone}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td
                    className={`${tdClass} funnel-guests-td--joined whitespace-nowrap text-slate-600`}
                  >
                    {formatDateTimeShort(guest.createdAt)}
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="funnel-guests-pagination">
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
  );
}

export function CampaignGuestsPanel({
  funnelId,
  isFunnelIdLoading = false,
  embedded = false,
}: {
  funnelId?: number | null;
  isFunnelIdLoading?: boolean;
  embedded?: boolean;
} = {}) {
  const { data: guests, meta, page, setPage, loading, error } =
    useFunnelGuests(funnelId);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pageSize = meta?.limit ?? FUNNEL_GUESTS_PAGE_SIZE;
  const rowOffset = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize],
  );

  const showSkeleton = isFunnelIdLoading || loading;
  const showNoFunnelMessage =
    !isFunnelIdLoading && !loading && funnelId == null;
  const showEmpty =
    !showSkeleton && !error && funnelId != null && (meta?.total ?? 0) === 0;
  const totalGuests = meta?.total ?? guests.length;

  useEffect(() => {
    if (showSkeleton || !error || alertDismissed) return;
    setAlertMessage(error);
  }, [error, showSkeleton, alertDismissed]);

  useEffect(() => {
    setAlertDismissed(false);
    setAlertMessage(null);
  }, [funnelId]);

  const panelContent = (
    <>
      {showSkeleton && guests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: standardEase }}
        >
          <GuestsPanelHeader total={0} />
          <GuestsTableSkeleton />
        </motion.div>
      ) : null}

      {showNoFunnelMessage ? (
        <div className="rounded-[1.1rem] border border-dashed border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white px-6 py-12 text-center">
          <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
            No funnel saved yet
          </p>
          <p className="m-0 mt-2 text-[0.82rem] font-medium text-slate-500">
            Open the Funnel tab and save once. Guests appear after people sign up
            through your funnel.
          </p>
        </div>
      ) : null}

      {showEmpty ? <GuestsEmptyState /> : null}

      {!showSkeleton && !error && guests.length > 0 ? (
        <motion.div
          key={`guests-page-${page}`}
          className="funnel-guests-content"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: standardEase }}
        >
          <GuestsPanelHeader total={totalGuests} />
          <GuestsTableSection
            guests={guests}
            rowOffset={rowOffset}
            page={page}
            meta={meta}
            loading={loading}
            setPage={setPage}
          />
        </motion.div>
      ) : null}
    </>
  );

  const alert = (
    <OverviewAlertDialog
      open={alertMessage != null}
      message={alertMessage ?? ""}
      onClose={() => {
        setAlertMessage(null);
        setAlertDismissed(true);
      }}
    />
  );

  if (embedded) {
    return (
      <div className="campaign-immersive-guests funnel-guests-root">
        {alert}
        <div className="funnel-guests-panel">
          <div className="funnel-guests-body">{panelContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="funnel-guests-root min-h-0 flex-1 overflow-y-auto bg-[#eef2f7]">
      {alert}
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <article className={`${guestsCardClass} p-4 sm:p-5`}>
          {panelContent}
        </article>
      </div>
    </div>
  );
}
