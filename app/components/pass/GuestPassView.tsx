"use client";

import { CheckCircle2, Loader2, QrCode, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { GuestPassUnavailableCard } from "@/app/components/pass/GuestPassUnavailableCard";
import {
  getGuestCouponByCustomerAndFunnel,
  getGuestCouponByPayment,
  type GuestCouponResponse,
} from "@/app/services/redemption/scan-redemption";
import {
  canShowGuestPassQr,
  isGuestPassUnavailable,
  resolveGuestPassUnavailableReason,
} from "@/app/lib/guest-pass-state";
import { formatDateTimeShort } from "@/app/lib/datetime";

type GuestPassViewProps =
  | { paymentId: number; customerId?: never; funnelId?: never }
  | { paymentId?: never; customerId: number; funnelId: number };

export function GuestPassView(props: GuestPassViewProps) {
  const [coupon, setCoupon] = useState<GuestCouponResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      attempts += 1;
      try {
        const data =
          props.paymentId != null
            ? await getGuestCouponByPayment(props.paymentId)
            : await getGuestCouponByCustomerAndFunnel(
                props.customerId,
                props.funnelId,
              );
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
  }, [props.paymentId, props.customerId, props.funnelId]);

  const showUnavailable = isGuestPassUnavailable(coupon);
  const showQr = canShowGuestPassQr(coupon);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8f2ff] via-[#ecfdf5] to-[#fdf2f8] px-4 py-10">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-[#1877f2]/15">
            <div className="bg-[#1877f2] px-6 py-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25">
                <Loader2 className="size-5 animate-spin text-white" aria-hidden />
              </div>
            </div>
            <div className="px-6 py-10 text-center">
              <p className="text-base font-semibold text-[#07111f]">
                Preparing your QR code
              </p>
              <p className="mt-1 text-sm text-zinc-500">This only takes a moment…</p>
            </div>
          </div>
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
          <article className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-[#1877f2]/12 ring-1 ring-[#1877f2]/15">
            <header className="relative flex flex-col items-center overflow-hidden bg-[#1877f2] px-6 py-6 text-center text-white">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.22)_0%,transparent_70%)]"
              />
              <div className="relative mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25">
                <QrCode className="size-5" aria-hidden strokeWidth={2.25} />
              </div>
              <h1 className="relative text-xl font-bold tracking-tight">Your QR Code</h1>
              <p className="relative mt-1 text-sm text-white/90">
                You&apos;re all set, ready to redeem
              </p>
            </header>

            <div className="flex flex-col items-center px-6 py-7">
              {coupon.customerName ? (
                <p className="w-full text-center text-base font-semibold text-[#07111f]">
                  {coupon.customerName}
                </p>
              ) : null}

              {coupon.campaignName ? (
                <div className="mt-2 flex w-full justify-center px-2">
                  <span className="max-w-full truncate rounded-full bg-[#fdf2f8] px-3.5 py-1 text-sm font-medium text-[#f472b6] ring-1 ring-[#f9a8d4]/80">
                    {coupon.campaignName}
                  </span>
                </div>
              ) : null}

              <div className="mt-6 flex justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-[#e8f2ff] via-[#ecfdf5] to-[#fdf2f8] p-4 ring-1 ring-[#1877f2]/15">
                  <img
                    src={coupon.qr.qrDataUrl}
                    alt="Your redemption QR code"
                    className="size-52 rounded-xl sm:size-56"
                  />
                </div>
              </div>

              {coupon.paymentConfirmed ? (
                <div className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-[#ecfdf5] px-3.5 py-1.5 text-xs font-semibold text-[#16a34a] ring-1 ring-[#86efac]/70">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Payment confirmed
                </div>
              ) : null}

              <div className="mt-6 w-full rounded-xl border border-[#1877f2]/12 bg-gradient-to-r from-[#e8f2ff]/80 via-[#ecfdf5]/50 to-[#fdf2f8]/80 px-4 py-3.5">
                <div className="flex items-start justify-center gap-2.5 text-left">
                  <ScanLine
                    className="mt-0.5 size-4 shrink-0 text-[#1877f2]"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-zinc-600">
                    Present this QR code to staff when you arrive. They&apos;ll scan
                    it to unlock your offer.
                  </p>
                </div>
              </div>

              {coupon.expiresAt ? (
                <p className="mt-5 w-full text-center text-xs font-medium text-[#1877f2]/80">
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
