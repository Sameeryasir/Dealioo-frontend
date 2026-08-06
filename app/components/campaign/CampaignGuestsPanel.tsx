"use client";

import {
  Calendar,
  Check,
  Copy,
  Mail,
  MoreVertical,
  Phone,
  Tag,
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
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelGuests } from "@/app/hooks/use-funnel-guests";
import {
  formatDateTimeShort,
  formatRelativeTimeAgo,
} from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import {
  FUNNEL_GUESTS_PAGE_SIZE,
  type FunnelGuestRecord,
  type FunnelGuestTag,
} from "@/app/services/funnel-event/get-funnel-guests";

const guestsCardClass =
  "overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

const thClass = "funnel-guests-th whitespace-nowrap text-left align-middle";
const tdClass = "funnel-guests-td text-left align-middle text-slate-700";

const guestsHeadIconClass = "text-[#1877f2]";
const guestsHeadLabelClass = "text-slate-600";

const GUEST_AVATAR_TONES = [
  "bg-[#1877f2] text-white",
  "bg-[#7c3aed] text-white",
  "bg-[#0d9488] text-white",
  "bg-[#db2777] text-white",
  "bg-[#d97706] text-white",
] as const;

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

function guestAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return GUEST_AVATAR_TONES[hash % GUEST_AVATAR_TONES.length];
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

function GuestsTableSkeleton() {
  return (
    <div className="funnel-guests-table-skeleton overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white ring-1 ring-black/[0.02]">
      <div className="border-b border-[#e8edf5] px-5 py-3">
        <div className="flex gap-8">
          {Array.from({ length: 7 }).map((_, i) => (
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
            <Skeleton funnel className="size-9 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton funnel className="h-4 w-28" />
              <Skeleton funnel className="h-3 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="h-4 w-20" />
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="h-5 w-24 rounded-full" />
          <Skeleton funnel className="size-8 rounded-full" />
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

function GuestStatusBadge({ status }: { status: FunnelGuestRecord["status"] }) {
  if (status === "returning") {
    return (
      <span className="funnel-guests-status funnel-guests-status--returning">
        Returning
      </span>
    );
  }
  return (
    <span className="funnel-guests-status funnel-guests-status--new">New</span>
  );
}

function GuestTagPill({ tag }: { tag: FunnelGuestTag }) {
  const label =
    tag === "signup" ? "Signup" : tag === "prepaid" ? "Prepaid" : "Postpaid";
  return (
    <span className={`funnel-guests-tag funnel-guests-tag--${tag}`}>{label}</span>
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
  const menuRef = useRef<HTMLDivElement | null>(null);

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
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
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

  const runEmail = () => {
    if (!email) {
      toast.error("This guest has no email on file.");
      return;
    }
    window.location.href = `mailto:${email}`;
    close();
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
        ref={menuRef}
        role="menu"
        className="fixed z-[80] w-[11.5rem] overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!email}
          onClick={runEmail}
        >
          <Mail className="size-3.5 text-[#7c3aed]" aria-hidden />
          Email guest
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!phone}
          onClick={runCall}
        >
          <Phone className="size-3.5 text-[#ea580c]" aria-hidden />
          Call guest
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!wa}
          onClick={runWhatsApp}
        >
          <WhatsAppIcon className="size-3.5 text-[#16a34a]" />
          WhatsApp
        </button>
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
        className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-slate-500 shadow-sm transition hover:bg-[#f8fafc] hover:text-[#07111f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Guest actions"
      >
        <MoreVertical className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
      {mounted ? createPortal(menu, document.body) : null}
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
                  iconClassName="text-[#7c3aed]"
                  labelClassName={guestsHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-guests-th--phone`}>
                <TableColumnHeader
                  icon={Phone}
                  label="Phone"
                  iconClassName="text-[#ea580c]"
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
              <th className={`${thClass} funnel-guests-th--tags`}>
                <TableColumnHeader
                  icon={Tag}
                  label="Tags"
                  iconClassName="text-[#db2777]"
                  labelClassName={guestsHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-guests-th--actions`}>
                <TableColumnHeader
                  label="Actions"
                  iconClassName="text-slate-400"
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
              const wa = guest.phone ? whatsappHref(guest.phone) : null;

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
                      <span
                        className={`funnel-guests-avatar flex size-9 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-bold shadow-[0_4px_10px_rgba(15,23,42,0.12)] ${guestAvatarTone(guest.name || guest.email || String(guest.id))}`}
                      >
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 truncate font-semibold text-[#07111f]">
                          {guest.name}
                        </p>
                        <div className="mt-1">
                          <GuestStatusBadge status={guest.status} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} funnel-guests-td--email`}>
                    {guest.email ? (
                      <div className="flex min-w-0 items-center gap-0.5">
                        <a
                          href={`mailto:${guest.email}`}
                          className="block min-w-0 truncate text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                          title={guest.email}
                        >
                          {guest.email}
                        </a>
                        <CopyValueButton value={guest.email} />
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`${tdClass} funnel-guests-td--phone`}>
                    {guest.phone ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${guest.phone}`}
                          className="whitespace-nowrap text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                        >
                          {guest.phone}
                        </a>
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-lg text-[#16a34a] transition hover:bg-emerald-50"
                            aria-label="Open WhatsApp"
                            title="WhatsApp"
                          >
                            <WhatsAppIcon className="size-3.5" />
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`${tdClass} funnel-guests-td--joined`}>
                    <div className="flex flex-col gap-1">
                      <span className="whitespace-nowrap text-slate-600">
                        {formatDateTimeShort(guest.createdAt)}
                      </span>
                      <span className="funnel-guests-ago">
                        {formatRelativeTimeAgo(guest.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className={`${tdClass} funnel-guests-td--tags`}>
                    <div className="flex flex-wrap gap-1.5">
                      {guest.tags.length > 0 ? (
                        guest.tags.map((tag) => (
                          <GuestTagPill key={tag} tag={tag} />
                        ))
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                  <td className={`${tdClass} funnel-guests-td--actions`}>
                    <GuestRowActions guest={guest} />
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      {meta && meta.total > 0 ? (
        <OffsetPagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit || FUNNEL_GUESTS_PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          itemLabel="guests"
        />
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
