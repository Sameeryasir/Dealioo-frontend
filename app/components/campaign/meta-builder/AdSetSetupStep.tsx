"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdSetStepData,
  CampaignStepData,
  MetaAdSetBudgetType,
  MetaBillingEvent,
  MetaCampaignStatus,
  MetaGender,
  MetaOptimizationGoal,
} from "@/app/lib/meta-campaign-builder-types";
import {
  addDaysToIsoDate,
  buildTimezoneSelectOptions,
  defaultEndDateIso,
  defaultStartDateIso,
  defaultStartTimeLocal,
  detectTimezone,
  END_DATE_DURATION_OPTIONS,
  formatTimezoneOptionLabel,
  joinCsv,
  OPTIMIZATION_GOALS_BY_OBJECTIVE,
  splitCsv,
  timezoneAbbreviation,
  timezoneGmtOffset,
} from "@/app/lib/meta-adset-builder-helpers";
import {
  buildLocationsFromAudience,
  deriveLegacyAudienceFields,
} from "@/app/lib/meta-location-targeting";
import { AdSetLocationsBox } from "@/app/components/campaign/meta-builder/AdSetLocationsBox";
import {
  BuilderCard,
  BuilderCollapsible,
  BuilderErrorAlert,
  BuilderField,
  BuilderFooter,
  BuilderPerformanceGoalSelect,
  BuilderSearchableSelect,
  BuilderSelect,
  BuilderStatusToggle,
  BuilderStepHeader,
  builderInputClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import type { AdSetLocationTarget } from "@/app/lib/meta-campaign-builder-types";
import {
  getFacebookAdPixels,
  type FacebookAdPixel,
} from "@/app/services/facebook/get-facebook-ad-pixels";
import {
  DEFAULT_META_ACCOUNT_CURRENCY,
  formatMetaAccountMoney,
  normalizeMetaCurrencyCode,
} from "@/app/lib/meta-account-currency";

const CONVERSION_EVENT_OPTIONS = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "LEAD", label: "Lead" },
  { value: "COMPLETE_REGISTRATION", label: "Complete registration" },
  { value: "ADD_TO_CART", label: "Add to cart" },
  { value: "INITIATED_CHECKOUT", label: "Initiate checkout" },
  { value: "ADD_PAYMENT_INFO", label: "Add payment info" },
  { value: "VIEW_CONTENT", label: "View content" },
  { value: "SEARCH", label: "Search" },
  { value: "CONTACT", label: "Contact" },
  { value: "SUBSCRIBE", label: "Subscribe" },
] as const;

const CONVERSION_LOCATION_OPTIONS = [
  { value: "WEBSITE", label: "Website" },
] as const;

const DEFAULT_PLACEMENTS: AdSetStepData["placements"] = {
  advantagePlusPlacements: false,
  devicePlatforms: { mobile: true, desktop: true },
  publisherPlatforms: {
    facebook: true,
    instagram: true,
    audienceNetwork: false,
    messenger: false,
  },
  facebookPositions: {
    feed: true,
    story: true,
    reels: true,
    marketplace: false,
    videoFeeds: false,
    rightHandColumn: false,
  },
  instagramPositions: {
    stream: true,
    story: true,
    reels: true,
    explore: false,
  },
};

type AdSetSetupStepProps = {
  businessId: number;
  draftId: string;
  campaignData: CampaignStepData;
  initialData?: AdSetStepData | null;
  accountCurrency?: string;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onPrevious: () => void;
  onSave: (data: Omit<AdSetStepData, "startDateTime" | "endDateTime" | "dailyBudgetMinor" | "lifetimeBudgetMinor">) => void | Promise<void>;
};

