"use client";

import {
  Activity,
  ArrowUpRight,
  Calendar,
  Check,
  CircleDollarSign,
  Copy,
  CreditCard,
  Eye,
  Layers,
  LayoutGrid,
  Mail,
  Megaphone,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  TrendingUp,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatDateTimeShort } from "@/app/lib/datetime";
import {
  DASHBOARD_CAMPAIGN_TAG,
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatDollars } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import {
  resolveUploadImageUrl,
  spacesImageLoadProps,
} from "@/app/lib/resolve-upload-image-url";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getBusinessFunnelEvents,
  RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
  type BusinessFunnelEvent,
} from "@/app/services/funnel-event/get-business-registrations";
import { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";

const ORDERS_TABLE_PAGE_SIZE = RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE;

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

type StatusFilter = "all" | "paid" | "not_paid";
type DateFilter = "all" | "today" | "week" | "month";
type DisplayPaymentStatus = "paid" | "pending" | "failed" | "refunded";

const STATUS_FILTERS: { id: StatusFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "paid", label: "Paid", icon: CircleDollarSign },
  { id: "not_paid", label: "Not Paid", icon: X },
];

const DATE_FILTERS: { id: Exclude<DateFilter, "all">; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Today", icon: Calendar },
  { id: "week", label: "This Week", icon: Calendar },
  { id: "month", label: "This Month", icon: Calendar },
];

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

function CampaignTypeBadge({
  campaignType,
}: {
  campaignType?: "prepaid" | "postpaid" | null;
}) {
  if (campaignType === "postpaid") {
    return (
      <span className="inline-flex rounded-md bg-[#eef1f5] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.04em] text-[#4b5563] ring-1 ring-[#e5e7eb]">
        Postpaid
      </span>
    );
  }
  if (campaignType === "prepaid") {
    return (
      <span className="inline-flex rounded-md bg-[#e8f2ff] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.04em] text-[#1877f2] ring-1 ring-[#dbeafe]">
        Prepaid
      </span>
    );
  }
  return <span className="text-slate-400">—</span>;
}

function OrdersTableBodySkeleton() {
  return (
    <>
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
          <Skeleton funnel className="h-6 w-16 rounded-full" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Skeleton funnel className="size-8 shrink-0 rounded-full" />
            <Skeleton funnel className="h-4 w-28" />
          </div>
          <Skeleton funnel className="h-6 w-24 rounded-full" />
          <Skeleton funnel className="h-4 w-16" />
          <Skeleton funnel className="h-4 w-24" />
          <Skeleton funnel className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </>
  );
}

function displayName(event: {
  customer: { name: string; email?: string } | null;
  customerEmail: string | null;
}): string {
  const name = event.customer?.name?.trim();
  if (name) return name;
  const email = event.customer?.email?.trim() || event.customerEmail?.trim();
  if (email) return email.split("@")[0] ?? email;
  return "Guest";
}

function resolveDisplayStatus(event: BusinessFunnelEvent): DisplayPaymentStatus {
  const paymentStatus = event.paymentStatus?.toLowerCase() ?? null;

  if (
    paymentStatus === "refunded" ||
    paymentStatus === "partially_refunded"
  ) {
    return "refunded";
  }

  if (paymentStatus === "failed" || paymentStatus === "cancelled") {
    return "failed";
  }

  if (paymentStatus === "pending") {
    return "pending";
  }

  const isPaid =
    paymentStatus === "paid" ||
    event.paidAt != null ||
    event.orderStatus === "paid_walk_in" ||
    event.orderStatus === "paid_both";

  if (isPaid) {
    return "paid";
  }

  return "pending";
}

function orderStatusLabel(status: DisplayPaymentStatus): string {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return "Payment Pending";
}

function orderStatusBadgeClass(status: DisplayPaymentStatus): string {
  if (status === "paid") {
    return "bg-[#ecfdf5] text-[#166534] ring-1 ring-[#bbf7d0]/80";
  }
  if (status === "failed") {
    return "bg-[#fef2f2] text-[#991b1b] ring-1 ring-[#fecaca]/80";
  }
  if (status === "refunded") {
    return "bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-[#bfdbfe]/80";
  }
  return "bg-[#fff7ed] text-[#c2410c] ring-1 ring-[#fed7aa]/80";
}

