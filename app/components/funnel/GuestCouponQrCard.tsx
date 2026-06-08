"use client";

import { CheckCircle2, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getGuestCouponByCustomerAndFunnel,
  getGuestCouponByPayment,
  type GuestCouponResponse,
} from "@/app/services/redemption/scan-redemption";

type GuestCouponQrCardProps =
  | { paymentId: number; customerId?: never; funnelId?: never }
  | { paymentId?: never; customerId: number; funnelId: number };

export function GuestCouponQrCard(props: GuestCouponQrCardProps) {
  const [coupon, setCoupon] = useState<GuestCouponResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch {
        if (cancelled) return;
        if (attempts < 8) {
          window.setTimeout(() => void load(), 1500);
        } else {
          setError("Your QR code is being prepared. Check back shortly.");
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [props.paymentId, props.customerId, props.funnelId]);

  if (loading) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-xl ring-1 ring-zinc-200">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Preparing your QR code…
        </div>
      </div>
    );
  }

  if (error || !coupon?.qr?.qrDataUrl) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xs overflow-hidden rounded-2xl bg-white text-center shadow-2xl ring-1 ring-zinc-200">
        <div className="bg-black px-4 py-3.5 text-white">
          <p className="flex items-center justify-center gap-2 text-sm font-bold">
            <QrCode className="size-4" aria-hidden />
            Your QR Code
          </p>
          <p className="mt-0.5 text-xs text-zinc-300">
            Ready to redeem at the restaurant
          </p>
        </div>
        <div className="p-4">
          <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200/80">
            <img
              src={coupon.qr.qrDataUrl}
              alt="Your redemption QR code"
              className="mx-auto size-44 rounded-lg"
            />
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white ring-1 ring-zinc-800">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Your pass is ready
          </div>
          {coupon.campaignName ? (
            <p className="mt-2 text-xs font-semibold text-zinc-900">
              {coupon.campaignName}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Present this to staff when you arrive.
          </p>
        </div>
      </div>
    </div>
  );
}
