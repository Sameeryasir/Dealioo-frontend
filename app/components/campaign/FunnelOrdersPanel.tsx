"use client";

import {
  Activity,
  Calendar,
  Check,
  CircleDollarSign,
  Copy,
  Layers,
  Mail,
  MoreHorizontal,
  ShoppingBag,
  UserRound,
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
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelPayments } from "@/app/hooks/use-funnel-payments";
import { paymentStatusBadgeClass } from "@/app/lib/badge-variants";
import {
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { formatCents } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import type { FunnelPayment } from "@/app/services/payment/get-funnel-payments";
import { FUNNEL_ORDERS_PAGE_SIZE } from "@/app/services/payment/get-funnel-payments";

const ordersCardClass =
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

function guestInitial(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
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

function formatPaymentStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid" || normalized === "succeeded") return "Paid";
  if (normalized === "failed") return "Failed";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  if (normalized === "refunded") return "Refunded";
  if (normalized === "partially_refunded") return "Partial refund";
  if (normalized === "disputed") return "Disputed";
  if (normalized === "pending") return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function OrdersTableSkeleton() {
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
          <Skeleton funnel className="h-4 w-16" />
          <Skeleton funnel className="h-5 w-20 rounded-full" />
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="size-8 rounded-lg" />
        </div>
      ))}
    </>
  );
}

function OrdersEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
      <div className="relative mb-5 flex size-24 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-20 items-center justify-center rounded-[1.35rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
          <ShoppingBag
            className="size-9 text-[#1877f2]"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
      </div>
      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
        No orders yet
      </p>
      <h3 className="m-0 mt-2 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        Your order list is empty
      </h3>
      <p className="mx-auto m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
        Payments from your funnel will appear here once customers check out.
      </p>
    </div>
  );
}

function OrdersPanelHeader({ total }: { total: number }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
      <div>
        <h2 className="m-0 text-[1.45rem] font-extrabold tracking-tight text-[#07111f]">
          Orders
        </h2>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Funnel checkout payments
        </p>
      </div>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E8EDF5] bg-white px-3 text-xs font-semibold text-slate-600">
        <Activity className="size-3.5 text-slate-400" aria-hidden />
        {total} {total === 1 ? "order" : "orders"}
      </span>
    </header>
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

function OrderPaidAt({ payment }: { payment: FunnelPayment }) {
  const iso = payment.paidAt ?? payment.createdAt;
  const text = formatDateTimeShort(iso);
  if (!text) {
    return <span className="text-slate-300">N/A</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
      <Calendar className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      {text}
    </span>
  );
}

function orderStatusBadgeClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid" || normalized === "succeeded") {
    return "bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#dbeafe]";
  }
  if (normalized === "pending" || normalized === "processing" || normalized === "open") {
    return "bg-[#fff4ed] text-[#FD7137] ring-1 ring-[#fdba74]";
  }
  if (normalized === "failed" || normalized === "cancelled" || normalized === "canceled") {
    return "bg-[#fff1f2] text-[#be123c] ring-1 ring-[#fecdd3]";
  }
  if (
    normalized === "refunded" ||
    normalized === "partially_refunded" ||
    normalized === "disputed"
  ) {
    return "bg-[#fff8eb] text-[#b45309] ring-1 ring-[#fcd34d]";
  }
  return paymentStatusBadgeClass(status);
}

function OrderStatusBadge({ status }: { status: string }) {
  const label = formatPaymentStatusLabel(status);
  // Tag with bold status text only — no icons
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-bold ${orderStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}

function OrderRowActions({ payment }: { payment: FunnelPayment }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const email = payment.customerEmail?.trim() || "";

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
            Email customer
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
        aria-label="Order actions"
      >
        <MoreHorizontal className="size-4" strokeWidth={2.25} aria-hidden />
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </div>
  );
}

