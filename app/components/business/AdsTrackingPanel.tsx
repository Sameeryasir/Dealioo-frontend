"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { BusinessOptionSelect } from "@/app/components/business/BusinessOptionSelect";
import { TrackingPageHeader } from "@/app/components/business/ads-tracking/TrackingPageHeader";
import { TrackingIntegrationCard } from "@/app/components/business/ads-tracking/TrackingIntegrationCard";
import { TrackingInfoSection } from "@/app/components/business/ads-tracking/TrackingInfoSection";
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
  signupConversionLabel: string;
  purchaseConversionLabel: string;
  leadConversionLabel: string;
  isActive: boolean;
};

function normalizeTrackingForm(
  pixelId: string,
  gtmId: string,
  signupConversionLabel: string,
  purchaseConversionLabel: string,
  leadConversionLabel: string,
  isActive: boolean,
): TrackingFormSnapshot {
  return {
    pixelId: pixelId.trim(),
    gtmId: gtmId.trim(),
    signupConversionLabel: signupConversionLabel.trim(),
    purchaseConversionLabel: purchaseConversionLabel.trim(),
    leadConversionLabel: leadConversionLabel.trim(),
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
    a.signupConversionLabel === b.signupConversionLabel &&
    a.purchaseConversionLabel === b.purchaseConversionLabel &&
    a.leadConversionLabel === b.leadConversionLabel &&
    a.isActive === b.isActive
  );
}

