"use client";

import { ActivityMonthCalendarPicker } from "@/app/components/business/ActivityMonthCalendarPicker";
import { PerformanceDateCalendar } from "@/app/components/business/PerformanceDateCalendar";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { AdSourceBadge } from "@/app/components/shared/AdSourceBadge";
import { TableNoResultsEmptyState } from "@/app/components/shared/TableNoResultsEmptyState";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelGuests } from "@/app/hooks/use-funnel-guests";
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
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import {
  FUNNEL_GUESTS_PAGE_SIZE,
  type FunnelGuestRecord,
} from "@/app/services/funnel-event/get-funnel-guests";
import {
  Activity,
  Calendar,
  Check,
  Copy,
  Mail,
  Megaphone,
  MoreHorizontal,
  Phone,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const guestsCardClass =
  "rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-700 first:pl-5 last:pr-5";
const thActionsClass =
  "whitespace-nowrap px-4 py-3 pr-6 text-right align-middle text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-800";
const tdActionsClass =
  "px-4 py-3 pl-3 pr-6 text-right align-middle text-sm text-slate-700";

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

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

function GuestsTableSkeleton() {
  return (
    <>
      <div className="border-b border-[#e8edf5] px-5 py-3">
        <div className="flex gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} funnel className="h-3 w-12" />
          ))}
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#f1f5f9] px-5 py-3.5 last:border-0"
        >
          <Skeleton funnel className="h-3 w-4" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Skeleton funnel className="size-8 shrink-0 rounded-full" />
            <Skeleton funnel className="h-4 w-36" />
          </div>
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="h-4 w-20" />
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="size-8 rounded-lg" />
        </div>
      ))}
    </>
  );
}