function OrdersPagination({
  meta,
  page,
  isPaymentsLoading,
  setPage,
}: {
  meta: NonNullable<ReturnType<typeof useFunnelPayments>["meta"]>;
  page: number;
  isPaymentsLoading: boolean;
  setPage: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  const rowOffset = (page - 1) * meta.limit;

  return (
    <div className="shrink-0 border-t border-[#e8edf5] px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-xs text-slate-500">
          Showing {meta.total === 0 ? 0 : rowOffset + 1} to{" "}
          {Math.min(rowOffset + meta.limit, meta.total)} of {meta.total} orders
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPaymentsLoading || page <= 1}
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
            disabled={isPaymentsLoading || page >= meta.totalPages}
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

function OrderPaymentMobileCard({
  payment,
  rowNumber,
  index,
}: {
  payment: FunnelPayment;
  rowNumber: number;
  index: number;
}) {
  const email = payment.customerEmail?.trim() || "";
  const currency = (payment.currency || "usd").toUpperCase();

  return (
    <article className="rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${avatarTone(index)}`}>
            {guestInitial(email)}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-normal text-[#07111f]">
              {email || "N/A"}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(payment.paidAt ?? payment.createdAt)}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={payment.status} />
      </div>
      <p className="m-0 mt-3 text-[0.8rem] font-semibold tabular-nums text-[#07111f]">
        {formatCents(payment.amount, payment.currency)}{" "}
        <span className="text-[0.68rem] font-semibold uppercase text-slate-400">
          {currency}
        </span>
      </p>
    </article>
  );
}

function OrdersTableSection({
  payments,
  rowOffset,
}: {
  payments: FunnelPayment[];
  rowOffset: number;
}) {
  return (
    <div>
      <div className="hidden overflow-x-auto overscroll-x-contain md:block">
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
                  label="Customer"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={CircleDollarSign}
                  label="Amount"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={`${thClass} whitespace-nowrap`}>
                <TableColumnHeader
                  icon={Layers}
                  label="Status"
                  iconClassName={TABLE_HEAD_ICON_CLASS}
                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                />
              </th>
              <th className={thClass}>
                <TableColumnHeader
                  icon={Calendar}
                  label="Paid at"
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
            {payments.map((payment, index) => {
              const email = payment.customerEmail?.trim() || "";
              const currency = (payment.currency || "usd").toUpperCase();

              return (
                <motion.tr
                  key={payment.id}
                  variants={tableRowReveal}
                  className="group border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
                >
                  <td className={tdClass}>
                    <span className="text-xs font-semibold tabular-nums text-slate-400">
                      {rowOffset + index + 1}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {email ? (
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${avatarTone(index)}`}>
                          {guestInitial(email)}
                        </span>
                        <div className="flex min-w-0 items-center gap-0.5">
                          <a
                            href={`mailto:${email}`}
                            className="block min-w-0 truncate font-normal text-[#07111f] underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                            title={email}
                          >
                            {email}
                          </a>
                          <CopyValueButton value={email} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <span className="inline-flex items-baseline gap-1.5">
                      <span className="text-sm font-normal tabular-nums tracking-tight text-[#07111f]">
                        {formatCents(payment.amount, payment.currency)}
                      </span>
                      <span className="text-[0.68rem] font-normal uppercase tabular-nums text-slate-400">
                        {currency}
                      </span>
                    </span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <OrderStatusBadge status={payment.status} />
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    <OrderPaidAt payment={payment} />
                  </td>
                  <td className={tdActionsClass}>
                    <OrderRowActions payment={payment} />
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
        {payments.map((payment, index) => (
          <OrderPaymentMobileCard
            key={payment.id}
            payment={payment}
            rowNumber={rowOffset + index + 1}
            index={index}
          />
        ))}
      </div>
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
  const {
    data: payments,
    meta,
    page,
    setPage,
    loading: isPaymentsLoading,
    error,
  } = useFunnelPayments(funnelId);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pageSize = meta?.limit ?? FUNNEL_ORDERS_PAGE_SIZE;
  const rowOffset = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize],
  );

  const showSkeleton =
    isFunnelIdLoading || (isPaymentsLoading && payments.length === 0);
  const showNoFunnelMessage =
    !isFunnelIdLoading && !isPaymentsLoading && funnelId == null;
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
  const showTable = !showSkeleton && !error && payments.length > 0;

  const panelContent = (
    <article className={ordersCardClass}>
      <OrdersPanelHeader total={total} />
      <div className="mt-2">
        {showSkeleton ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: standardEase }}
          >
            <OrdersTableSkeleton />
          </motion.div>
        ) : null}

        {showNoFunnelMessage ? (
          <div className="px-6 py-12 text-center">
            <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
              No funnel saved yet
            </p>
            <p className="m-0 mt-2 text-[0.82rem] font-medium text-slate-500">
              Open the Funnel tab and save once to load orders.
            </p>
          </div>
        ) : null}

        {showNoRecords ? <OrdersEmptyState /> : null}

        {showTable ? (
          <motion.div
            key={`orders-page-${page}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: standardEase }}
          >
            <OrdersTableSection
              payments={payments}
              rowOffset={rowOffset}
            />
          </motion.div>
        ) : null}
      </div>

      {showTable && meta ? (
        <OrdersPagination
          meta={meta}
          page={page}
          isPaymentsLoading={isPaymentsLoading}
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
      <div className="campaign-immersive-orders funnel-orders-root">
        {alert}
        <div className="funnel-orders-panel">
          <div className="funnel-orders-body">{panelContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="funnel-orders-root min-h-0 flex-1 overflow-y-auto bg-[#eef2f7]">
      {alert}
      <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {panelContent}
      </div>
    </div>
  );
}
