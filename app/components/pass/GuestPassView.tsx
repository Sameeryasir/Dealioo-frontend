"use client";

import { CheckCircle2, Loader2, QrCode, ScanLine } from "lucide-react";
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
  const [qrImageReady, setQrImageReady] = useState(false);

  useEffect(() => {
    setQrImageReady(false);
  }, [accessToken, coupon?.qr?.qrDataUrl]);

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
    <main className="flex min-h-screen items-center justify-center bg-[#f8faff] px-4 py-10">
      <div className="w-full max-w-md">
        {loading ? (
          <article
            aria-busy="true"
            aria-live="polite"
            className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <header className="relative flex flex-col items-center bg-[#1877f2] px-5 py-3.5 text-center text-white">
              <div className="relative mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-white/20">
                <Loader2 className="size-4 animate-spin" aria-hidden strokeWidth={2.25} />
              </div>
              <h1 className="relative text-base font-bold tracking-tight sm:text-lg">
                Your QR Code
              </h1>
              <p className="relative mt-0.5 text-xs text-white/90 sm:text-[13px]">
                Preparing your pass…
              </p>
            </header>

            <div className="flex flex-col items-center bg-[#f8faff] px-6 pb-7 pt-5">
              <div className="h-5 w-40 animate-pulse rounded-md bg-slate-200/80" />
              <div className="mt-2 h-7 w-36 animate-pulse rounded-full bg-[#dbeafe]" />

              <div className="mt-6 flex justify-center">
                <div className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-sm">
                  <div className="relative flex size-52 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:size-56">
                    <div
                      className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200/70 to-slate-100"
                      aria-hidden
                    />
                    <QrCode
                      className="relative size-12 text-[#1877f2]/40"
                      aria-hidden
                      strokeWidth={1.5}
                    />
                    <span className="sr-only">Loading QR code image</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full rounded-xl border border-[#e8edf5] bg-white px-4 py-3.5">
                <div className="flex items-start justify-center gap-2.5 text-left">
                  <ScanLine
                    className="mt-0.5 size-4 shrink-0 text-[#1877f2]"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-slate-600">
                    Present this QR code to staff when you arrive. They&apos;ll scan
                    it to unlock your offer.
                  </p>
                </div>
              </div>
            </div>
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
          <article className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <header className="relative flex flex-col items-center bg-[#1877f2] px-5 py-3.5 text-center text-white">
              <div className="relative mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-white/20">
                <QrCode className="size-4" aria-hidden strokeWidth={2.25} />
              </div>
              <h1 className="relative text-base font-bold tracking-tight sm:text-lg">
                Your QR Code
              </h1>
              <p className="relative mt-0.5 text-xs text-white/90 sm:text-[13px]">
                You&apos;re all set, ready to redeem
              </p>
            </header>

            <div className="flex flex-col items-center bg-[#f8faff] px-6 pb-7 pt-5">
              {coupon.customerName ? (
                <p className="w-full text-center text-base font-semibold text-slate-900">
                  {coupon.customerName}
                </p>
              ) : null}

              {coupon.campaignName ? (
                <div className="mt-2 flex w-full justify-center px-2">
                  <span className="max-w-full truncate rounded-full bg-[#eff6ff] px-3.5 py-1 text-sm font-medium text-[#1877f2] ring-1 ring-[#bfdbfe]">
                    {coupon.campaignName}
                  </span>
                </div>
              ) : null}

              <div className="mt-6 flex justify-center">
                <div className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-sm">
                  <div className="relative size-52 overflow-hidden rounded-xl sm:size-56">
                    {!qrImageReady ? (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-slate-100"
                        aria-hidden
                      >
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200/70 to-slate-100" />
                        <QrCode
                          className="relative size-12 text-[#1877f2]/40"
                          strokeWidth={1.5}
                        />
                      </div>
                    ) : null}
                    <img
                      src={coupon.qr.qrDataUrl}
                      alt="Your redemption QR code"
                      className={`size-52 rounded-xl sm:size-56 ${
                        qrImageReady ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setQrImageReady(true)}
                    />
                  </div>
                </div>
              </div>

              {coupon.paymentConfirmed ? (
                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Payment confirmed
                </div>
              ) : null}

              <div className="mt-6 w-full rounded-xl border border-[#e8edf5] bg-white px-4 py-3.5">
                <div className="flex items-start justify-center gap-2.5 text-left">
                  <ScanLine
                    className="mt-0.5 size-4 shrink-0 text-[#1877f2]"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-slate-600">
                    Present this QR code to staff when you arrive. They&apos;ll scan
                    it to unlock your offer.
                  </p>
                </div>
              </div>

              {coupon.expiresAt ? (
                <p className="mt-5 w-full text-center text-xs font-medium text-slate-500">
                  Offer valid until {formatDateTimeShort(coupon.expiresAt)}
                </p>
              ) : null}
            </div>
          </article>
        ) : null}

        {!loading && !loadFailed && coupon && !showUnavailable && !showQr ? (
          <GuestPassUnavailableCard reason="expired" />
        ) : null}
      </div>
    </main>
  );
}
