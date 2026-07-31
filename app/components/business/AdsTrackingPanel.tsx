"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, Loader2, RefreshCw, Save } from "lucide-react";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import {
  getFacebookAdPixels,
  type FacebookAdPixel,
} from "@/app/services/facebook/get-facebook-ad-pixels";
import {
  getBusinessTracking,
  saveBusinessTracking,
} from "@/app/services/business/business-tracking";

type AdsTrackingPanelProps = {
  businessId: number;
};

export function AdsTrackingPanel({ businessId }: AdsTrackingPanelProps) {
  const [pixelId, setPixelId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [gtmId, setGtmId] = useState("");

  const [pixels, setPixels] = useState<FacebookAdPixel[]>([]);
  const [pixelsLoading, setPixelsLoading] = useState(false);
  const [pixelsError, setPixelsError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadPixels = useCallback(
    (options?: { keepCurrentIfSet?: boolean; forceRefresh?: boolean }) => {
      let cancelled = false;
      setPixelsLoading(true);
      setPixelsError(null);

      void getFacebookAdPixels(businessId, {
        forceRefresh: options?.forceRefresh,
      })
        .then((loaded) => {
          if (cancelled) return;
          setPixels(loaded);
          if (loaded.length === 0) return;

          setPixelId((prev) => {
            const current = prev.trim();
            if (options?.keepCurrentIfSet && current) return current;
            if (current && loaded.some((p) => p.id === current)) return current;
            if (current) return current;
            return loaded[0]!.id;
          });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setPixels([]);
          setPixelsError(
            err instanceof Error ? err.message : "Could not load Meta pixels.",
          );
        })
        .finally(() => {
          if (!cancelled) setPixelsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    [businessId],
  );

  useEffect(() => {
    let cancelled = false;
    const cleanups: { pixels?: () => void } = {};

    void (async () => {
      let savedPixelId = "";

      try {
        const saved = await getBusinessTracking(businessId);
        if (cancelled) return;

        if (saved?.pixelId?.trim()) {
          savedPixelId = saved.pixelId.trim();
          setPixelId(savedPixelId);
        }
        if (saved?.googleTagManagerId?.trim()) {
          setGtmId(saved.googleTagManagerId.trim());
        }
        if (saved) {
          setIsActive(saved.isActive);
        }
      } catch {
      }

      if (cancelled || savedPixelId) return;

      cleanups.pixels = loadPixels();
      if (cancelled) cleanups.pixels();
    })();

    return () => {
      cancelled = true;
      cleanups.pixels?.();
    };
  }, [businessId, loadPixels]);

  const pixelSelectOptions = useMemo(() => {
    return pixels.map((pixel) => ({
      value: pixel.id,
      label: pixel.name?.trim()
        ? `${pixel.name.trim()} (${pixel.id})`
        : pixel.id,
    }));
  }, [pixels]);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await saveBusinessTracking(businessId, {
        pixelId: pixelId.trim(),
        googleTagManagerId: gtmId.trim(),
        isActive,
      });
      setSaveSuccess("Tracking IDs saved.");
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save tracking IDs.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#f4f8ff]/50 px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1877f2]">
            Ads tracking
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#07111f] sm:text-3xl">
            Connect tracking pixels
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Configure tracking pixel IDs for analytics and conversions. These
            IDs will be used across funnels for this business.
          </p>
        </div>

        <div className="rounded-xl border border-[#dbeafe] bg-[#e8f2ff]/70 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-[#1877f2]" aria-hidden />
            <p>
              Saved Pixel ID loads first. Meta pixels are fetched only when no
              Pixel ID is saved yet. You can still type one manually or use
              Refresh from Meta. Google Tag Manager is optional.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#e8f2ff]">
                <MetaLogo className="size-4" />
              </span>
              <h3 className="text-base font-semibold text-[#07111f]">
                Meta Pixel
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                void loadPixels({
                  keepCurrentIfSet: true,
                  forceRefresh: true,
                });
              }}
              disabled={pixelsLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf5] px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] hover:text-[#1877f2] disabled:opacity-50"
            >
              {pixelsLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              Refresh from Meta
            </button>
          </div>

          {pixelsLoading ? (
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-[#1877f2]" aria-hidden />
              Loading Meta Pixel ID…
            </div>
          ) : null}

          {pixelsError ? (
            <div
              className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              role="alert"
            >
              {pixelsError} You can still enter a Pixel ID manually below.
            </div>
          ) : null}

          {pixelSelectOptions.length > 0 ? (
            <label className="mb-3 block text-sm font-medium text-[#07111f]">
              Pixel from Meta account
              <select
                value={
                  pixelSelectOptions.some((opt) => opt.value === pixelId)
                    ? pixelId
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value) setPixelId(e.target.value);
                }}
                className="mt-1.5 w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#07111f] outline-none focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
              >
                <option value="" disabled>
                  Choose a pixel
                </option>
                {pixelSelectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-medium text-[#07111f]">
            Meta Pixel ID
            <input
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="Meta Pixel ID (optional)"
              className="mt-1.5 w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#07111f] outline-none focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
            />
          </label>
          <p className="mt-1.5 text-xs text-slate-500">
            Filled automatically from Meta when available. You can edit or type
            a different Pixel ID manually. Leave empty if not used.
          </p>

          <label className="mt-4 flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-[#dbeafe] text-[#1877f2]"
            />
            Tracking active
          </label>
        </section>

        <section className="rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#eef6ff]">
              <GoogleAdsLogo className="size-4" />
            </span>
            <h3 className="text-base font-semibold text-[#07111f]">
              Google Tag Manager
            </h3>
          </div>
          <label className="block text-sm font-medium text-[#07111f]">
            Google Tag Manager ID
            <input
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
              placeholder="Google Tag Manager ID (optional)"
              className="mt-1.5 w-full rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#07111f] outline-none focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
            />
          </label>
          <p className="mt-1.5 text-xs text-slate-500">
            Google Tag Manager container ID (e.g., GTM-XXXXX). Optional.
          </p>
        </section>

        {saveError ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {saveError}
          </div>
        ) : null}

        {saveSuccess ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saveSuccess}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            Save Tracking IDs
          </button>
        </div>
      </div>
    </div>
  );
}
