"use client";

import {
  Check,
  Clock,
  Copy,
  Mail,
  MoreVertical,
  ShoppingBag,
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
import { Skeleton } from "@/app/components/skeleton";
import { useFunnelPayments } from "@/app/hooks/use-funnel-payments";
import { paymentStatusBadgeClass } from "@/app/lib/badge-variants";
import { formatPaidAtParts } from "@/app/lib/datetime";
import { formatCents } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import type { FunnelPayment } from "@/app/services/payment/get-funnel-payments";
import { FUNNEL_ORDERS_PAGE_SIZE } from "@/app/services/payment/get-funnel-payments";

const ordersCardClass =
  "relative overflow-hidden rounded-[1.45rem] border border-[#e8edf5] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02]";

const thClass = "funnel-orders-th whitespace-nowrap text-left align-middle";
const tdClass = "funnel-orders-td text-left align-middle text-slate-700";

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
    <div className="funnel-orders-table-skeleton overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white ring-1 ring-black/[0.02]">
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
          <Skeleton funnel className="h-4 w-36" />
          <Skeleton funnel className="h-4 w-16" />
          <Skeleton funnel className="h-5 w-20 rounded-full" />
          <Skeleton funnel className="h-10 w-24" />
          <Skeleton funnel className="size-8 rounded-lg" />
        </div>
      ))}
    </div>
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

function OrdersPanelHeader() {
  return (
    <div className="relative border-b border-[#f1f5f9] bg-white px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe]"
          aria-hidden
        >
          <ShoppingBag className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-[#07111f]">
            Orders
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Funnel checkout payments
          </p>
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

function OrderPaidAt({ payment }: { payment: FunnelPayment }) {
  const iso = payment.paidAt ?? payment.createdAt;
  const paid = formatPaidAtParts(iso);
  if (!paid) {
    return <span className="text-slate-300">N/A</span>;
  }

  return (
    <span className="inline-flex flex-col gap-0.5 whitespace-nowrap">
      <span className="text-sm font-bold tabular-nums text-[#07111f]">
        {paid.time}
      </span>
      <span className="text-[0.68rem] font-medium tabular-nums text-slate-400">
        {paid.date}
      </span>
    </span>
  );
}

function orderStatusBadgeClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  // Match Members table: Status column stays in the orange family.
  if (normalized === "paid" || normalized === "succeeded") {
    return "bg-[#ecfdf5] text-emerald-700 ring-1 ring-emerald-200";
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
  const normalized = status.trim().toLowerCase();
  const label = formatPaymentStatusLabel(status);
  const isPaid = normalized === "paid" || normalized === "succeeded";
  const isPending =
    normalized === "pending" ||
    normalized === "processing" ||
    normalized === "open";

  // Paid / Pending: pill + solid icon circle (check / clock), matching product tags.
  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-1 pr-2.5 text-[0.6875rem] font-bold text-emerald-700 ring-1 ring-emerald-200">
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
          aria-hidden
        >
          <Check className="size-2.5" strokeWidth={3} />
        </span>
        {label}
      </span>
    );
  }

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4ed] px-2 py-1 pr-2.5 text-[0.6875rem] font-bold text-[#c2410c] ring-1 ring-[#fdba74]">
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FD7137] text-white"
          aria-hidden
        >
          <Clock className="size-2.5" strokeWidth={2.5} />
        </span>
        {label}
      </span>
    );
  }

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
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#e8edf5] bg-white text-slate-400 transition hover:border-[#FCB825]/50 hover:bg-[#FFF8E8] hover:text-[#FCB825] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B69FC]/25"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Order actions"
      >
        <MoreVertical className="size-4" strokeWidth={2.25} aria-hidden />
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

  return (
    <div className="funnel-orders-pagination">
      <div className="funnel-orders-pagination__pages">
        <button
          type="button"
          disabled={isPaymentsLoading || page <= 1}
          onClick={() => setPage(page - 1)}
          className="funnel-orders-page-btn"
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="funnel-orders-page-current" aria-current="page">
          {page}
        </span>
        <button
          type="button"
          disabled={isPaymentsLoading || page >= meta.totalPages}
          onClick={() => setPage(page + 1)}
          className="funnel-orders-page-btn"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
      <span className="text-[0.72rem] font-semibold text-slate-500">
        {meta.limit} per page
      </span>
    </div>
  );
}

