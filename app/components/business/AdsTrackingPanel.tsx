"use client";

/**
 * Change: Ads Tracking screen matches the Connect tracking pixels card UI.
 * Why: Connected vs not-connected should read like the settings mock (badges, accent bar, toggle).
 * Related: business-tracking.ts, ads-tracking pages
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  Save,
  ChartColumn,
  TrendingUp,
} from "lucide-react";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import {
  getFacebookAdPixels,
  type FacebookAdPixel,
} from "@/app/services/facebook/get-facebook-ad-pixels";
import {
  getGoogleTagManagerContainers,
  type GoogleTagManagerContainer,
} from "@/app/services/google-ads/get-google-tag-manager-containers";
import {
  getBusinessTracking,
  saveBusinessTracking,
} from "@/app/services/business/business-tracking";

type AdsTrackingPanelProps = {
  businessId: number;
};

type TrackingFormSnapshot = {
  pixelId: string;
  gtmId: string;
  isActive: boolean;
};

function normalizeTrackingForm(
  pixelId: string,
  gtmId: string,
  isActive: boolean,
): TrackingFormSnapshot {
  return {
    pixelId: pixelId.trim(),
    gtmId: gtmId.trim(),
    isActive,
  };
}

function isSameTrackingForm(
  a: TrackingFormSnapshot,
  b: TrackingFormSnapshot,
): boolean {
  return (
    a.pixelId === b.pixelId &&
    a.gtmId === b.gtmId &&
    a.isActive === b.isActive
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.7rem] font-semibold text-amber-700 ring-1 ring-amber-200">
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
      Not connected
    </span>
  );
}

function TrackingCard({
  accent,
  children,
}: {
  accent: "meta" | "gtm";
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e8edf5] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0">
        <div
          className={`w-1.5 shrink-0 self-stretch rounded-l-2xl ${
            accent === "meta" ? "bg-[#1877f2]" : "bg-amber-400"
          }`}
          aria-hidden
        />
        <div className="min-w-0 flex-1 p-5 sm:p-6">{children}</div>
      </div>
    </section>
  );
}

export function AdsTrackingPanel({ businessId }: AdsTrackingPanelProps) {
  const [pixelId, setPixelId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [gtmId, setGtmId] = useState("");

  const [savedForm, setSavedForm] = useState<TrackingFormSnapshot>(() =>
    normalizeTrackingForm("", "", true),
  );
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  const [pixels, setPixels] = useState<FacebookAdPixel[]>([]);
  const [pixelsLoading, setPixelsLoading] = useState(false);
  const [pixelsError, setPixelsError] = useState<string | null>(null);

  const [gtmContainers, setGtmContainers] = useState<
    GoogleTagManagerContainer[]
  >([]);
  const [gtmLoading, setGtmLoading] = useState(false);
  const [gtmError, setGtmError] = useState<string | null>(null);

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

  const loadGtmContainers = useCallback(
    (options?: { keepCurrentIfSet?: boolean; forceRefresh?: boolean }) => {
      let cancelled = false;
      setGtmLoading(true);
      setGtmError(null);

      void getGoogleTagManagerContainers(businessId, {
        forceRefresh: options?.forceRefresh,
      })
        .then((loaded) => {
          if (cancelled) return;
          setGtmContainers(loaded);
          if (loaded.length === 0) return;

          setGtmId((prev) => {
            const current = prev.trim();
            if (options?.keepCurrentIfSet && current) return current;
            if (current && loaded.some((c) => c.id === current)) return current;
            if (current) return current;
            return loaded[0]!.id;
          });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setGtmContainers([]);
          setGtmError(
            err instanceof Error
              ? err.message
              : "Could not load Google Tag Manager containers.",
          );
        })
        .finally(() => {
          if (!cancelled) setGtmLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    [businessId],
  );

  useEffect(() => {
    let cancelled = false;
    const cleanups: { pixels?: () => void; gtm?: () => void } = {};
    setHasLoadedSaved(false);

    void (async () => {
      let savedPixelId = "";
      let savedGtmId = "";
      let nextPixelId = "";
      let nextGtmId = "";
      let nextIsActive = true;

      try {
        const saved = await getBusinessTracking(businessId);
        if (cancelled) return;

        if (saved?.pixelId?.trim()) {
          savedPixelId = saved.pixelId.trim();
          nextPixelId = savedPixelId;
        }
        if (saved?.googleTagManagerId?.trim()) {
          savedGtmId = saved.googleTagManagerId.trim();
          nextGtmId = savedGtmId;
        }
        if (saved) {
          nextIsActive = saved.isActive;
        }
      } catch {
        // Keep empty defaults when tracking has not been saved yet.
      }

      if (cancelled) return;

      setPixelId(nextPixelId);
      setGtmId(nextGtmId);
      setIsActive(nextIsActive);
      setSavedForm(
        normalizeTrackingForm(nextPixelId, nextGtmId, nextIsActive),
      );
      setHasLoadedSaved(true);

      if (!savedPixelId) {
        cleanups.pixels = loadPixels();
        if (cancelled) cleanups.pixels();
      }
      if (!savedGtmId) {
        cleanups.gtm = loadGtmContainers();
        if (cancelled) cleanups.gtm();
      }
    })();

    return () => {
      cancelled = true;
      cleanups.pixels?.();
      cleanups.gtm?.();
    };
  }, [businessId, loadPixels, loadGtmContainers]);

  const pixelSelectOptions = useMemo(() => {
    return pixels.map((pixel) => ({
      value: pixel.id,
      label: pixel.name?.trim()
        ? `${pixel.name.trim()} (${pixel.id})`
        : pixel.id,
    }));
  }, [pixels]);

  const gtmSelectOptions = useMemo(() => {
    return gtmContainers.map((container) => ({
      value: container.id,
      label: container.name?.trim()
        ? `${container.name.trim()} (${container.id})`
        : container.id,
    }));
  }, [gtmContainers]);

  const currentForm = useMemo(
    () => normalizeTrackingForm(pixelId, gtmId, isActive),
    [pixelId, gtmId, isActive],
  );
  const hasUnsavedChanges =
    hasLoadedSaved && !isSameTrackingForm(currentForm, savedForm);

  const metaConnected = Boolean(pixelId.trim());
  const gtmConnected = Boolean(gtmId.trim());
  const trackingActive = isActive && metaConnected;

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  const handleSave = async () => {
    if (!hasUnsavedChanges || saving) return;

    const payload = normalizeTrackingForm(pixelId, gtmId, isActive);

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await saveBusinessTracking(businessId, {
        pixelId: payload.pixelId,
        googleTagManagerId: payload.gtmId,
        isActive: payload.isActive,
      });
      setSavedForm(payload);
      setSaveSuccess("Tracking IDs saved.");
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save tracking IDs.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-[#e8edf5] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15";
  const refreshBtnClass =
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-white px-3 text-xs font-semibold text-[#1877f2] transition hover:bg-[#eff6ff] disabled:opacity-50";

  return (
    <div className="box-border w-full min-w-0 bg-[#f5f7fb] px-4 py-6 pb-16 sm:px-8 sm:py-8 sm:pb-20">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5">
        <header className="flex min-w-0 items-start gap-3.5">
          <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)]">
            <ChartColumn className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1877f2]">
              Ads tracking
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#07111f] sm:text-[1.75rem]">
              Connect tracking pixels.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Configure tracking pixel IDs for analytics and conversions. These
              IDs will be used across funnels for this business.
            </p>
          </div>
        </header>

        <div className="rounded-xl border border-[#bfdbfe] bg-[#e8f2ff]/80 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-white">
              <Info className="size-3" strokeWidth={2.75} aria-hidden />
            </span>
            <p>
              Saved IDs load first. Meta pixels and Google Tag Manager
              containers are fetched only when that ID is not saved yet. You can
              still type IDs manually or use Refresh. Connect Google Ads in
              Settings first to load GTM containers.
            </p>
          </div>
        </div>

        <TrackingCard accent="meta">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <MetaLogo className="size-6 shrink-0" />
              <h3 className="text-base font-bold text-[#07111f]">Meta Pixel</h3>
              <ConnectionBadge connected={metaConnected} />
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
              className={refreshBtnClass}
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
              className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {pixelsError} You can still enter a Pixel ID manually below.
              </span>
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
                className={`${fieldClass} bg-[#f8fafc]`}
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

          <label className="block text-sm font-semibold text-[#07111f]">
            Meta Pixel ID
            <span className="relative mt-1.5 block">
              <input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="Meta Pixel ID"
                className={`${fieldClass} mt-0 pr-10`}
              />
              {metaConnected ? (
                <CheckCircle2
                  className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-emerald-500"
                  strokeWidth={2.25}
                  aria-hidden
                />
              ) : null}
            </span>
          </label>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Filled automatically from Meta when available. You can edit or type
            a different Pixel ID manually. Leave empty if not used.
          </p>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#eef2f7] pt-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((current) => !current)}
              className="flex items-start gap-3 text-left"
            >
              <span
                className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                  isActive ? "bg-[#1877f2]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`size-5 rounded-full bg-white shadow-sm transition ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
              <span>
                <span className="block text-sm font-bold text-[#07111f]">
                  Tracking active
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Events from this pixel will be tracked across your funnels.
                </span>
              </span>
            </button>

            <div
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                trackingActive
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              <TrendingUp className="size-3.5" aria-hidden />
              {trackingActive ? "Status Active" : "Status Off"}
            </div>
          </div>
        </TrackingCard>

        <TrackingCard accent="gtm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <GoogleAdsLogo className="size-6 shrink-0" />
              <h3 className="text-base font-bold text-[#07111f]">
                Google Tag Manager
              </h3>
              <ConnectionBadge connected={gtmConnected} />
            </div>
            <button
              type="button"
              onClick={() => {
                void loadGtmContainers({
                  keepCurrentIfSet: true,
                  forceRefresh: true,
                });
              }}
              disabled={gtmLoading}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#bfdbfe] hover:bg-[#f8fafc] hover:text-[#1877f2] disabled:opacity-50"
            >
              {gtmLoading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              Refresh from Google
            </button>
          </div>

          {gtmLoading ? (
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-[#1877f2]" aria-hidden />
              Loading Google Tag Manager containers…
            </div>
          ) : null}

          {gtmError ? (
            <div
              className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {gtmError} You can still enter a GTM ID manually below. Connect
                Google Ads in Settings if you want containers listed
                automatically.
              </span>
            </div>
          ) : null}

          {gtmSelectOptions.length > 0 ? (
            <label className="mb-3 block text-sm font-medium text-[#07111f]">
              Container from Google account
              <select
                value={
                  gtmSelectOptions.some((opt) => opt.value === gtmId)
                    ? gtmId
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value) setGtmId(e.target.value);
                }}
                className={`${fieldClass} bg-[#f8fafc]`}
              >
                <option value="" disabled>
                  Choose a container
                </option>
                {gtmSelectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-[#07111f]">
            Google Tag Manager ID (optional)
            <input
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
              placeholder="GTM-XXXXXXX"
              className={fieldClass}
            />
          </label>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Filled automatically from Google when available. You can edit or
            type a different ID manually. Leave empty if not used.
          </p>
        </TrackingCard>

        {saveError ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
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
            disabled={saving || !hasUnsavedChanges}
            onClick={() => {
              void handleSave();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(24,119,242,0.22)] transition hover:bg-[#0f5ed7] disabled:cursor-not-allowed disabled:opacity-50"
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
