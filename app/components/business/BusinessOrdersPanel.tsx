"use client";

import {
  ArrowUpRight,
  Calendar,
  Check,
  CircleDollarSign,
  Copy,
  Eye,
  Layers,
  Mail,
  Megaphone,
  MoreHorizontal,
  Phone,
  Search,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { OverviewAlertDialog } from "@/app/components/campaign/OverviewAlertDialog";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { Skeleton } from "@/app/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatDateTimeShort, formatRelativeTimeAgo } from "@/app/lib/datetime";
import {
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import { formatDollars } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  getBusinessFunnelEvents,
  RESTAURANT_FUNNEL_EVENTS_PAGE_SIZE,
  type BusinessFunnelEvent,
} from "@/app/services/funnel-event/get-business-registrations";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";

const ORDERS_FETCH_LIMIT = 200;
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

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "not_paid", label: "Not Paid" },
];

const DATE_FILTERS: { id: Exclude<DateFilter, "all">; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

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

  if (event.orderStatus !== "not_paid") {
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

function eventRevenueAmount(event: BusinessFunnelEvent): number {
  if (event.restaurantAmount != null && event.restaurantAmount > 0) {
    return event.restaurantAmount;
  }

  if (event.onlineAmountCents != null && event.onlineAmountCents > 0) {
    return event.onlineAmountCents / 100;
  }

  if (event.amount != null && event.amount > 0) {
    return event.amount / 100;
  }

  return 0;
}

function formatOrderAmountText(
  event: BusinessFunnelEvent,
  status: DisplayPaymentStatus,
): { text: string; muted: boolean } {
  const currency = event.currency ?? "USD";
  const amount = eventRevenueAmount(event);

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

function OrderAmountDisplay({ event }: { event: BusinessFunnelEvent }) {
  const status = resolveDisplayStatus(event);
  const { text, muted } = formatOrderAmountText(event, status);

  return (
    <span className={muted ? "text-slate-400" : "font-semibold text-[#07111f]"}>
      {text}
    </span>
  );
}

function guestInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts[0].charAt(0).toUpperCase();
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

function isThisWeek(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const weekStart = startOfLocalDay(now);
  weekStart.setDate(now.getDate() - now.getDay());
  return date >= weekStart;
}

function isThisMonth(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function matchesDateFilter(iso: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  if (filter === "today") return isToday(iso);
  if (filter === "week") return isThisWeek(iso);
  return isThisMonth(iso);
}

function matchesStatusFilter(
  event: BusinessFunnelEvent,
  filter: StatusFilter,
): boolean {
  if (filter === "all") return true;
  const status = resolveDisplayStatus(event);
  if (filter === "paid") return status === "paid";
  return status === "pending";
}

function matchesCustomerSearch(
  event: BusinessFunnelEvent,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const name = displayName(event).toLowerCase();
  const email = (
    event.customer?.email?.trim() ||
    event.customerEmail?.trim() ||
    ""
  ).toLowerCase();
  const phone = event.customer?.phone?.trim().toLowerCase() ?? "";
  const campaign = event.campaignName.trim().toLowerCase();

  return (
    name.includes(needle) ||
    email.includes(needle) ||
    phone.includes(needle) ||
    campaign.includes(needle)
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 cursor-pointer rounded-full px-2 py-1.5 text-[0.75rem] font-bold transition ${
        active
          ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
          : "bg-[#f4f7fb] text-slate-600 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
      }`}
    >
      {label}
    </button>
  );
}

function OrderEventMobileCard({
  event,
  rowNumber,
  baseHref,
  onView,
}: {
  event: BusinessFunnelEvent;
  rowNumber: number;
  baseHref: string;
  onView: () => void;
}) {
  const name = displayName(event);
  const initial = guestInitial(name);
  const status = resolveDisplayStatus(event);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full cursor-pointer rounded-[1.1rem] border border-[#e8edf5] bg-white p-3.5 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff]/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[0.7rem] font-bold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="m-0 truncate text-[0.88rem] font-bold text-[#07111f]">
              {name}
            </p>
            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
              #{rowNumber} {formatDateTimeShort(event.createdAt)}
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
        <Link
          href={`${baseHref}/campaigns/${event.campaignId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex max-w-[70%] items-center gap-1 truncate rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold text-[#1877f2] no-underline ring-1 ring-[#1877f2]/15"
        >
          <span className="truncate">{event.campaignName}</span>
        </Link>
        <span className="shrink-0 text-[0.82rem] font-bold text-[#07111f]">
          <OrderAmountDisplay event={event} />
        </span>
      </div>
    </button>
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
        <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
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

type JourneyStepState = "complete" | "current" | "pending";

type JourneyStep = {
  id: string;
  label: string;
  state: JourneyStepState;
};

function buildCustomerJourney(event: BusinessFunnelEvent): JourneyStep[] {
  const status = resolveDisplayStatus(event);
  const hasPaid = status === "paid";
  const paymentPending = status === "pending";
  const hasQrRedeemed = event.restaurantVisitedAt != null;

  return [
    { id: "ad", label: "Clicked Ad", state: "complete" },
    { id: "signup", label: "Signed Up", state: "complete" },
    {
      id: "payment",
      label: hasPaid ? "Paid" : "Payment Pending",
      state: hasPaid ? "complete" : paymentPending ? "current" : "pending",
    },
    {
      id: "qr",
      label: "QR Redeemed",
      state: hasQrRedeemed
        ? "complete"
        : hasPaid
          ? "current"
          : "pending",
    },
    { id: "returned", label: "Returned", state: "pending" },
  ];
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
      className="ml-1.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#e8f2ff] hover:text-[#1877f2]"
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="size-3.5" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}

function OrderDetailRow({
  icon: Icon,
  label,
  children,
  copyValue,
  className = "",
}: {
  icon: typeof Megaphone;
  label: string;
  children: ReactNode;
  copyValue?: string | null;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 ${className}`}>
      <dt className="flex shrink-0 items-center gap-1.5 text-[0.82rem] font-bold text-slate-500">
        <Icon className="size-3.5 text-[#1877f2]" strokeWidth={2.25} aria-hidden />
        {label}
      </dt>
      <dd className="m-0 flex min-w-0 max-w-[65%] items-center justify-end gap-0.5 text-right text-[0.88rem] font-bold text-black">
        {children}
        {copyValue ? <CopyValueButton value={copyValue} /> : null}
      </dd>
    </div>
  );
}

function journeyConnectorClass(step: JourneyStep): string {
  if (step.state === "complete") return "bg-[#22c55e]";
  if (step.state === "current") return "bg-[#fdba74]";
  return "bg-slate-200";
}

function getJourneyCurrentStepLabel(steps: JourneyStep[]): string {
  const current = steps.find((step) => step.state === "current");
  if (!current) {
    return steps.every((step) => step.state === "complete")
      ? "Journey complete"
      : "In progress";
  }
  if (current.id === "payment") return "Awaiting payment";
  if (current.id === "qr") return "Awaiting QR redemption";
  if (current.id === "returned") return "Awaiting return visit";
  return current.label;
}

function CustomerJourneySection({
  steps,
  updatedAt,
}: {
  steps: JourneyStep[];
  updatedAt: string;
}) {
  const shortLabel = (step: JourneyStep) => {
    if (step.id === "ad") return "Ad";
    if (step.id === "signup") return "Signup";
    if (step.id === "payment") return step.state === "complete" ? "Paid" : "Pay";
    if (step.id === "qr") return "QR";
    return "Return";
  };

  return (
    <div className="rounded-[0.9rem] border border-[#e8edf5] bg-[#f8fafc]/80 px-3 py-2.5">
      <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        Customer Journey
      </p>
      <div className="mt-2.5 flex items-center">
        {steps.map((step, index) => (
          <Fragment key={step.id}>
            {index > 0 ? (
              <span
                className={`h-0.5 min-w-[0.4rem] flex-1 rounded-full ${journeyConnectorClass(steps[index - 1])}`}
                aria-hidden
              />
            ) : null}
            <div className="flex w-[2.6rem] shrink-0 flex-col items-center gap-1 text-center">
              <span
                className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[0.58rem] font-bold ${
                  step.state === "complete"
                    ? "bg-[#22c55e] text-white"
                    : step.state === "current"
                      ? "bg-[#f97316] text-white"
                      : "border border-slate-200 bg-white text-slate-300"
                }`}
                aria-hidden
              >
                {step.state === "complete" ? "✓" : step.state === "current" ? "!" : "○"}
              </span>
              <span
                className={`truncate text-[0.64rem] font-bold leading-tight ${
                  step.state === "complete"
                    ? "text-[#166534]"
                    : step.state === "current"
                      ? "text-[#c2410c]"
                      : "text-slate-400"
                }`}
              >
                {shortLabel(step)}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <p className="m-0 mt-3.5 pt-1 text-[0.72rem] font-medium leading-relaxed text-slate-500">
        Current step: {getJourneyCurrentStepLabel(steps)} • Last updated{" "}
        {formatRelativeTimeAgo(updatedAt)}
      </p>
    </div>
  );
}

function OrderEventDetailDialog({
  event,
  open,
  onClose,
  baseHref,
}: {
  event: BusinessFunnelEvent | null;
  open: boolean;
  onClose: () => void;
  baseHref: string;
}) {
  if (!open || !event) return null;

  const name = displayName(event);
  const initial = guestInitial(name);
  const status = resolveDisplayStatus(event);
  const email = getCustomerEmail(event);
  const phone = getCustomerPhone(event);
  const journeySteps = buildCustomerJourney(event);
  const campaignLabel = formatTitleCase(event.campaignName);
  const amountDisplay = formatOrderAmountText(event, status);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_24px_48px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.02]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#e8edf5] px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[0.8rem] font-bold text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]">
                {initial}
              </span>
              <div className="min-w-0">
                <h2
                  id="order-detail-title"
                  className="m-0 truncate text-[1rem] font-extrabold tracking-tight text-black"
                >
                  {name}
                </h2>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${orderStatusBadgeClass(status)}`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${orderStatusDotClass(status)}`}
                      aria-hidden
                    />
                    {orderStatusLabel(status)}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-[#f4f7fb] hover:text-black"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="grid gap-2.5 px-4 py-3">
          <CustomerJourneySection
            steps={journeySteps}
            updatedAt={event.createdAt}
          />

          <dl className="m-0 flex flex-col gap-2 rounded-[0.9rem] border border-[#e8edf5] bg-[#f8fafc]/80 px-3.5 py-3">
            <OrderDetailRow icon={Megaphone} label="Campaign">
              <Link
                href={`${baseHref}/campaigns/${event.campaignId}`}
                className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.8rem] font-bold text-[#1877f2] no-underline ring-1 ring-[#1877f2]/15"
              >
                <span className="truncate">{campaignLabel}</span>
              </Link>
            </OrderDetailRow>

            <OrderDetailRow icon={CircleDollarSign} label="Amount">
              <span className={amountDisplay.muted ? "text-slate-400" : "text-black"}>
                {amountDisplay.text}
              </span>
            </OrderDetailRow>

            <OrderDetailRow icon={Calendar} label="Date">
              {formatDateTimeShort(event.createdAt)}
            </OrderDetailRow>

            <OrderDetailRow icon={Mail} label="Email" copyValue={email}>
              <span className={`truncate ${email ? "text-black" : "text-slate-400"}`}>
                {email ?? "None"}
              </span>
            </OrderDetailRow>

            <OrderDetailRow icon={Phone} label="Phone" copyValue={phone}>
              <span className={phone ? "text-black" : "text-slate-400"}>
                {phone ?? "None"}
              </span>
            </OrderDetailRow>
          </dl>
        </div>

        <div className="border-t border-[#e8edf5] px-4 py-3">
          <Link
            href={`${baseHref}/campaigns/${event.campaignId}`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.82rem] font-bold text-white no-underline shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
          >
            View Campaign
            <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
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
  const menuItemCount = event.receiptUrl ? 3 : 2;
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
        <Link
          href={`${baseHref}/campaigns/${event.campaignId}`}
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-2 px-3 py-2 text-[0.8rem] font-semibold text-slate-700 no-underline transition hover:bg-[#f8fbff]"
        >
          <Megaphone className="size-3.5 text-[#1877f2]" aria-hidden />
          Open campaign
        </Link>
        {event.receiptUrl ? (
          <a
            href={event.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-[0.8rem] font-semibold text-slate-700 no-underline transition hover:bg-[#f8fbff]"
          >
            <ArrowUpRight className="size-3.5 text-[#1877f2]" aria-hidden />
            View receipt
          </a>
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

export function BusinessOrdersPanel({
  businessId,
}: {
  businessId: number;
}) {
  const baseHref = `/business/${businessId}/dashboard`;

  const eventsQuery = useQuery({
    queryKey: ["business-orders-events", businessId],
    queryFn: () => getBusinessFunnelEvents(businessId, 1, ORDERS_FETCH_LIMIT),
    enabled: businessId > 0,
  });

  const events = eventsQuery.data?.data ?? [];
  const meta = eventsQuery.data?.meta ?? null;
  const loading = eventsQuery.isLoading;
  const error = eventsQuery.error
    ? getApiErrorMessage(eventsQuery.error, "Could not load funnel events.")
    : null;

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] =
    useState<BusinessFunnelEvent | null>(null);

  const hasActiveFilters =
    statusFilter !== "all" ||
    dateFilter !== "all" ||
    searchQuery.trim().length > 0;

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          matchesStatusFilter(event, statusFilter) &&
          matchesDateFilter(event.createdAt, dateFilter) &&
          matchesCustomerSearch(event, searchQuery),
      ),
    [events, statusFilter, dateFilter, searchQuery],
  );

  const totalFilteredPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / ORDERS_TABLE_PAGE_SIZE),
  );

  const pagedEvents = useMemo(() => {
    const start = (page - 1) * ORDERS_TABLE_PAGE_SIZE;
    return filteredEvents.slice(start, start + ORDERS_TABLE_PAGE_SIZE);
  }, [filteredEvents, page]);

  const rowOffset = (page - 1) * ORDERS_TABLE_PAGE_SIZE;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    if (page > totalFilteredPages) {
      setPage(totalFilteredPages);
    }
  }, [page, totalFilteredPages]);

  useEffect(() => {
    if (loading || !error || alertDismissed) return;
    setAlertMessage(error);
  }, [error, loading, alertDismissed]);

  const showEmpty = !loading && !error && (meta?.total ?? 0) === 0;
  const showNoFilterResults =
    !loading && !error && events.length > 0 && filteredEvents.length === 0;
  const showTable = !loading && !error && pagedEvents.length > 0;

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
        onClose={() => setSelectedEvent(null)}
        baseHref={baseHref}
      />

      <div className="rd-premium-page">
        <header className="shrink-0 px-0.5">
          <h1 className="m-0 text-[clamp(1.15rem,2vw,1.45rem)] font-extrabold tracking-tight text-[#07111f]">
            Orders &amp; Payments
          </h1>
          <p className="m-0 mt-1 max-w-[42ch] text-[0.8rem] font-medium leading-snug text-slate-500">
            Track signups, payments and customer funnel activity.
          </p>
        </header>

        {showEmpty ? (
          <article className={`${ordersCardClass} rd-premium-panel`}>
            <div className="rd-premium-panel__body rd-premium-panel__body--center">
              <OrdersEmptyState
                campaignsHref={`${baseHref}/campaigns`}
                embedded
              />
            </div>
          </article>
        ) : (
          <article className={`${ordersCardClass} rd-premium-panel`}>
            <div
              className="flex shrink-0 flex-col gap-3 px-4 py-3.5 sm:px-5"
              aria-label="Order filters"
            >
              <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex shrink-0 items-center gap-1.5">
                  {STATUS_FILTERS.map((filter) => (
                    <FilterPill
                      key={filter.id}
                      label={filter.label}
                      active={statusFilter === filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                    />
                  ))}
                </div>

                <span
                  className="hidden h-5 w-px shrink-0 bg-[#e8edf5] sm:block"
                  aria-hidden
                />

                <div className="flex shrink-0 items-center gap-1.5">
                  {DATE_FILTERS.map((filter) => (
                    <FilterPill
                      key={filter.id}
                      label={filter.label}
                      active={dateFilter === filter.id}
                      onClick={() =>
                        setDateFilter((prev) =>
                          prev === filter.id ? "all" : filter.id,
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="relative min-w-0">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer or campaign..."
                  className="w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] py-2 pr-4 pl-9 text-[0.82rem] font-medium text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-[1.1rem] font-extrabold tracking-tight text-[#07111f]">
                    Activity
                  </h2>
                  <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                    {hasActiveFilters
                      ? `${filteredEvents.length} matching events`
                      : "Latest signups and payments"}
                  </p>
                </div>
                <span className="rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#1877f2]/15">
                  {hasActiveFilters
                    ? `${filteredEvents.length} shown`
                    : `${meta?.total ?? events.length} total`}
                </span>
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
                <motion.div
                  key={`orders-page-${page}-${statusFilter}-${dateFilter}-${searchQuery}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: standardEase }}
                >
                  <div className="hidden overflow-x-auto overscroll-x-contain md:block">
                    <table className="w-full min-w-[48rem] border-collapse">
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
                              icon={CircleDollarSign}
                              label="Amount"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thClass}>
                            <TableColumnHeader
                              icon={Calendar}
                              label="Date"
                              iconClassName={TABLE_HEAD_ICON_CLASS}
                              labelClassName={TABLE_HEAD_LABEL_CLASS}
                            />
                          </th>
                          <th className={thActionsClass}>
                            Actions
                          </th>
                        </motion.tr>
                      </thead>
                      <motion.tbody
                        variants={tableBodyStagger}
                        initial="hidden"
                        animate="show"
                      >
                        {pagedEvents.map((event, index) => {
                          const rowNumber = rowOffset + index + 1;
                          const name = displayName(event);
                          const initial = guestInitial(name);
                          const status = resolveDisplayStatus(event);

                          return (
                            <motion.tr
                              key={event.id}
                              variants={tableRowReveal}
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
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[0.7rem] font-bold text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]">
                                    {initial}
                                  </span>
                                  <span className="truncate font-semibold text-[#07111f]">
                                    {name}
                                  </span>
                                </div>
                              </td>
                              <td className={tdClass}>
                                <Link
                                  href={`${baseHref}/campaigns/${event.campaignId}`}
                                  title={event.campaignName}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex max-w-[14rem] items-center gap-1 truncate rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.75rem] font-bold text-[#1877f2] no-underline ring-1 ring-[#1877f2]/15 transition hover:bg-[#e8f2ff] hover:ring-[#1877f2]/30"
                                >
                                  <span className="truncate">
                                    {event.campaignName}
                                  </span>
                                  <ArrowUpRight
                                    className="size-3 shrink-0 opacity-70"
                                    strokeWidth={2.5}
                                    aria-hidden
                                  />
                                </Link>
                              </td>
                              <td
                                className={`${tdClass} whitespace-nowrap tabular-nums`}
                              >
                                <OrderAmountDisplay event={event} />
                              </td>
                              <td
                                className={`${tdClass} whitespace-nowrap text-slate-600`}
                              >
                                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                                  <Calendar
                                    className="size-3.5 shrink-0 text-slate-400"
                                    aria-hidden
                                  />
                                  {formatDateTimeShort(event.createdAt)}
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
                            </motion.tr>
                          );
                        })}
                      </motion.tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-2.5 p-3.5 md:hidden">
                    {pagedEvents.map((event, index) => (
                      <OrderEventMobileCard
                        key={event.id}
                        event={event}
                        rowNumber={rowOffset + index + 1}
                        baseHref={baseHref}
                        onView={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </div>

            {showTable && totalFilteredPages > 1 ? (
              <div className="shrink-0 border-t border-[#e8edf5] px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-xs text-slate-500">
                    Showing {filteredEvents.length === 0 ? 0 : rowOffset + 1} to{" "}
                    {Math.min(
                      rowOffset + ORDERS_TABLE_PAGE_SIZE,
                      filteredEvents.length,
                    )}{" "}
                    of {filteredEvents.length} events
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={loading || page <= 1}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="inline-flex cursor-pointer items-center rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
                      Page {page} of {totalFilteredPages}
                    </span>
                    <button
                      type="button"
                      disabled={loading || page >= totalFilteredPages}
                      onClick={() =>
                        setPage((prev) =>
                          Math.min(totalFilteredPages, prev + 1),
                        )
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
