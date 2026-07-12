"use client";

import {
  Calendar,
  CircleCheck,
  CircleDollarSign,
  Layers,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { StripeIcon } from "@/app/components/StripeLogo";
import { Skeleton } from "@/app/components/skeleton";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { useFunnelPayments } from "@/app/hooks/use-funnel-payments";
import { paymentStatusBadgeClass } from "@/app/lib/badge-variants";
import { formatPaidAtParts } from "@/app/lib/datetime";
import { formatCents } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import type { FunnelPayment } from "@/app/services/payment/get-funnel-payments";
import { FUNNEL_ORDERS_PAGE_SIZE } from "@/app/services/payment/get-funnel-payments";

const ordersCardClass =
  "overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]";

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

const ordersHeadIconClass = "text-[#1877f2]";
const ordersHeadLabelClass = "text-slate-800";
const ordersHeadBoxClass = "border-[#bfdbfe]/80 bg-[#f4f8ff]";

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
          <Skeleton funnel className="size-8 shrink-0 rounded-lg" />
          <Skeleton funnel className="h-4 w-32" />
          <Skeleton funnel className="h-4 w-16" />
          <Skeleton funnel className="h-4 w-16" />
          <Skeleton funnel className="h-4 w-24" />
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

function OrdersPanelHeader({ total }: { total: number }) {
  return (
    <div className="funnel-orders-header">
      <div className="funnel-orders-header__copy">
        <span className="inline-flex items-center rounded-full bg-[#1877f2]/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
          Orders
        </span>
        <span className="text-[0.72rem] font-medium text-slate-500">
          Paid orders for this funnel
        </span>
      </div>
      <span className="funnel-orders-header__total rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
        {total} total
      </span>
    </div>
  );
}

function OrderPaidAt({ payment }: { payment: FunnelPayment }) {
  const paid = formatPaidAtParts(payment.paidAt ?? payment.createdAt);
  if (!paid) {
    return <span className="text-slate-300">N/A</span>;
  }

  return (
    <span className="inline-flex flex-col gap-0.5 text-slate-600">
      <span className="text-sm font-medium">{paid.date}</span>
      <span className="text-xs tabular-nums text-slate-400">{paid.time}</span>
    </span>
  );
}

function OrderEmail({
  email,
  className = "",
}: {
  email: string | null | undefined;
  className?: string;
}) {
  const trimmed = email?.trim();
  if (!trimmed) {
    return <span className="text-slate-300">N/A</span>;
  }

  return (
    <a
      href={`mailto:${trimmed}`}
      className={`text-slate-600 underline-offset-2 transition hover:text-[#1877f2] hover:underline ${className}`}
      title={trimmed}
    >
      {trimmed}
    </a>
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
              className="border-b border-[#e8edf5] bg-[#f8fafc]/60"
            >
              <th className={`${thClass} funnel-orders-th--index`}>
                <TableColumnHeader
                  label="#"
                  iconClassName={ordersHeadIconClass}
                  labelClassName={ordersHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-orders-th--platform`}>
                <TableColumnHeader
                  variant="boxed"
                  icon={Layers}
                  label="Platform"
                  iconClassName={ordersHeadIconClass}
                  iconBoxClassName={ordersHeadBoxClass}
                  labelClassName={ordersHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-orders-th--email`}>
                <TableColumnHeader
                  variant="boxed"
                  icon={Mail}
                  label="Customer email"
                  iconClassName={ordersHeadIconClass}
                  iconBoxClassName={ordersHeadBoxClass}
                  labelClassName={ordersHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-orders-th--amount`}>
                <TableColumnHeader
                  variant="boxed"
                  icon={CircleDollarSign}
                  label="Amount"
                  iconClassName={ordersHeadIconClass}
                  iconBoxClassName={ordersHeadBoxClass}
                  labelClassName={ordersHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-orders-th--status`}>
                <TableColumnHeader
                  variant="boxed"
                  icon={CircleCheck}
                  label="Status"
                  iconClassName={ordersHeadIconClass}
                  iconBoxClassName={ordersHeadBoxClass}
                  labelClassName={ordersHeadLabelClass}
                />
              </th>
              <th className={`${thClass} funnel-orders-th--paid`}>
                <TableColumnHeader
                  variant="boxed"
                  icon={Calendar}
                  label="Paid at"
                  iconClassName={ordersHeadIconClass}
                  iconBoxClassName={ordersHeadBoxClass}
                  labelClassName={ordersHeadLabelClass}
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
                className="group border-b border-[#f1f5f9] bg-white transition-colors duration-150 last:border-0 hover:bg-[#f8fafc]/80"
              >
                <td className={`${tdClass} funnel-orders-td--index`}>
                  <span className="text-xs font-semibold tabular-nums text-slate-400">
                    {rowOffset + index + 1}
                  </span>
                </td>
                <td className={`${tdClass} funnel-orders-td--platform`}>
                  <span className="inline-flex rounded-xl border border-[#e8edf5] bg-white p-1 shadow-sm ring-1 ring-black/[0.02] transition-transform duration-200 group-hover:scale-[1.03]">
                    <StripeIcon className="funnel-orders-platform-icon !rounded-lg shadow-none ring-0" />
                  </span>
                </td>
                <td
                  className={`${tdClass} funnel-orders-td--email font-medium text-[#07111f]`}
                  title={payment.customerEmail?.trim() || undefined}
                >
                  <OrderEmail email={payment.customerEmail} />
                </td>
                <td
                  className={`${tdClass} funnel-orders-td--amount whitespace-nowrap font-bold tabular-nums tracking-tight text-[#07111f]`}
                >
                  {formatCents(payment.amount, payment.currency)}
                </td>
                <td className={`${tdClass} funnel-orders-td--status whitespace-nowrap`}>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold capitalize ring-1 ring-black/5 ${paymentStatusBadgeClass(payment.status)}`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className={`${tdClass} funnel-orders-td--paid whitespace-nowrap`}>
                  <OrderPaidAt payment={payment} />
                </td>
              </motion.tr>
            ))}
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
      <OffsetPagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        loading={isPaymentsLoading}
        onPageChange={setPage}
        itemLabel="orders"
      />
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

  const showSkeleton = isFunnelIdLoading || (isPaymentsLoading && payments.length === 0);
  const showNoFunnelMessage =
    !isFunnelIdLoading && !isPaymentsLoading && funnelId == null;
  const showNoRecords =
    !showSkeleton && !error && funnelId != null && (meta?.total ?? 0) === 0;
  const totalOrders = meta?.total ?? payments.length;

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
          <OrdersPanelHeader total={0} />
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
          <OrdersPanelHeader total={totalOrders} />

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