function orderStatusDotClass(status: DisplayPaymentStatus): string {
  if (status === "paid") return "bg-[#22c55e]";
  if (status === "failed") return "bg-[#ef4444]";
  if (status === "refunded") return "bg-[#3b82f6]";
  return "bg-[#f97316]";
}

function eventCampaignAmount(event: BusinessFunnelEvent): number {
  if (event.onlineAmountCents != null && event.onlineAmountCents > 0) {
    return event.onlineAmountCents / 100;
  }

  if (event.amount != null && event.amount > 0) {
    return event.amount / 100;
  }

  return 0;
}

function eventCounterExtrasAmount(event: BusinessFunnelEvent): number {
  const extras = event.businessAmount ?? event.restaurantAmount ?? null;
  if (extras == null || !(extras > 0)) {
    return 0;
  }
  return extras;
}

function eventPaymentDate(event: BusinessFunnelEvent): string {
  return (
    event.paidAt ??
    event.businessVisitedAt ??
    event.restaurantVisitedAt ??
    event.createdAt
  );
}

function formatOrderAmountText(
  event: BusinessFunnelEvent,
  status: DisplayPaymentStatus,
): { text: string; muted: boolean } {
  const currency = event.currency ?? "USD";
  const amount = eventCampaignAmount(event);

  if (status === "paid") {
    return {
      text: amount > 0 ? formatDollars(amount, currency) : "Paid",
      muted: false,
    };
  }

  if (status === "pending") {
    if (amount > 0) {
      return { text: formatDollars(amount, currency), muted: true };
    }
    return { text: "Awaiting payment", muted: true };
  }

  if (status === "failed") return { text: "Failed", muted: true };
  if (status === "refunded") return { text: "Refunded", muted: true };
  return { text: "—", muted: true };
}

function formatCounterExtrasText(event: BusinessFunnelEvent): string {
  const currency = event.currency ?? "USD";
  const extras = eventCounterExtrasAmount(event);
  return extras > 0 ? formatDollars(extras, currency) : "—";
}

function OrderAmountDisplay({ event }: { event: BusinessFunnelEvent }) {
  const status = resolveDisplayStatus(event);
  const { text, muted } = formatOrderAmountText(event, status);

  return (
    <span className={muted ? "text-slate-400" : "font-semibold text-[#07111f]"}>
      {text}
    </span>
  );
}

function OrderNetAmountDisplay({ event }: { event: BusinessFunnelEvent }) {
  const text = formatCounterExtrasText(event);
  return (
    <span
      className={
        text === "—"
          ? "text-slate-400"
          : "font-semibold tabular-nums text-[#07111f]"
      }
    >
      {text}
    </span>
  );
}

function guestInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts[0].charAt(0).toUpperCase();
}

function FilterTab({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-2.5 text-sm font-semibold ${
        active
          ? "text-[#1877f2]"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      {label}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#1877f2]" />
      ) : null}
    </button>
  );
}

