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
    message: "This QR code can no longer be scanned at the restaurant.",
    hint: "Contact the restaurant if you believe this is a mistake.",
    variant: "danger",
  },
  redeemed: {
    badge: "Already redeemed",
    title: "This QR pass was already used",
    subtitle: "Your visit was recorded",
    message:
      "This QR code has already been scanned and redeemed. Each pass works only once.",
    hint: "If you need another offer, sign up again or contact the restaurant.",
    variant: "success",
  },
  default: {
    badge: "Pass unavailable",
    title: "Oops! Your QR pass has expired",
    subtitle: "This pass cannot be displayed",
    message: "This QR code is no longer available.",
    hint: "Please contact the restaurant if you need help.",
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
    header: string;
    iconWrap: string;
    hintBox: string;
    hintIcon: string;
    hintLabel: string;
  }
> = {
  danger: {
    header: "bg-gradient-to-br from-red-600 via-rose-600 to-red-700",
    iconWrap: "bg-white/15 ring-white/25 text-white",
    hintBox: "border-red-100 bg-red-50/80",
    hintIcon: "bg-red-600 text-white",
    hintLabel: "text-red-700/90",
  },
  success: {
    header: "bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800",
    iconWrap: "bg-white/15 ring-white/25 text-white",
    hintBox: "border-emerald-100 bg-emerald-50/80",
    hintIcon: "bg-emerald-700 text-white",
    hintLabel: "text-emerald-800/80",
  },
  warning: {
    header: "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600",
    iconWrap: "bg-white/15 ring-white/25 text-white",
    hintBox: "border-amber-100 bg-amber-50/80",
    hintIcon: "bg-amber-600 text-white",
    hintLabel: "text-amber-800/90",
  },
};

function HeaderIcon({
  variant,
}: {
  variant: CardVariant;
}) {
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
      className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-900/12 ring-1 ring-zinc-200/90"
    >
      <div className={`relative px-6 pb-8 pt-8 text-center text-white sm:px-8 ${styles.header}`}>
        <div
          className="pointer-events-none absolute -left-8 -top-8 size-36 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -right-6 size-40 rounded-full bg-black/15 blur-2xl"
          aria-hidden
        />

        <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
          {copy.badge}
        </p>

        <div
          className={`relative mx-auto mt-4 flex size-[4.5rem] items-center justify-center rounded-2xl ring-1 ${styles.iconWrap}`}
        >
          <HeaderIcon variant={copy.variant} />
        </div>

        <h1 className="relative mt-5 text-2xl font-bold leading-tight tracking-tight">
          {copy.title}
        </h1>
        <p className="relative mt-2 text-sm font-medium text-white/85">
          {copy.subtitle}
        </p>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <p className="text-center text-[15px] leading-relaxed text-zinc-600">
          {copy.message}
        </p>

        <div className={`mt-6 rounded-2xl border px-4 py-4 ${styles.hintBox}`}>
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
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">
                {copy.hint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
