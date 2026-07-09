"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CircleDollarSign,
  ShieldAlert,
} from "lucide-react";

type PaymentStatus =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "DISPUTED"
  | string;

type CouponStatus = "ACTIVE" | "REDEEMED" | "EXPIRED" | string;

function badgeClass(tone: "success" | "danger" | "warning" | "info") {
  switch (tone) {
    case "success":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100";
    case "danger":
      return "border-red-200/80 bg-red-50 text-red-800 shadow-sm shadow-red-100";
    case "warning":
      return "border-amber-200/80 bg-amber-50 text-amber-900 shadow-sm shadow-amber-100";
    default:
      return "border-blue-200/80 bg-blue-50 text-blue-800 shadow-sm shadow-blue-100";
  }
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "PAID":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("success")}`}
        >
          <BadgeCheck className="size-3.5" aria-hidden />
          PAID
        </span>
      );
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("danger")}`}
        >
          <Ban className="size-3.5" aria-hidden />
          UNPAID
        </span>
      );
    case "FAILED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("danger")}`}
        >
          <Ban className="size-3.5" aria-hidden />
          FAILED
        </span>
      );
    case "REFUNDED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("danger")}`}
        >
          <CircleDollarSign className="size-3.5" aria-hidden />
          REFUNDED
        </span>
      );
    case "DISPUTED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("danger")}`}
        >
          <ShieldAlert className="size-3.5" aria-hidden />
          DISPUTED
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("info")}`}
        >
          {status}
        </span>
      );
  }
}

function CouponBadge({
  status,
  expired,
}: {
  status: CouponStatus;
  expired: boolean;
}) {
  if (expired || status === "EXPIRED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("warning")}`}
      >
        <AlertTriangle className="size-3.5" aria-hidden />
        EXPIRED
      </span>
    );
  }

  if (status === "REDEEMED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("warning")}`}
      >
        <AlertTriangle className="size-3.5" aria-hidden />
        REDEEMED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${badgeClass("info")}`}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      {status}
    </span>
  );
}

export function ScanStatusBadges({
  paymentStatus,
  couponStatus,
  couponExpired,
}: {
  paymentStatus: PaymentStatus;
  couponStatus: CouponStatus;
  couponExpired: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <PaymentBadge status={paymentStatus} />
      <CouponBadge status={couponStatus} expired={couponExpired} />
    </div>
  );
}