function GuestsPanelHeader({
  total,
  search,
  setSearch,
  calendarMode,
  setCalendarMode,
  monthFilter,
  setMonthFilter,
  dateFilter,
  setDateFilter,
  calendarMonthCount,
}: {
  total: number;
  search: string;
  setSearch: (value: string) => void;
  calendarMode: "month" | "day";
  setCalendarMode: (mode: "month" | "day") => void;
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  calendarMonthCount: number;
}) {
  return (
    <div className="relative shrink-0 border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1877f2] ring-1 ring-[#e8edf5]"
            aria-hidden
          >
            <Users className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
              Guests
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Funnel signups & members
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
              placeholder="Search name, email, phone…"
              aria-label="Search guests by name, email, or phone"
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
          <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-3 text-xs font-semibold text-slate-600">
            <Activity className="size-3.5 text-slate-400" aria-hidden />
            {total} {total === 1 ? "guest" : "guests"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CopyValueButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#e8f2ff] hover:text-[#1877f2]"
      aria-label={copied ? "Copied" : "Copy email"}
      title={copied ? "Copied" : "Copy email"}
    >
      {copied ? (
        <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="size-3.5" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}

function GuestJoinedAt({ iso }: { iso: string }) {
  const text = formatDateTimeShort(iso);
  if (!text || text === "N/A") {
    return <span className="text-slate-300">N/A</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
      <Calendar className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      {text}
    </span>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function GuestRowActions({ guest }: { guest: FunnelGuestRecord }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const email = guest.email?.trim() || "";
  const phone = guest.phone?.trim() || "";
  const wa = phone ? whatsappHref(phone) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  const toggle = () => {
    if (!open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.min(rect.right - 180, window.innerWidth - 196),
      });
    }
    setOpen((v) => !v);
  };

  const runCall = () => {
    if (!phone) {
      toast.error("This guest has no phone number on file.");
      return;
    }
    window.location.href = `tel:${phone}`;
    close();
  };

  const runWhatsApp = () => {
    if (!wa) {
      toast.error("This guest has no valid phone number for WhatsApp.");
      return;
    }
    window.open(wa, "_blank", "noopener,noreferrer");
    close();
  };

  const menu =
    open && mounted ? (
      <div
        role="menu"
        className="fixed z-[80] w-[11.5rem] overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        {email ? (
          <a
            href={`mailto:${email}`}
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
            onClick={close}
          >
            <Mail className="size-3.5 text-[#1877f2]" aria-hidden />
            Email guest
          </a>
        ) : null}
        {email ? (
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
            onClick={() => {
              void navigator.clipboard.writeText(email);
              close();
            }}
          >
            <Copy className="size-3.5 text-slate-400" aria-hidden />
            Copy email
          </button>
        ) : null}
        {phone ? (
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
            onClick={runCall}
          >
            <Phone className="size-3.5 text-slate-400" aria-hidden />
            Call guest
          </button>
        ) : null}
        {wa ? (
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
            onClick={runWhatsApp}
          >
            <WhatsAppIcon className="size-3.5 text-[#16a34a]" />
            WhatsApp
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#f4f7fb] hover:text-[#07111f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Guest actions"
      >
        <MoreHorizontal className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </div>
  );
}

function GuestsPagination({
  meta,
  page,
  loading,
  setPage,
}: {
  meta: NonNullable<ReturnType<typeof useFunnelGuests>["meta"]>;
  page: number;
  loading: boolean;
  setPage: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  const rowOffset = (page - 1) * meta.limit;

  return (
    <div className="shrink-0 border-t border-[#e8edf5] px-2.5 py-3 sm:px-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-xs text-slate-500">
          Showing {meta.total === 0 ? 0 : rowOffset + 1} to{" "}
          {Math.min(rowOffset + meta.limit, meta.total)} of {meta.total} guests
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage(page - 1)}
            className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
            Page {page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestMobileCard({
  guest,
  rowNumber,
  index,
}: {
  guest: FunnelGuestRecord;
  rowNumber: number;
  index: number;
}) {
  const initials = guestInitials(guest.name);

  return (
    <article className="rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${avatarTone(index)}`}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-normal text-[#07111f]">
              {guest.name}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(guest.createdAt)}
            </p>
          </div>
        </div>
        <GuestRowActions guest={guest} />
      </div>
      <div className="mt-3 space-y-1 text-[0.8rem] text-slate-600">
        {guest.email ? (
          <p className="m-0 truncate font-normal text-slate-600">{guest.email}</p>
        ) : null}
        {guest.phone ? <p className="m-0">{guest.phone}</p> : null}
        <div className="pt-1">
          <AdSourceBadge
            source={guest.adSource}
            label={guest.adSourceLabel}
            detail={guest.adSourceDetail}
          />
        </div>
      </div>
    </article>
  );
}

function GuestsTableSection({
  guests,
  rowOffset,
}: {
  guests: FunnelGuestRecord[];
  rowOffset: number;
}) {
  return (
    <div>
      <div className="table-h-scroll hidden md:block">
        <table className="w-full min-w-[44rem] border-collapse">
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
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={UserRound}
                  label="Name"
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
                  label="Source"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={Calendar}
                  label="Joined"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thActionsClass}>Actions</th>
            </motion.tr>
          </thead>
          <motion.tbody
            variants={tableBodyStagger}
            initial="hidden"
            animate="show"
          >
            {guests.map((guest, index) => {
              const initials = guestInitials(guest.name);

              return (
                <motion.tr
                  key={guest.id}
                  variants={tableRowReveal}
                  className="group border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
                >
                  <td className={tdClass}>
                    <span className="text-xs font-semibold tabular-nums text-slate-400">
                      {rowOffset + index + 1}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${avatarTone(index)}`}
                      >
                        {initials}
                      </span>
                      <span className="block min-w-0 truncate font-normal text-[#07111f]">
                        {guest.name}
                      </span>
                    </div>
                  </td>
                  <td className={tdClass}>
                    {guest.email ? (
                      <div className="flex min-w-0 items-center gap-0.5">
                        <a
                          href={`mailto:${guest.email}`}
                          className="block min-w-0 truncate text-sm font-normal text-slate-700 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                          title={guest.email}
                        >
                          {guest.email}
                        </a>
                        <CopyValueButton value={guest.email} />
                      </div>
                    ) : (
                      <span className="text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {guest.phone ? (
                      <a
                        href={`tel:${guest.phone}`}
                        className="text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                      >
                        {guest.phone}
                      </a>
                    ) : (
                      <span className="text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <AdSourceBadge
                      source={guest.adSource}
                      label={guest.adSourceLabel}
                      detail={guest.adSourceDetail}
                    />
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <GuestJoinedAt iso={guest.createdAt} />
                  </td>
                  <td className={tdActionsClass}>
                    <GuestRowActions guest={guest} />
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
        {guests.map((guest, index) => (
          <GuestMobileCard
            key={guest.id}
            guest={guest}
            rowNumber={rowOffset + index + 1}
            index={index}
          />
        ))}
      </div>
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
  const [calendarMode, setCalendarMode] = useState<"month" | "day">("month");
  const [monthFilter, setMonthFilter] = useState(currentActivityMonthKey);
  const [dateFilter, setDateFilter] = useState(currentActivityDateKey);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const calendarMonthCount = useMemo(() => activityCalendarYearMonthCount(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const periodRange = useMemo(() => {
    const dateRange =
      calendarMode === "day"
        ? resolveActivityDateRange(dateFilter, calendarMonthCount)
        : (getActivityMonthRangeForKey(monthFilter, calendarMonthCount) ??
          resolveActivityDateRange(currentActivityDateKey(), calendarMonthCount));
    return {
      ...dateRange,
      q: debouncedSearch || undefined,
    };
  }, [
    calendarMode,
    calendarMonthCount,
    dateFilter,
    debouncedSearch,
    monthFilter,
  ]);

  const { data: guests, meta, page, setPage, loading, error } =
    useFunnelGuests(funnelId, FUNNEL_GUESTS_PAGE_SIZE, periodRange);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pageSize = meta?.limit ?? FUNNEL_GUESTS_PAGE_SIZE;
  const rowOffset = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize],
  );

  const showSkeleton =
    isFunnelIdLoading || (loading && guests.length === 0);
  const showNoFunnelMessage =
    !isFunnelIdLoading && !loading && funnelId == null;
  const showNoRecords =
    !showSkeleton && !error && funnelId != null && (meta?.total ?? 0) === 0;

  useEffect(() => {
    if (showSkeleton || !error || alertDismissed) return;
    setAlertMessage(error);
  }, [error, showSkeleton, alertDismissed]);

  useEffect(() => {
    setAlertDismissed(false);
    setAlertMessage(null);
  }, [funnelId]);

  const total = meta?.total ?? 0;
  const showTable = !showSkeleton && !error && guests.length > 0;
  const showCenteredEmpty = showNoFunnelMessage || showNoRecords;

  const clearGuestsFilters = () => {
    setSearch("");
    setCalendarMode("month");
    setMonthFilter(currentActivityMonthKey());
    setDateFilter(currentActivityDateKey());
  };

  const panelContent = (
    <article className={`${guestsCardClass} rd-premium-panel h-full min-h-0`}>
      <GuestsPanelHeader
        total={total}
        search={search}
        setSearch={setSearch}
        calendarMode={calendarMode}
        setCalendarMode={setCalendarMode}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        calendarMonthCount={calendarMonthCount}
      />
      <div
        className={`rd-premium-panel__body${
          showCenteredEmpty
            ? " rd-premium-panel__body--center min-h-[min(24rem,60vh)]"
            : ""
        }`}
      >
        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: standardEase }}
          >
            <GuestsTableSkeleton />
          </motion.div>
        ) : null}

        {showNoFunnelMessage ? (
          <TableNoResultsEmptyState
            icon={Users}
            title="No funnel saved yet"
            description="Open the Funnel tab and save once to load guests."
          />
        ) : null}

        {showNoRecords ? (
          <TableNoResultsEmptyState
            icon={debouncedSearch ? Search : Users}
            title={
              debouncedSearch
                ? `No guests match “${debouncedSearch}”`
                : "No guests for this period"
            }
            description={
              debouncedSearch
                ? "Try another search, or clear filters to reset the date and search."
                : "No guests joined in this month or day. Try another date, or clear filters to reset."
            }
            action={
              <button
                type="button"
                onClick={clearGuestsFilters}
                className="cursor-pointer rounded-full border border-[#1877f2] bg-transparent px-5 py-2.5 text-[0.82rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
              >
                Clear filters
              </button>
            }
          />
        ) : null}

        {showTable ? (
          <motion.div
            key={`guests-page-${page}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: standardEase }}
          >
            <GuestsTableSection guests={guests} rowOffset={rowOffset} />
          </motion.div>
        ) : null}
      </div>

      {showTable && meta ? (
        <GuestsPagination
          meta={meta}
          page={page}
          loading={loading}
          setPage={setPage}
        />
      ) : null}
    </article>
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
          <div className="funnel-guests-body flex flex-col">{panelContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="funnel-guests-root min-h-0 flex-1 overflow-y-auto bg-[#eef2f7]">
      {alert}
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {panelContent}
      </div>
    </div>
  );
}