export function AdSetSetupStep({
  businessId,
  draftId,
  campaignData,
  initialData,
  accountCurrency = DEFAULT_META_ACCOUNT_CURRENCY,
  saving,
  error,
  onBack,
  onPrevious,
  onSave,
}: AdSetSetupStepProps) {
  const currencyCode = normalizeMetaCurrencyCode(accountCurrency);
  const cboEnabled =
    campaignData.budgetStrategy === "campaign" ||
    campaignData.campaignBudgetOptimization;
  const goalOptions = OPTIMIZATION_GOALS_BY_OBJECTIVE[campaignData.objective];

  const [name, setName] = useState(
    initialData?.name ?? `${campaignData.name} Ad Set`,
  );
  const [status, setStatus] = useState<MetaCampaignStatus>(
    initialData?.status ?? "PAUSED",
  );
  const [budgetType, setBudgetType] = useState<MetaAdSetBudgetType>(
    initialData?.budgetType ?? "daily",
  );
  const [dailyBudget, setDailyBudget] = useState(
    initialData?.dailyBudget?.toString() ?? "20",
  );
  const [lifetimeBudget, setLifetimeBudget] = useState(
    initialData?.lifetimeBudget?.toString() ?? "",
  );
  const billingEvent: MetaBillingEvent =
    initialData?.billingEvent ?? "IMPRESSIONS";
  const initialStart = initialData?.startDate ?? defaultStartDateIso();
  const initialEnd = initialData?.endDate ?? addDaysToIsoDate(initialStart, 14);
  const [startDate, setStartDate] = useState(initialStart);
  const [startTime, setStartTime] = useState(
    initialData?.startTime ?? defaultStartTimeLocal(),
  );
  const [hasEndDate, setHasEndDate] = useState(() => {
    if (!initialData) return true;
    return Boolean(initialData.endDate?.trim() && initialData.endTime?.trim());
  });
  const [endDurationDays, setEndDurationDays] = useState<number | "custom">(
    () => {
      if (!initialData?.endDate) return 14;
      const matched = END_DATE_DURATION_OPTIONS.find(
        (option) => addDaysToIsoDate(initialStart, option.days) === initialEnd,
      );
      return matched?.days ?? "custom";
    },
  );
  const [endDate, setEndDate] = useState(initialEnd);
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "23:59");
  const [timezone, setTimezone] = useState(
    initialData?.timezone ?? detectTimezone(),
  );
  const [optimizationGoal, setOptimizationGoal] = useState<MetaOptimizationGoal>(
    () => {
      const fromDraft = initialData?.optimizationGoal;
      if (fromDraft && goalOptions.some((opt) => opt.value === fromDraft)) {
        return fromDraft;
      }
      return goalOptions[0]?.value ?? "LINK_CLICKS";
    },
  );
  const destinationType = "WEBSITE" as const;
  const [pixelId, setPixelId] = useState(initialData?.promotedObject?.pixelId ?? "");
  const [pixels, setPixels] = useState<FacebookAdPixel[]>([]);
  const [pixelsLoading, setPixelsLoading] = useState(false);
  const [pixelsError, setPixelsError] = useState<string | null>(null);
  const [customEventType, setCustomEventType] = useState(
    initialData?.promotedObject?.customEventType ?? "PURCHASE",
  );
  const pageId = initialData?.promotedObject?.pageId ?? "";
  const [locations, setLocations] = useState<AdSetLocationTarget[]>(() =>
    buildLocationsFromAudience(initialData?.audience),
  );
  const [ageMin, setAgeMin] = useState(
    initialData?.audience.ageMin?.toString() ?? "18",
  );
  const [ageMax, setAgeMax] = useState(
    initialData?.audience.ageMax?.toString() ?? "65",
  );
  const [gender, setGender] = useState<MetaGender>(
    initialData?.audience.gender ?? "all",
  );
  const [languages, setLanguages] = useState(
    joinCsv(initialData?.audience.languages),
  );
  const [interests, setInterests] = useState(
    joinCsv(initialData?.audience.interests),
  );
  const [behaviors, setBehaviors] = useState(
    joinCsv(initialData?.audience.behaviors),
  );
  const [demographics, setDemographics] = useState(
    joinCsv(initialData?.audience.demographics),
  );
  const [customAudiences, setCustomAudiences] = useState(
    joinCsv(initialData?.audience.customAudiences),
  );
  const [excludedCustomAudiences, setExcludedCustomAudiences] = useState(
    joinCsv(initialData?.audience.excludedCustomAudiences),
  );
  const [placements, setPlacements] = useState<AdSetStepData["placements"]>(
    initialData?.placements ?? DEFAULT_PLACEMENTS,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inputClass = builderInputClass;

  const timezoneOptions = useMemo(() => {
    const options = buildTimezoneSelectOptions();
    if (options.some((opt) => opt.value === timezone)) return options;
    return [
      { value: timezone, label: formatTimezoneOptionLabel(timezone) },
      ...options,
    ];
  }, [timezone]);

  useEffect(() => {
    if (!goalOptions.some((opt) => opt.value === optimizationGoal)) {
      setOptimizationGoal(goalOptions[0]?.value ?? "LINK_CLICKS");
    }
  }, [goalOptions, optimizationGoal]);

  const needsPromotedObject =
    optimizationGoal === "OFFSITE_CONVERSIONS" || optimizationGoal === "VALUE";

  const savedPixelIdRef = useRef(initialData?.promotedObject?.pixelId?.trim() ?? "");
  savedPixelIdRef.current = initialData?.promotedObject?.pixelId?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    setPixelsLoading(true);
    setPixelsError(null);

    void getFacebookAdPixels(businessId)
      .then((loaded) => {
        if (cancelled) return;
        setPixels(loaded);
        if (loaded.length > 0) {
          setPixelId((prev) => {
            if (prev.trim()) return prev;
            const saved = savedPixelIdRef.current;
            if (saved && loaded.some((p) => p.id === saved)) return saved;
            return loaded[0]!.id;
          });
        }
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
  }, [businessId]);

  const pixelSelectOptions = useMemo(() => {
    const fromMeta = pixels.map((pixel) => ({
      value: pixel.id,
      label: pixel.name?.trim() || pixel.id,
    }));
    if (pixelId.trim() && !fromMeta.some((opt) => opt.value === pixelId)) {
      return [{ value: pixelId, label: `${pixelId} (saved)` }, ...fromMeta];
    }
    return fromMeta;
  }, [pixelId, pixels]);

  const togglePlacement = <
    K extends
      | "devicePlatforms"
      | "publisherPlatforms"
      | "facebookPositions"
      | "instagramPositions",
    F extends keyof AdSetStepData["placements"][K],
  >(
    section: K,
    field: F,
  ) => {
    setPlacements((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setFieldErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldErrors({ name: "Ad set name is required." });
      return;
    }

    const minAge = Number.parseInt(ageMin, 10);
    const maxAge = Number.parseInt(ageMax, 10);
    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge)) {
      setLocalError("Age range is required.");
      return;
    }
    if (minAge > maxAge) {
      setLocalError("Minimum age cannot exceed maximum age.");
      return;
    }

    let daily: number | undefined;
    let lifetime: number | undefined;

    if (!cboEnabled) {
      if (budgetType === "daily") {
        daily = Number.parseFloat(dailyBudget);
        if (!Number.isFinite(daily) || daily < 1) {
          setLocalError(
            `Daily budget must be at least ${formatMetaAccountMoney(1, currencyCode)}.`,
          );
          return;
        }
      } else {
        lifetime = Number.parseFloat(lifetimeBudget);
        if (!Number.isFinite(lifetime) || lifetime < 1) {
          setLocalError(
            `Lifetime budget must be at least ${formatMetaAccountMoney(1, currencyCode)}.`,
          );
          return;
        }
      }
    }

    const includedLocations = locations.filter((loc) => loc.mode === "include");
    if (!includedLocations.length) {
      setLocalError("Add at least one included location.");
      return;
    }

    if (needsPromotedObject) {
      if (!pixelId.trim()) {
        setFieldErrors({ pixelId: "Select a Dataset (Meta Pixel) to track conversions." });
        setLocalError("Select a Dataset (Meta Pixel) before continuing.");
        return;
      }
      if (!customEventType.trim()) {
        setFieldErrors({ customEventType: "Select a conversion event." });
        setLocalError("Select a conversion event before continuing.");
        return;
      }
    }

    const addressWithoutRadius = locations.find(
      (loc) =>
        loc.type === "address" &&
        (loc.latitude == null ||
          loc.longitude == null ||
          loc.radius == null ||
          loc.radius < 1 ||
          loc.radius > 80),
    );
    if (addressWithoutRadius) {
      setLocalError(
        `Set a radius between 1 and 80 for "${addressWithoutRadius.label}".`,
      );
      return;
    }

    const legacyLocation = deriveLegacyAudienceFields(locations);

    if (legacyLocation.city) {
      const radius = legacyLocation.radius ?? 0;
      if (radius < 1 || radius > 80) {
        setLocalError("Address radius must be between 1 and 80.");
        return;
      }
    }

    const usesLifetimeBudget =
      (!cboEnabled && budgetType === "lifetime") ||
      (cboEnabled && campaignData.campaignBudgetType === "lifetime");

    if (usesLifetimeBudget && !hasEndDate) {
      setLocalError(
        "Lifetime budgets require an end date. Turn on “Set an end date” or use a daily budget.",
      );
      return;
    }

    if (hasEndDate) {
      if (!endDate.trim() || !endTime.trim()) {
        setLocalError("End date and time are required when Set an end date is on.");
        return;
      }
    }

    let parsedRadius: number | undefined;
    let city: string | undefined;
    let distanceUnit: AdSetStepData["audience"]["distanceUnit"];
    if (legacyLocation.city) {
      parsedRadius = legacyLocation.radius;
      city = legacyLocation.city;
      distanceUnit = legacyLocation.distanceUnit;
    }

    await onSave({
      name: trimmedName,
      draftId,
      status,
      budgetType: cboEnabled ? undefined : budgetType,
      dailyBudget: daily,
      lifetimeBudget: lifetime,
      bidStrategy:
        campaignData.campaignBidStrategy ??
        initialData?.bidStrategy ??
        "LOWEST_COST_WITHOUT_CAP",
      bidAmount: initialData?.bidAmount,
      billingEvent,
      startDate,
      startTime,
      endDate: hasEndDate ? endDate : undefined,
      endTime: hasEndDate ? endTime : undefined,
      timezone,
      optimizationGoal,
      destinationType,
      promotedObject: needsPromotedObject
        ? {
            pixelId: pixelId.trim(),
            customEventType: customEventType.trim() || "PURCHASE",
            pageId: pageId.trim() || undefined,
          }
        : undefined,
      audience: {
        country: legacyLocation.country,
        city,
        radius: parsedRadius,
        distanceUnit,
        latitude: legacyLocation.latitude,
        longitude: legacyLocation.longitude,
        locations,
        ageMin: minAge,
        ageMax: maxAge,
        gender,
        languages: splitCsv(languages),
        interests: splitCsv(interests),
        behaviors: splitCsv(behaviors),
        demographics: splitCsv(demographics),
        customAudiences: splitCsv(customAudiences),
        excludedCustomAudiences: splitCsv(excludedCustomAudiences),
      },
      placements,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 pb-2">
      <BuilderStepHeader
        step={2}
        title="Ad set setup"
        description="Who sees your ads, when they run, and where they appear. Saved as draft until you publish."
        badge={campaignData.objective.replace("OUTCOME_", "")}
      />

      <BuilderCard title="Basics" description="Name this ad set and choose whether it starts paused or active.">
        <BuilderField label="Ad set name" required error={fieldErrors.name}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={builderInputClass}
            placeholder="e.g. Local diners, lunch hours"
          />
        </BuilderField>
        <BuilderField
          label="Delivery status"
          hint="Paused is recommended so you can review in Ads Manager before spending."
        >
          <BuilderStatusToggle
            value={status}
            onChange={(v) => setStatus(v as MetaCampaignStatus)}
            options={[
              { value: "PAUSED", label: "Paused (recommended)", hint: "Review before going live" },
              { value: "ACTIVE", label: "Active", hint: "Start when published" },
            ]}
          />
        </BuilderField>
      </BuilderCard>

      <BuilderCard title="Conversion">
        <BuilderField
          label="Conversion location"
          hint="Where you want to drive the conversion."
        >
          <BuilderSelect
            aria-label="Conversion location"
            value={destinationType}
            options={[...CONVERSION_LOCATION_OPTIONS]}
            onChange={(_value) => {}}
          />
        </BuilderField>

        <BuilderField
          label="Performance goal"
          hint={
            <>
              {campaignData.objective === "OUTCOME_LEADS"
                ? "Set your goal, such as maximising leads. "
                : "Set your goal, such as maximising conversions or conversion value. "}
              <a
                href="https://www.facebook.com/business/help/410857036421635"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#1877f2] no-underline hover:underline"
              >
                About performance goals
              </a>
            </>
          }
        >
          <BuilderPerformanceGoalSelect
            aria-label="Performance goal"
            value={optimizationGoal}
            options={goalOptions}
            onChange={setOptimizationGoal}
          />
        </BuilderField>

        <BuilderField
          label="Dataset"
          required={needsPromotedObject}
          hint="Track actions that people take on your website."
          error={fieldErrors.pixelId ?? pixelsError ?? undefined}
        >
          {pixelsLoading ? (
            <p className="rounded-xl bg-[#f4f8ff] px-3 py-2.5 text-sm text-slate-500">
              Loading datasets from Meta…
            </p>
          ) : pixelSelectOptions.length > 0 ? (
            <BuilderSelect
              aria-label="Dataset"
              value={
                pixelSelectOptions.some((opt) => opt.value === pixelId)
                  ? pixelId
                  : pixelSelectOptions[0]!.value
              }
              options={pixelSelectOptions}
              onChange={setPixelId}
            />
          ) : (
            <div className="space-y-2">
              {!pixelsError ? (
                <p className="rounded-xl bg-[#fff7ed] px-3 py-2.5 text-xs text-amber-800">
                  No dataset (Meta Pixel) was found on this account.
                  Create one in Meta Events Manager, or paste the Pixel ID
                  below.
                </p>
              ) : null}
              <input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                className={inputClass}
                placeholder="Enter Meta Pixel / Dataset ID"
              />
            </div>
          )}
        </BuilderField>

        <BuilderField
          label="Conversion event"
          required={needsPromotedObject}
          hint={
            <>
              The action that you want people to take when they see your
              ads.{" "}
              <a
                href="https://www.facebook.com/business/help/244599159112157"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#1877f2] no-underline hover:underline"
              >
                About conversion events
              </a>
            </>
          }
          error={fieldErrors.customEventType}
        >
          <BuilderSelect
            aria-label="Conversion event"
            value={
              CONVERSION_EVENT_OPTIONS.some(
                (opt) => opt.value === customEventType,
              )
                ? customEventType
                : "PURCHASE"
            }
            options={[...CONVERSION_EVENT_OPTIONS]}
            onChange={setCustomEventType}
          />
        </BuilderField>
      </BuilderCard>

      <BuilderCard
        title="Budget & bidding"
        description={
          cboEnabled
            ? "This ad set uses the campaign budget you set in Step 1."
            : "Set how much you want to spend on this ad set."
        }
      >
        {cboEnabled ? (
          <div className="rounded-xl bg-[#f4f8ff] px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-[#07111f]">Using campaign budget</p>
            <p className="mt-1">
              {campaignData.campaignBudgetType === "lifetime"
                ? `Lifetime budget: ${formatMetaAccountMoney(campaignData.campaignLifetimeBudget, currencyCode)}`
                : `Daily budget: ${formatMetaAccountMoney(campaignData.campaignDailyBudget, currencyCode)}`}
              {", "}
              Bid strategy:{" "}
              {campaignData.campaignBidStrategy === "LOWEST_COST_WITHOUT_CAP"
                ? "Highest volume"
                : campaignData.campaignBidStrategy}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Set on the Campaign step. This ad set inherits campaign-level budget.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {(["daily", "lifetime"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBudgetType(type)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                    budgetType === type ? "bg-[#1877f2] text-white" : "border border-[#e8edf5]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {budgetType === "daily" ? (
              <label className="block text-sm">
                <span className="font-medium text-[#07111f]">
                  Daily budget ({currencyCode})
                </span>
                <input type="number" min={1} step={1} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} className={inputClass} />
                <p className="mt-1 text-xs text-slate-500">
                  Amounts use your ad account currency ({currencyCode}). Meta
                  receives them in minor units on publish.
                </p>
              </label>
            ) : (
              <label className="block text-sm">
                <span className="font-medium text-[#07111f]">
                  Lifetime budget ({currencyCode})
                </span>
                <input type="number" min={1} step={1} value={lifetimeBudget} onChange={(e) => setLifetimeBudget(e.target.value)} className={inputClass} />
              </label>
            )}
          </>
        )}
      </BuilderCard>

      <BuilderCard title="Schedule" description="When your ad set should start and stop delivering.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-[#07111f]">Start date</span>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => {
                const nextStart = e.target.value;
                setStartDate(nextStart);
                if (hasEndDate && endDurationDays !== "custom") {
                  setEndDate(addDaysToIsoDate(nextStart, endDurationDays));
                }
              }}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#07111f]">Start time</span>
            <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-4">
          <p className="text-sm font-semibold text-[#07111f]">End date</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-[#07111f]">
            <input
              type="checkbox"
              checked={hasEndDate}
              onChange={(e) => {
                const checked = e.target.checked;
                setHasEndDate(checked);
                if (checked && endDurationDays !== "custom") {
                  setEndDate(addDaysToIsoDate(startDate, endDurationDays));
                }
              }}
              className="size-4 rounded border-[#c5d0e0] text-[#1877f2] focus:ring-[#1877f2]/30"
            />
            <span>Set an end date</span>
          </label>

          {hasEndDate ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_1fr]">
              <select
                value={endDurationDays === "custom" ? "custom" : String(endDurationDays)}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "custom") {
                    setEndDurationDays("custom");
                    return;
                  }
                  const days = Number.parseInt(value, 10);
                  setEndDurationDays(days);
                  setEndDate(addDaysToIsoDate(startDate, days));
                }}
                className="rounded-lg border border-[#e8edf5] bg-white px-3 py-2.5 text-sm font-medium text-[#07111f]"
              >
                {END_DATE_DURATION_OPTIONS.map((option) => (
                  <option key={option.days} value={option.days}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <label className="relative block text-sm">
                <span className="sr-only">End date</span>
                <input
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDurationDays("custom");
                    setEndDate(e.target.value);
                  }}
                  className={inputClass}
                />
              </label>
              <label className="relative block text-sm">
                <span className="sr-only">End time</span>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputClass}
                  />
                  <span className="shrink-0 text-xs font-semibold text-slate-500">
                    {(() => {
                      const abbr = timezoneAbbreviation(timezone);
                      const gmt = timezoneGmtOffset(timezone);
                      if (abbr && gmt && abbr !== gmt) return `${abbr} · ${gmt}`;
                      return gmt || abbr || "";
                    })()}
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Your ad set will keep running until you turn it off. No end date
              will be sent to Meta.
            </p>
          )}
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#07111f]">Timezone</span>
          <div className="mt-1">
            <BuilderSearchableSelect
              aria-label="Timezone"
              value={timezone}
              options={timezoneOptions}
              onChange={setTimezone}
              placeholder="Search timezones or GMT…"
              emptyMessage="No timezones match your search."
            />
          </div>
        </label>
      </BuilderCard>

      <BuilderCard
        title="Audience"
        description="Choose who should see your ads. At least one included location is required."
      >
        <AdSetLocationsBox locations={locations} onChange={setLocations} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-[#07111f]">Age min</span>
            <input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#07111f]">Age max</span>
            <input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#07111f]">Gender</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as MetaGender)} className={inputClass}>
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
        </div>
        <BuilderCollapsible
          title="Advanced audience targeting"
          description="Interests, behaviors, and custom audiences, optional."
        >
          <div className="space-y-4">
            <BuilderField label="Languages" hint="Comma-separated, e.g. en, es">
              <input value={languages} onChange={(e) => setLanguages(e.target.value)} className={inputClass} placeholder="en, es" />
            </BuilderField>
            <BuilderField label="Interests" hint="Optional targeting hints for Meta.">
              <input value={interests} onChange={(e) => setInterests(e.target.value)} className={inputClass} />
            </BuilderField>
            <BuilderField label="Behaviors" hint="Optional.">
              <input value={behaviors} onChange={(e) => setBehaviors(e.target.value)} className={inputClass} />
            </BuilderField>
            <BuilderField label="Demographics" hint="Optional.">
              <input value={demographics} onChange={(e) => setDemographics(e.target.value)} className={inputClass} />
            </BuilderField>
            <BuilderField label="Custom audiences" hint="Meta audience IDs, comma-separated.">
              <input value={customAudiences} onChange={(e) => setCustomAudiences(e.target.value)} className={inputClass} />
            </BuilderField>
            <BuilderField label="Excluded custom audiences" hint="People to exclude from this ad set.">
              <input value={excludedCustomAudiences} onChange={(e) => setExcludedCustomAudiences(e.target.value)} className={inputClass} />
            </BuilderField>
          </div>
        </BuilderCollapsible>
      </BuilderCard>

      <BuilderCard
        title="Placements"
        description="Where your ads can appear. Advantage+ lets Meta pick the best placements."
      >
        <label className="flex items-start gap-3 rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/50 px-4 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={placements.advantagePlusPlacements}
            onChange={(e) =>
              setPlacements((prev) => ({
                ...prev,
                advantagePlusPlacements: e.target.checked,
              }))
            }
          />
          <span>
            <span className="font-semibold text-[#07111f]">Advantage+ Placements</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Recommended. Meta automatically shows ads where they perform best.
            </span>
          </span>
        </label>
        {!placements.advantagePlusPlacements ? (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Device platforms</p>
              <div className="flex flex-wrap gap-2">
                {(["mobile", "desktop"] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-[#e8edf5] px-3 py-2 text-sm capitalize">
                    <input type="checkbox" checked={placements.devicePlatforms[key]} onChange={() => togglePlacement("devicePlatforms", key)} />
                    {key}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Publisher platforms</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["facebook", "Facebook"],
                    ["instagram", "Instagram"],
                    ["audienceNetwork", "Audience Network"],
                    ["messenger", "Messenger"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-[#e8edf5] px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(placements.publisherPlatforms[key])}
                      onChange={() => togglePlacement("publisherPlatforms", key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Facebook positions</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["feed", "Feed"],
                    ["story", "Stories"],
                    ["reels", "Reels"],
                    ["marketplace", "Marketplace"],
                    ["videoFeeds", "Video feeds"],
                    ["rightHandColumn", "Right column"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={placements.facebookPositions[key]} onChange={() => togglePlacement("facebookPositions", key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Instagram positions</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["stream", "Feed"],
                    ["story", "Stories"],
                    ["reels", "Reels"],
                    ["explore", "Explore"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={placements.instagramPositions[key]} onChange={() => togglePlacement("instagramPositions", key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </BuilderCard>

      {localError || error ? (
        <BuilderErrorAlert message={localError ?? error ?? ""} />
      ) : null}

      <BuilderFooter
        onBack={onBack}
        secondaryLabel="Back"
        onSecondary={onPrevious}
        primaryLabel={saving ? "Saving draft…" : "Save & continue to Ad"}
        primaryLoading={saving}
        primaryDisabled={saving}
        primaryDisabledReason={saving ? "Saving your ad set draft…" : undefined}
      />
    </form>
  );
}