function OrdersTableSection({
  payments,
  rowOffset,
  page,
  meta,
  isPaymentsLoading,
  setPage,
}: {
  payments: FunnelPayment[];
  rowOffset: number;
  page: number;
  meta: NonNullable<ReturnType<typeof useFunnelPayments>["meta"]> | null;
  isPaymentsLoading: boolean;
  setPage: (page: number) => void;
}) {
  return (
    <div className="funnel-orders-surface">
      <p className="funnel-orders-scroll-hint">
        Swipe sideways to see all columns
      </p>

      <div className="funnel-orders-table-wrap">
        <table className="funnel-orders-table">
          <thead>
            <motion.tr
              variants={tableHeaderReveal}
              initial="hidden"
              animate="show"
              className="funnel-orders-head-row"
            >
              <th className={`${thClass} funnel-orders-th--index`}>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#0B69FC]">
                  #
                </span>
              </th>
              <th className={`${thClass} funnel-orders-th--email`}>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#0B69FC]">
                  Customer email
                </span>
              </th>
              <th className={`${thClass} funnel-orders-th--amount`}>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#00B34C]">
                  Amount
                </span>
              </th>
              <th className={`${thClass} funnel-orders-th--status`}>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#FD7137]">
                  Status
                </span>
              </th>
              <th className={`${thClass} funnel-orders-th--paid`}>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#F83071]">
                  Paid at
                </span>
              </th>
              <th className={`${thClass} funnel-orders-th--actions`}>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] leading-none text-[#FCB825]">
                  Actions
                </span>
              </th>
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
                  className={`group border-b border-[#f1f5f9] transition-colors duration-150 last:border-b-0 hover:bg-[#f0f5ff] ${
                    index % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
                  }`}
                >
                  <td className={`${tdClass} funnel-orders-td--index`}>
                    <span className="text-xs font-semibold tabular-nums text-slate-400">
                      {rowOffset + index + 1}
                    </span>
                  </td>
                  <td className={`${tdClass} funnel-orders-td--email`}>
                    {email ? (
                      <div className="flex min-w-0 items-center gap-0.5">
                        <a
                          href={`mailto:${email}`}
                          className="block min-w-0 truncate text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline"
                          title={email}
                        >
                          {email}
                        </a>
                        <CopyValueButton value={email} />
                      </div>
                    ) : (
                      <span className="text-slate-300">N/A</span>
                    )}
                  </td>
                  <td className={`${tdClass} funnel-orders-td--amount`}>
                    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                      <span className="text-sm font-bold tabular-nums tracking-tight text-[#07111f]">
                        {formatCents(payment.amount, payment.currency)}
                      </span>
                      <span className="text-[0.68rem] font-semibold uppercase tabular-nums text-slate-400">
                        {currency}
                      </span>
                    </span>
                  </td>
                  <td className={`${tdClass} funnel-orders-td--status whitespace-nowrap`}>
                    <OrderStatusBadge status={payment.status} />
                  </td>
                  <td className={`${tdClass} funnel-orders-td--paid whitespace-nowrap`}>
                    <OrderPaidAt payment={payment} />
                  </td>
                  <td className={`${tdClass} funnel-orders-td--actions`}>
                    <OrderRowActions payment={payment} />
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>

      {meta ? (
        <OrdersPagination
          meta={meta}
          page={page}
          isPaymentsLoading={isPaymentsLoading}
          setPage={setPage}
        />
      ) : null}
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

  const panelContent = (
    <div className="funnel-orders-content">
      {showSkeleton ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: standardEase }}
        >
          <OrdersPanelHeader />
          <OrdersTableSkeleton />
        </motion.div>
      ) : null}

      {showNoFunnelMessage ? (
        <div className="rounded-[1.1rem] border border-dashed border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white px-6 py-12 text-center">
          <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
            No funnel saved yet
          </p>
          <p className="m-0 mt-2 text-[0.82rem] font-medium text-slate-500">
            Open the Funnel tab and save once to load orders.
          </p>
        </div>
      ) : null}

      {showNoRecords ? <OrdersEmptyState /> : null}

      {!showSkeleton && !error && payments.length > 0 ? (
        <motion.div
          key={`orders-page-${page}`}
          className="funnel-orders-content"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: standardEase }}
        >
          <OrdersPanelHeader />

          <OrdersTableSection
            payments={payments}
            rowOffset={rowOffset}
            page={page}
            meta={meta}
            isPaymentsLoading={isPaymentsLoading}
            setPage={setPage}
          />
        </motion.div>
      ) : null}
    </div>
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
        <article className={`${ordersCardClass} p-4 sm:p-5`}>
          {panelContent}
        </article>
      </div>
    </div>
  );
}
