"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GuestPassUnavailableCard } from "@/app/components/pass/GuestPassUnavailableCard";
import {
  getGuestCouponByAccessToken,
  type GuestCouponResponse,
} from "@/app/services/redemption/scan-redemption";
import {
  canShowGuestPassQr,
  isGuestPassUnavailable,
  resolveGuestPassUnavailableReason,
} from "@/app/lib/guest-pass-state";
import { formatDateTimeShort } from "@/app/lib/datetime";

export function GuestPassView({ accessToken }: { accessToken: string }) {
  const [coupon, setCoupon] = useState<GuestCouponResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const token = accessToken.trim();
    if (!token) {
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      attempts += 1;
      try {
        const data = await getGuestCouponByAccessToken(token);
        if (!cancelled) {
          setCoupon(data);
          setLoading(false);
          setLoadFailed(false);
        }
      } catch {
        if (cancelled) return;
        if (attempts < 4) {
          window.setTimeout(() => void load(), 1200);
          return;
        }
        setLoadFailed(true);
        setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const showUnavailable = isGuestPassUnavailable(coupon);
  const showQr = canShowGuestPassQr(coupon);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 py-10">
      <div className="w-full max-w-sm">
        {loading ? (
          <article
            aria-busy="true"
            aria-live="polite"
            className="rounded-2xl border border-[#e8edf5] bg-white px-6 py-10 text-center shadow-sm"
          >
            <Loader2
              className="mx-auto size-6 animate-spin text-slate-400"
              aria-hidden
            />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Preparing your pass…
            </p>
          </article>
        ) : null}

        {loadFailed ? (
          <GuestPassUnavailableCard reason="loadFailed" />
        ) : null}

        {!loading && !loadFailed && showUnavailable && coupon ? (
          <GuestPassUnavailableCard
            reason={resolveGuestPassUnavailableReason(coupon)}
          />
        ) : null}

        {!loading && !loadFailed && showQr ? (
          <article className="rounded-2xl border border-[#e8edf5] bg-white px-6 py-7 text-center shadow-sm">
            {coupon.customerName ? (
              <p className="text-base font-semibold text-slate-900">
                {coupon.customerName}
              </p>
            ) : null}

            {coupon.campaignName ? (
              <p className="mt-1 text-sm font-medium text-slate-500">
                {coupon.campaignName}
              </p>
            ) : null}

            <div className="mt-5 flex justify-center">
              <img
                src={coupon.qr.qrDataUrl}
                alt="Your redemption QR code"
                className="size-56 rounded-lg bg-white sm:size-60"
              />
            </div>

            {coupon.paymentConfirmed ? (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Payment confirmed
              </div>
            ) : null}

            <p className="mt-5 text-sm leading-relaxed text-slate-600">
              Show this QR code to staff when you arrive.
            </p>

            {coupon.expiresAt ? (
              <p className="mt-4 text-xs font-medium text-slate-500">
                Offer valid until {formatDateTimeShort(coupon.expiresAt)}
              </p>
            ) : null}
          </article>
        ) : null}

        {!loading && !loadFailed && coupon && !showUnavailable && !showQr ? (
          <GuestPassUnavailableCard reason="expired" />
        ) : null}
      </div>
    </main>
  );
}