function OrderEventMobileCard({
  event,
  rowNumber,
  index,
  baseHref,
  onView,
}: {
  event: BusinessFunnelEvent;
  rowNumber: number;
  index: number;
  baseHref: string;
  onView: () => void;
}) {
  const name = displayName(event);
  const initial = guestInitial(name);
  const status = resolveDisplayStatus(event);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      className="w-full cursor-pointer rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff]/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${avatarTone(index)}`}>
            {initial}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-bold text-[#07111f]">
              {name}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(eventPaymentDate(event))}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-bold ${orderStatusBadgeClass(status)}`}
        >
          <span
            className={`size-1.5 rounded-full ${orderStatusDotClass(status)}`}
            aria-hidden
          />
          {orderStatusLabel(status)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`${DASHBOARD_CAMPAIGN_TAG} max-w-[55%] gap-1 text-[0.72rem]`}
          title={event.campaignName}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{event.campaignName}</span>
        </span>
        <div className="shrink-0 text-right">
          <p className="m-0 text-[0.82rem] font-bold text-[#07111f]">
            <OrderAmountDisplay event={event} />
          </p>
          <p className="m-0 mt-0.5 text-[0.68rem] font-medium text-slate-500">
            Paid <OrderNetAmountDisplay event={event} />
          </p>
        </div>
      </div>
    </div>
  );
}

function OrdersEmptyState({
  campaignsHref,
  embedded = false,
}: {
  campaignsHref: string;
  embedded?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center px-6 py-14 text-center sm:py-16 ${
        embedded
          ? "min-h-0 w-full flex-1 justify-center py-14 sm:py-16"
          : ordersCardClass
      }`}
    >
      <div className="relative mb-5 flex size-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
          aria-hidden
        />
        <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-[#f4f8ff] shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
          <TrendingUp
            className="size-10 text-[#1877f2]"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#e1306c] text-white shadow-md">
          <Megaphone className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
      </div>

      <h2 className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        No funnel activity yet
      </h2>
      <p className="m-0 mt-2 max-w-sm text-[0.82rem] font-medium leading-relaxed text-slate-500">
        Launch your first campaign to start tracking signups and payments.
      </p>

      <Link
        href={campaignsHref}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.82rem] font-bold text-white no-underline shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
      >
        Create Campaign
        <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}

function formatTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getCustomerEmail(event: BusinessFunnelEvent): string | null {
  const fromProfile = event.customer?.email?.trim();
  if (fromProfile) return fromProfile;
  const fromSignup = event.customerEmail?.trim();
  if (fromSignup) return fromSignup;
  return null;
}

function getCustomerPhone(event: BusinessFunnelEvent): string | null {
  const phone = event.customer?.phone?.trim();
  return phone ? phone : null;
}

function resolvePaymentMedium(
  event: BusinessFunnelEvent,
): "In store" | "Online" | null {
  const source = (event.paymentSource ?? "").toUpperCase();
  if (source === "SCANNER" || source === "MANUAL") return "In store";
  if (source === "STRIPE") return "Online";
  if (
    event.orderStatus === "paid_walk_in" ||
    event.orderStatus === "paid_both"
  ) {
    return "In store";
  }
  if (event.orderStatus === "paid_online") return "Online";
  return null;
}

function formatOrderDetailDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "N/A";
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "short" });
    const time = date
      .toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${day} ${month}, ${time}`;
  } catch {
    return "N/A";
  }
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
      className="ml-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#eaf2ff] text-[#3b82f6] transition hover:bg-[#dbeafe]"
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="size-3.5" strokeWidth={2.1} aria-hidden />
      )}
    </button>
  );
}

function OrderDetailIcon({
  icon: Icon,
}: {
  icon: LucideIcon;
}) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f6bed]">
      <Icon className="size-[0.95rem]" strokeWidth={1.9} aria-hidden />
    </span>
  );
}

function OrderDetailRow({
  icon: Icon,
  label,
  children,
  copyValue,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  copyValue?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] px-4 py-[0.95rem] last:border-b-0">
      <dt className="flex min-w-0 shrink-0 items-center gap-2.5 text-[0.92rem] font-medium text-[#1a1c3d]">
        <OrderDetailIcon icon={Icon} />
        {label}
      </dt>
      <dd className="m-0 flex min-w-0 max-w-[58%] items-center justify-end gap-1 text-right text-[0.92rem] font-medium text-[#1a1c3d]">
        {children}
        {copyValue ? <CopyValueButton value={copyValue} /> : null}
      </dd>
    </div>
  );
}

function HeaderStatusBadge({ status }: { status: DisplayPaymentStatus }) {
  const label = orderStatusLabel(status);
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fdba74] bg-[#fff7ed] px-2.5 py-1 text-[0.7rem] font-medium text-[#c2410c]">
        <CreditCard className="size-3.5" strokeWidth={2.2} aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${orderStatusBadgeClass(status)}`}
    >
      <span
        className={`size-2 shrink-0 rounded-full ${orderStatusDotClass(status)}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

function OrderEventDetailDialog({
  event,
  open,
  onClose,
}: {
  event: BusinessFunnelEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open || !event) return null;

  const name = displayName(event);
  const status = resolveDisplayStatus(event);
  const email = getCustomerEmail(event);
  const phone = getCustomerPhone(event);
  const paymentMedium = resolvePaymentMedium(event);
  const campaignLabel = formatTitleCase(event.campaignName);
  const campaignInitial = guestInitial(campaignLabel || "Campaign");
  const campaignImageSrc = resolveUploadImageUrl(event.campaignImageUrl);
  const amountDisplay = formatOrderAmountText(event, status);
  const netAmountText = formatCounterExtrasText(event);

  const dialog = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07111f]/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[27.5rem] rounded-[1.85rem] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-[3.35rem] shrink-0">
              {campaignImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaignImageSrc}
                  alt=""
                  {...spacesImageLoadProps}
                  className="size-[3.35rem] rounded-full object-cover ring-[3px] ring-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
                />
              ) : (
                <span className="flex size-[3.35rem] items-center justify-center rounded-full bg-[#1877f2] text-[0.95rem] font-medium text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]">
                  {campaignInitial}
                </span>
              )}
              <span
                className="absolute right-0.5 bottom-0.5 size-3.5 rounded-full border-[2.5px] border-white bg-[#22c55e]"
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <h2
                id="order-detail-title"
                className="m-0 truncate text-[1.2rem] font-medium tracking-tight text-[#1a1c3d]"
              >
                {campaignLabel || "Campaign"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <HeaderStatusBadge status={status} />
                {paymentMedium ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${
                      paymentMedium === "In store"
                        ? "border border-[#fdba74] bg-[#fff7ed] text-[#c2410c]"
                        : "bg-[#ecfdf5] text-[#047857]"
                    }`}
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        paymentMedium === "In store"
                          ? "bg-[#ea580c]"
                          : "bg-[#22c55e]"
                      }`}
                      aria-hidden
                    />
                    {paymentMedium}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-slate-400 shadow-[0_2px_10px_rgba(15,23,42,0.08)] ring-1 ring-[#eef2f7] transition hover:text-[#1a1c3d]"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[1.25rem] bg-[linear-gradient(118deg,#dce9ff_0%,#e7ecff_48%,#efe8ff_100%)] px-4 py-[1.15rem]">
          <span
            className="pointer-events-none absolute -top-10 right-10 size-28 rounded-full bg-[#c7d9ff]/70 blur-md"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute -right-6 -bottom-12 size-32 rotate-[18deg] rounded-[2rem] bg-[#d9c8ff]/55 blur-[2px]"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-[4.5rem] top-2 size-11 rounded-full bg-white/55"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-3 right-8 flex items-end gap-1 opacity-45"
            aria-hidden
          >
            <span className="h-5 w-2.5 rounded-t-md bg-[#8eb4ff]" />
            <span className="h-9 w-2.5 rounded-t-md bg-[#6f9dff]" />
            <span className="h-7 w-2.5 rounded-t-md bg-[#a9c4ff]" />
          </div>
          <Megaphone
            className="pointer-events-none absolute right-1 -bottom-1 size-[4.25rem] rotate-[18deg] text-[#9bb6ff]/55"
            strokeWidth={1.4}
            aria-hidden
          />
          <div className="relative z-[1] flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[0.95rem] bg-[#1877f2] text-white shadow-[0_10px_22px_rgba(24,119,242,0.38)]">
              <Megaphone className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.98rem] font-medium text-[#1a1c3d]">
                Campaign Overview
              </p>
              <p className="m-0 mt-0.5 text-[0.76rem] font-medium text-slate-500">
                Here are the details of this campaign.
              </p>
            </div>
            <span className="inline-flex max-w-[44%] shrink-0 items-center gap-1.5 rounded-full bg-[#fce7f3] px-3 py-1.5 text-[0.74rem] font-medium text-[#be185d]">
              <UserRound className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="truncate">{name}</span>
            </span>
          </div>
        </div>

        <dl className="m-0 mt-4 overflow-hidden rounded-[1.15rem] border border-[#eef2f7]">
            <OrderDetailRow icon={Layers} label="Medium">
              {paymentMedium ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-medium ${
                    paymentMedium === "In store"
                      ? "bg-[#fff7ed] text-[#c2410c]"
                      : "bg-[#ecfdf5] text-[#047857]"
                  }`}
                >
                  {paymentMedium}
                </span>
              ) : (
                <span className="font-medium text-slate-400">—</span>
              )}
            </OrderDetailRow>

            <OrderDetailRow icon={CircleDollarSign} label="Offer amount">
              <span className={amountDisplay.muted ? "font-medium text-slate-400" : "text-[#1a1c3d]"}>
                {amountDisplay.text}
              </span>
            </OrderDetailRow>

            <OrderDetailRow icon={Plus} label="Counter extras">
              <span className={netAmountText === "—" ? "font-medium text-slate-400" : "text-[#1a1c3d]"}>
                {netAmountText}
              </span>
            </OrderDetailRow>

            <OrderDetailRow icon={Calendar} label="Date">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#1a1c3d]">
                <Calendar className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                {formatOrderDetailDate(eventPaymentDate(event))}
              </span>
            </OrderDetailRow>

            <OrderDetailRow icon={Mail} label="Email" copyValue={email}>
              <span className={`truncate ${email ? "text-[#1a1c3d]" : "font-medium text-slate-400"}`}>
                {email ?? "None"}
              </span>
            </OrderDetailRow>

            <OrderDetailRow icon={Phone} label="Phone" copyValue={phone}>
              <span className={phone ? "text-[#1a1c3d]" : "font-medium text-slate-400"}>
                {phone ?? "None"}
              </span>
            </OrderDetailRow>
          </dl>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