export function AdsTrackingPanel({ businessId }: AdsTrackingPanelProps) {
  const [pixelId, setPixelId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [gtmId, setGtmId] = useState("");
  const [signupConversionLabel, setSignupConversionLabel] = useState("");
  const [purchaseConversionLabel, setPurchaseConversionLabel] = useState("");
  const [leadConversionLabel, setLeadConversionLabel] = useState("");

  const [savedForm, setSavedForm] = useState<TrackingFormSnapshot>(() =>
    normalizeTrackingForm("", "", "", "", "", true),
  );
  const [loadedForBusinessId, setLoadedForBusinessId] = useState<number | null>(
    null,
  );
  const hasLoadedSaved = loadedForBusinessId === businessId;

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
      const timer = window.setTimeout(() => {
        if (cancelled) return;
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
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    },
    [businessId],
  );

  const loadGtmContainers = useCallback(
    (options?: { keepCurrentIfSet?: boolean; forceRefresh?: boolean }) => {
      let cancelled = false;
      const timer = window.setTimeout(() => {
        if (cancelled) return;
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
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    },
    [businessId],
  );

  useEffect(() => {
    let cancelled = false;

    const cancelPixels = loadPixels({ keepCurrentIfSet: true });
    const cancelGtm = loadGtmContainers({ keepCurrentIfSet: true });

    void (async () => {
      let nextPixelId = "";
      let nextGtmId = "";
      let nextSignupConversionLabel = "";
      let nextPurchaseConversionLabel = "";
      let nextLeadConversionLabel = "";
      let nextIsActive = true;

      try {
        const saved = await getBusinessTracking(businessId);
        if (cancelled) return;

        if (saved?.pixelId?.trim()) {
          nextPixelId = saved.pixelId.trim();
        }
        if (saved?.googleTagManagerId?.trim()) {
          nextGtmId = saved.googleTagManagerId.trim();
        }
        if (saved?.googleAdsSignupConversionLabel?.trim()) {
          nextSignupConversionLabel = saved.googleAdsSignupConversionLabel.trim();
        }
        if (saved?.googleAdsPurchaseConversionLabel?.trim()) {
          nextPurchaseConversionLabel =
            saved.googleAdsPurchaseConversionLabel.trim();
        }
        if (saved?.googleAdsLeadConversionLabel?.trim()) {
          nextLeadConversionLabel = saved.googleAdsLeadConversionLabel.trim();
        }
        if (saved) {
          nextIsActive = saved.isActive;
        }
      } catch {
      }

      if (cancelled) return;

      if (nextPixelId) setPixelId(nextPixelId);
      if (nextGtmId) setGtmId(nextGtmId);
      setSignupConversionLabel(nextSignupConversionLabel);
      setPurchaseConversionLabel(nextPurchaseConversionLabel);
      setLeadConversionLabel(nextLeadConversionLabel);
      setIsActive(nextIsActive);
      setSavedForm(
        normalizeTrackingForm(
          nextPixelId,
          nextGtmId,
          nextSignupConversionLabel,
          nextPurchaseConversionLabel,
          nextLeadConversionLabel,
          nextIsActive,
        ),
      );
      setLoadedForBusinessId(businessId);
    })();

    return () => {
      cancelled = true;
      cancelPixels();
      cancelGtm();
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
    () =>
      normalizeTrackingForm(
        pixelId,
        gtmId,
        signupConversionLabel,
        purchaseConversionLabel,
        leadConversionLabel,
        isActive,
      ),
    [
      pixelId,
      gtmId,
      signupConversionLabel,
      purchaseConversionLabel,
      leadConversionLabel,
      isActive,
    ],
  );
  const hasUnsavedChanges =
    hasLoadedSaved && !isSameTrackingForm(currentForm, savedForm);

  const metaConnected = Boolean(pixelId.trim());
  const gtmConnected = Boolean(gtmId.trim());

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  const handleSave = async () => {
    if (!hasUnsavedChanges || saving) return;

    const payload = normalizeTrackingForm(
      pixelId,
      gtmId,
      signupConversionLabel,
      purchaseConversionLabel,
      leadConversionLabel,
      isActive,
    );

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await saveBusinessTracking(businessId, {
        pixelId: payload.pixelId,
        googleTagManagerId: payload.gtmId,
        googleAdsSignupConversionLabel: payload.signupConversionLabel,
        googleAdsPurchaseConversionLabel: payload.purchaseConversionLabel,
        googleAdsLeadConversionLabel: payload.leadConversionLabel,
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
    "mt-1.5 w-full rounded-xl border border-[#e8edf5]/80 bg-[#f8fafc]/80 px-3.5 py-2.5 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:border-[#1877f2]/40 focus:bg-white focus:text-[#07111f] focus:ring-2 focus:ring-[#1877f2]/12";
  const selectTriggerClass = `${fieldClass} font-medium text-slate-600`;
  const metaRefreshBtnClass =
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-white px-3 text-xs font-semibold text-[#1877f2] transition hover:bg-[#eff6ff] disabled:opacity-50";
  const googleRefreshBtnClass =
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#bfdbfe] hover:bg-[#f8fafc] hover:text-[#1877f2] disabled:opacity-50";

  return (
    <div className="box-border flex min-h-full w-full min-w-0 flex-col bg-white px-3 py-5 pb-14 sm:px-6 sm:py-7 sm:pb-16 lg:px-8 lg:py-8 lg:pb-20 xl:px-10">
      <div className="mx-auto flex w-full min-w-0 flex-1 flex-col gap-5 sm:gap-6">
        <TrackingPageHeader />

        <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-5 xl:grid-cols-2">
          <TrackingIntegrationCard
            accent="meta"
            logo={<MetaLogo className="size-6 shrink-0" />}
            title="Meta Pixel"
            connected={metaConnected}
            description="Track Meta events and conversions."
            refreshButton={
              <button
                type="button"
                onClick={() => {
                  void loadPixels({
                    keepCurrentIfSet: true,
                    forceRefresh: true,
                  });
                }}
                disabled={pixelsLoading}
                className={metaRefreshBtnClass}
              >
                {pixelsLoading ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )}
                Refresh from Meta
              </button>
            }
            form={
              <>
                {pixelsError ? (
                  <div
                    className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
                    role="alert"
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span>
                      {pixelsError} You can still enter a Pixel ID manually
                      below.
                    </span>
                  </div>
                ) : null}

                {pixelSelectOptions.length > 0 ? (
                  <div className="mb-3 min-w-0">
                    <label
                      htmlFor="ads-tracking-meta-pixel-select"
                      className="block text-sm font-medium text-[#07111f]"
                    >
                      Pixel from Meta account
                    </label>
                    <BusinessOptionSelect
                      id="ads-tracking-meta-pixel-select"
                      value={
                        pixelSelectOptions.some((opt) => opt.value === pixelId)
                          ? pixelId
                          : ""
                      }
                      options={pixelSelectOptions}
                      placeholder="Choose a pixel"
                      ariaLabel="Pixel from Meta account"
                      menuZIndex={140}
                      disabled={pixelsLoading}
                      triggerClassName={selectTriggerClass}
                      onChange={(nextValue) => {
                        if (nextValue) setPixelId(nextValue);
                      }}
                    />
                  </div>
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
                  Filled automatically from Meta when available. You can edit or
                  type a different Pixel ID manually. Leave empty if not used.
                </p>
              </>
            }
          />

          <TrackingIntegrationCard
            accent="google"
            logo={<GoogleAdsLogo className="size-6 shrink-0" />}
            title="Google Ads"
            connected={gtmConnected}
            description="Track Google Ads conversions and performance."
            refreshButton={
              <button
                type="button"
                onClick={() => {
                  void loadGtmContainers({
                    keepCurrentIfSet: true,
                    forceRefresh: true,
                  });
                }}
                disabled={gtmLoading}
                className={googleRefreshBtnClass}
              >
                {gtmLoading ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )}
                Refresh from Google
              </button>
            }
            form={
              <>
                {gtmError ? (
                  <div
                    className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
                    role="alert"
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span>
                      {gtmError} You can still enter a GTM ID manually below.
                      Connect Google Ads in Settings if you want containers
                      listed automatically.
                    </span>
                  </div>
                ) : null}

                {gtmSelectOptions.length > 0 ? (
                  <div className="mb-3 min-w-0">
                    <label
                      htmlFor="ads-tracking-google-tag-select"
                      className="block text-sm font-medium text-[#07111f]"
                    >
                      Tag from Google account
                    </label>
                    <BusinessOptionSelect
                      id="ads-tracking-google-tag-select"
                      value={
                        gtmSelectOptions.some((opt) => opt.value === gtmId)
                          ? gtmId
                          : ""
                      }
                      options={gtmSelectOptions}
                      placeholder="Choose a Google Ads tag"
                      ariaLabel="Tag from Google account"
                      menuZIndex={140}
                      disabled={gtmLoading}
                      triggerClassName={selectTriggerClass}
                      onChange={(nextValue) => {
                        if (nextValue) setGtmId(nextValue);
                      }}
                    />
                  </div>
                ) : null}

                <label className="block text-sm font-semibold text-[#07111f]">
                  Google Ads tag ID
                  <input
                    value={gtmId}
                    onChange={(e) => setGtmId(e.target.value)}
                    placeholder="AW-XXXXXXXXX"
                    className={fieldClass}
                  />
                </label>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  Your Google Ads tag ID (for example AW-18263528050). Use the
                  Ads tag ID here — not a GTM- container ID.
                </p>
              </>
            }
          />
        </div>

        <TrackingInfoSection />

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

        <div className="flex w-full justify-end pt-1">
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
