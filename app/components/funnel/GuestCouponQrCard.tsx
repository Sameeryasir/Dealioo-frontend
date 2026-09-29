"use client";

import { Loader2 } from "lucide-react";
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

export function GuestCouponQrCard({ accessToken }: { accessToken: string }) {
  const [coupon, setCoupon] = useState<GuestCouponResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const token = accessToken.trim();
    if (!token) {
      setError("Your QR code is being prepared. Check back shortly.");
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
  }, [accessToken]);

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

  if (error) {
    return null;
  }

  if (coupon && isGuestPassUnavailable(coupon)) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-sm">
          <GuestPassUnavailableCard
            reason={resolveGuestPassUnavailableReason(coupon)}
          />
        </div>
      </div>
    );
  }

  if (!canShowGuestPassQr(coupon)) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xs rounded-2xl bg-white p-4 text-center shadow-2xl ring-1 ring-zinc-200">
        {coupon.campaignName ? (
          <p className="text-sm font-semibold text-zinc-900">
            {coupon.campaignName}
          </p>
        ) : null}
        <img
          src={coupon.qr.qrDataUrl}
          alt="Your redemption QR code"
          className="mx-auto mt-3 size-44 rounded-lg bg-white"
        />
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Show this to staff when you arrive.
        </p>
      </div>
    </div>
  );
}