function OrderRowActions({
  event,
  baseHref,
  onView,
}: {
  event: BusinessFunnelEvent;
  baseHref: string;
  onView: () => void;
}) {
  const menuItemCount = 1;
  const {
    open,
    setOpen,
    toggle,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    placement: "flip",
    align: "right",
    width: 168,
    estimatedHeight: menuItemCount * 40 + 8,
  });

  const menu =
    mounted && open && menuPosition ? (
      <div
        ref={menuRef}
        role="menu"
        aria-label="Order actions"
        style={menuStyle}
        className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.02]"
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onView();
          }}
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
        >
          <Eye className="size-3.5 text-[#1877f2]" aria-hidden />
          View details
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

export function BusinessOrdersPanel({
  businessId,
}: {
  businessId: number;
}) {
  const baseHref = `/business/${businessId}/dashboard`;

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] =
    useState<BusinessFunnelEvent | null>(null);
  const closeOrderDetail = useCallback(() => setSelectedEvent(null), []);

  const hasActiveFilters =
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    deferredSearchQuery.trim().length > 0;

  const eventsQuery = useQuery({
    queryKey: [
      "business-orders-events",
      businessId,
      page,
      statusFilter,
      dateFilter,
      deferredSearchQuery,
    ],
    queryFn: () =>
      getBusinessFunnelEvents(businessId, page, ORDERS_TABLE_PAGE_SIZE, {
        status: statusFilter,
        date: dateFilter,
        search: deferredSearchQuery,
      }),
    enabled: businessId > 0,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous,
  });

  const events = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta ?? null;
  const loading = eventsQuery.isLoading;
  const fetchingResults =
    eventsQuery.isFetching && !eventsQuery.isLoading;
  const error = eventsQuery.error
    ? getApiErrorMessage(eventsQuery.error, "Could not load funnel events.")
    : null;

  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const totalEvents = meta?.total ?? 0;
  const allEventsTotal = meta?.allEventsTotal ?? totalEvents;
  const rowOffset = (page - 1) * ORDERS_TABLE_PAGE_SIZE;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, deferredSearchQuery]);

  useEffect(() => {
    if (eventsQuery.isFetching || !meta) return;
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, meta, eventsQuery.isFetching]);

  useEffect(() => {
    if (loading || !error || alertDismissed) return;
    setAlertMessage(error);
  }, [error, loading, alertDismissed]);

  const showEmpty =
    !loading && !error && !hasActiveFilters && allEventsTotal === 0;
  const showNoFilterResults =
    !loading && !error && hasActiveFilters && totalEvents === 0;
  const showTable = !loading && !error && events.length > 0;
  const allCount = allEventsTotal;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ordersHeader = (
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
      <div>
        <h2 className="m-0 text-[1.45rem] font-extrabold tracking-tight text-[#07111f]">
          Orders &amp; Payments
        </h2>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Track signups, payments, and customer funnel activity
        </p>
      </div>
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E8EDF5] bg-white px-3 text-xs font-semibold text-slate-600">
        <Activity className="size-3.5 text-slate-400" aria-hidden />
        {allCount} {allCount === 1 ? "order" : "orders"}
      </span>
    </header>
  );

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Orders">
      <OverviewAlertDialog
        open={alertMessage != null}
        message={alertMessage ?? ""}
        onClose={() => {
          setAlertMessage(null);
          setAlertDismissed(true);
        }}
      />

      <OrderEventDetailDialog
        event={selectedEvent}
        open={selectedEvent != null}
        onClose={closeOrderDetail}
      />

      <div className="rd-premium-page">
        {showEmpty ? (
          <article className={`${ordersCardClass} rd-premium-panel`}>
            {ordersHeader}
            <div className="rd-premium-panel__body rd-premium-panel__body--center">
              <OrdersEmptyState
                campaignsHref={`${baseHref}/campaigns`}
                embedded
              />
            </div>
          </article>
        ) : (
          <article className={`${ordersCardClass} rd-premium-panel`}>
            {ordersHeader}
            <div
              className="flex shrink-0 flex-col"
              aria-label="Order filters"
            >
              <div className="mt-4 flex flex-wrap items-center gap-2 px-5 sm:px-6">
                <label className="relative w-full max-w-[20rem]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customer or campaign..."
                    className="h-10 w-full rounded-xl border border-[#E8EDF5] bg-white py-2 pl-9 pr-16 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#c7d7f5] focus:ring-2 focus:ring-[#e8f1ff]"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[#E8EDF5] bg-[#f8fafc] px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-400">
                    ⌘ K
                  </span>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-1 border-b border-[#e8edf5] px-5 sm:px-6">
                {STATUS_FILTERS.map((filter) => (
                  <FilterTab
                    key={filter.id}
                    label={filter.label}
                    icon={filter.icon}
                    active={statusFilter === filter.id}
                    onClick={() => {
                      startTransition(() => {
                        setPage(1);
                        setStatusFilter(filter.id);
                      });
                    }}
                  />
                ))}
                {DATE_FILTERS.map((filter) => (
                  <FilterTab
                    key={filter.id}
                    label={filter.label}
                    icon={filter.icon}
                    active={dateFilter === filter.id}
                    onClick={() => {
                      startTransition(() => {
                        setPage(1);
                        setDateFilter((prev) =>
                          prev === filter.id ? "all" : filter.id,
                        );
                      });
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="rd-premium-panel__body">
              {loading && events.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: standardEase }}
                >
                  <OrdersTableBodySkeleton />
                </motion.div>
              ) : null}

              {showNoFilterResults ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
                    No matching events
                  </p>
                  <p className="m-0 mt-1 max-w-sm text-[0.8rem] font-medium text-slate-500">
                    Try a different filter or search term.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setDateFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 cursor-pointer rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.8rem] font-bold text-[#1877f2] transition hover:bg-[#f4f8ff]"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}

              {showTable ? (
                <div
                  className={`transition-opacity duration-200 ease-out ${
                    fetchingResults ? "opacity-55" : "opacity-100"
                  }`}
                  aria-busy={fetchingResults}
                >
                  <div className="hidden overflow-x-auto overscroll-x-contain md:block">
                    <table className="w-full min-w-[48rem] border-collapse">
                      <thead>
                        <tr className="border-b border-[#e8edf5] bg-[#f8fafc]/60">
                          <th className={`${thClass} w-12`}>
                            <TableColumnHeader
                              label="#"
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
                              icon={UserRound}
                              label="Name"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thClass}>
                            <TableColumnHeader
                              icon={Megaphone}
                              label="Campaign"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thClass}>
                            <TableColumnHeader
                              icon={Layers}
                              label="Type"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thClass}>
                            <TableColumnHeader
                              icon={CircleDollarSign}
                              label="Offer amount"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thClass}>
                            <TableColumnHeader
                              icon={CircleDollarSign}
                              label="Counter extras"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thClass}>
                            <TableColumnHeader
                              icon={Calendar}
                              label="Payment Date"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thActionsClass}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event, index) => {
                          const rowNumber = rowOffset + index + 1;
                          const name = displayName(event);
                          const initial = guestInitial(name);
                          const status = resolveDisplayStatus(event);

                          return (
                            <tr
                              key={event.rowKey ?? `event:${event.id}`}
                              onClick={() => setSelectedEvent(event)}
                              className="group cursor-pointer border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
                            >
                              <td className={tdClass}>
                                <span className="text-xs font-semibold tabular-nums text-slate-400">
                                  {rowNumber}
                                </span>
                              </td>
                              <td className={`${tdClass} whitespace-nowrap`}>
                                <span
                                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${orderStatusBadgeClass(status)}`}
                                >
                                  <span
                                    className={`size-2 shrink-0 rounded-full ${orderStatusDotClass(status)}`}
                                    aria-hidden
                                  />
                                  {orderStatusLabel(status)}
                                </span>
                              </td>
                              <td className={tdClass}>
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${avatarTone(index)}`}>
                                    {initial}
                                  </span>
                                  <span className="truncate font-semibold text-[#07111f]">
                                    {name}
                                  </span>
                                </div>
                              </td>
                              <td
                                className={tdClass}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span
                                  title={event.campaignName}
                                  className={`${DASHBOARD_CAMPAIGN_TAG} max-w-[14rem]`}
                                >
                                  <span className="truncate">
                                    {event.campaignName}
                                  </span>
                                </span>
                              </td>
                              <td className={`${tdClass} whitespace-nowrap`}>
                                <CampaignTypeBadge
                                  campaignType={event.campaignType}
                                />
                              </td>
                              <td
                                className={`${tdClass} whitespace-nowrap tabular-nums`}
                              >
                                <OrderAmountDisplay event={event} />
                              </td>
                              <td
                                className={`${tdClass} whitespace-nowrap tabular-nums`}
                              >
                                <OrderNetAmountDisplay event={event} />
                              </td>
                              <td
                                className={`${tdClass} whitespace-nowrap text-slate-600`}
                              >
                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                                  <Calendar
                                    className="size-3.5 shrink-0 text-slate-400"
                                    aria-hidden
                                  />
                                  {formatDateTimeShort(eventPaymentDate(event))}
                                </span>
                              </td>
                              <td className={tdActionsClass}>
                                <div
                                  className="inline-flex justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <OrderRowActions
                                    event={event}
                                    baseHref={baseHref}
                                    onView={() => setSelectedEvent(event)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
                    {events.map((event, index) => (
                      <OrderEventMobileCard
                        key={event.rowKey ?? `event:${event.id}`}
                        event={event}
                        rowNumber={rowOffset + index + 1}
                        index={index}
                        baseHref={baseHref}
                        onView={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {showTable && totalPages > 1 ? (
              <div className="shrink-0 border-t border-[#e8edf5] px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-xs text-slate-500">
                    Showing {totalEvents === 0 ? 0 : rowOffset + 1} to{" "}
                    {Math.min(
                      rowOffset + ORDERS_TABLE_PAGE_SIZE,
                      totalEvents,
                    )}{" "}
                    of {totalEvents} events
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={loading || fetchingResults || page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={loading || fetchingResults || page >= totalPages}
                      onClick={() =>
                        setPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        )}
      </div>
    </section>
  );
}
