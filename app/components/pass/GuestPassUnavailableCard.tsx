"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  QrCode,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import type { GuestPassUnavailableReason } from "@/app/services/redemption/scan-redemption";

type CardVariant = "danger" | "success" | "warning";

const COPY: Record<
  GuestPassUnavailableReason | "default" | "loadFailed",
  {
    title: string;
    subtitle: string;
    message: string;
    hint: string;
    badge: string;
    variant: CardVariant;
  }
> = {
  revoked: {
    badge: "Pass unavailable",
    title: "Oops! Your QR pass has expired",
    subtitle: "This link is no longer valid",
    message:
      "Your QR code was replaced or is no longer active. Check your inbox for a newer pass.",
    hint: "Open your latest email or text message for the updated QR pass.",
    variant: "danger",
  },
  expired: {
    badge: "Pass expired",
    title: "Oops! Your QR pass has expired",
    subtitle: "This offer is past its expiry date",
    message: "This QR code can no longer be scanned at the business.",
    hint: "Contact the business if you believe this is a mistake.",
    variant: "danger",
  },
  redeemed: {
    badge: "Already redeemed",
    title: "This QR pass was already used",
    subtitle: "Your visit was recorded",
    message:
      "This QR code has already been scanned and redeemed. Each pass works only once.",
    hint: "If you need another offer, sign up again or contact the business.",
    variant: "success",
  },
  default: {
    badge: "Pass unavailable",
    title: "Oops! Your QR pass has expired",
    subtitle: "This pass cannot be displayed",
    message: "This QR code is no longer available.",
    hint: "Please contact the business if you need help.",
    variant: "danger",
  },
  loadFailed: {
    badge: "Connection issue",
    title: "Could not load your QR pass",
    subtitle: "Please try again in a moment",
    message: "We couldn't reach the server to load your pass right now.",
    hint: "Refresh the page or check your internet connection, then try again.",
    variant: "warning",
  },
};

const VARIANT_STYLES: Record<
  CardVariant,
  {
    iconWrap: string;
    hintBox: string;
    hintIcon: string;
    hintLabel: string;
  }
> = {
  danger: {
    iconWrap: "bg-red-50 text-red-600 ring-red-100",
    hintBox: "border-red-100 bg-red-50/70",
    hintIcon: "bg-red-600 text-white",
    hintLabel: "text-red-700",
  },
  success: {
    iconWrap: "bg-[#eff6ff] text-[#1877f2] ring-[#bfdbfe]",
    hintBox: "border-[#dbeafe] bg-[#eff6ff]",
    hintIcon: "bg-[#1877f2] text-white",
    hintLabel: "text-[#1877f2]",
  },
  warning: {
    iconWrap: "bg-amber-50 text-amber-700 ring-amber-100",
    hintBox: "border-amber-100 bg-amber-50/70",
    hintIcon: "bg-amber-600 text-white",
    hintLabel: "text-amber-800",
  },
};

function HeaderIcon({ variant }: { variant: CardVariant }) {
  const className = "size-9";
  if (variant === "success") {
    return <CheckCircle2 className={className} aria-hidden strokeWidth={2} />;
  }
  if (variant === "warning") {
    return <WifiOff className={className} aria-hidden strokeWidth={2} />;
  }
  return <AlertTriangle className={className} aria-hidden strokeWidth={2} />;
}

function HintIcon({
  variant,
  reason,
}: {
  variant: CardVariant;
  reason?: GuestPassUnavailableReason | "loadFailed" | null;
}) {
  if (reason === "loadFailed") {
    return <RefreshCw className="size-4" aria-hidden strokeWidth={2.25} />;
  }
  if (variant === "success") {
    return <QrCode className="size-4" aria-hidden strokeWidth={2.25} />;
  }
  return <Mail className="size-4" aria-hidden strokeWidth={2.25} />;
}

export function GuestPassUnavailableCard({
  reason,
}: {
  reason?: GuestPassUnavailableReason | "loadFailed" | null;
}) {
  const copy = COPY[reason ?? "default"] ?? COPY.default;
  const styles = VARIANT_STYLES[copy.variant];

  return (
    <article
      role="alert"
      aria-live="assertive"
      className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
    >
      <div className="bg-[#1877f2] px-6 pb-8 pt-8 text-center text-white sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/85">
          {copy.badge}
        </p>

        <div
          className={`mx-auto mt-4 flex size-[4.5rem] items-center justify-center rounded-2xl ring-1 ${styles.iconWrap}`}
        >
          <HeaderIcon variant={copy.variant} />
        </div>

        <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm font-medium text-white/90">{copy.subtitle}</p>
      </div>

      <div className="bg-[#f8faff] px-6 py-7 sm:px-8">
        <p className="text-center text-[15px] leading-relaxed text-slate-600">
          {copy.message}
        </p>

        <div className={`mt-6 rounded-2xl border bg-white px-4 py-4 ${styles.hintBox}`}>
          <div className="flex items-start gap-3 text-left">
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${styles.hintIcon}`}
            >
              <HintIcon variant={copy.variant} reason={reason} />
            </span>
            <div>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.14em] ${styles.hintLabel}`}
              >
                What to do next
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                {copy.hint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
