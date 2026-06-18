"use client";

import { useMemo, useState } from "react";
import type {
  AdSetStepData,
  CampaignStepData,
  MetaAdSetBudgetType,
  MetaBidStrategy,
  MetaBillingEvent,
  MetaCampaignStatus,
  MetaDestinationType,
  MetaGender,
  MetaOptimizationGoal,
} from "@/app/lib/meta-campaign-builder-types";
import {
  COMMON_TIMEZONES,
  defaultEndDateIso,
  defaultStartDateIso,
  detectTimezone,
  joinCsv,
  OPTIMIZATION_GOALS_BY_OBJECTIVE,
  splitCsv,
} from "@/app/lib/meta-adset-builder-helpers";
import {
  buildLocationsFromAudience,
  deriveLegacyAudienceFields,
} from "@/app/lib/meta-location-targeting";
import { AdSetLocationsBox } from "@/app/components/campaign/meta-builder/AdSetLocationsBox";
import {
  BuilderErrorAlert,
  BuilderFooter,
  BuilderSectionTitle,
  BuilderStepHeader,
  builderInputClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import type { AdSetLocationTarget } from "@/app/lib/meta-campaign-builder-types";

const sectionCardClass =
  "space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]";

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
  draftId: string;
  campaignData: CampaignStepData;
  initialData?: AdSetStepData | null;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onPrevious: () => void;
  onSave: (data: Omit<AdSetStepData, "startDateTime" | "endDateTime" | "dailyBudgetMinor" | "lifetimeBudgetMinor">) => void | Promise<void>;
};

export function AdSetSetupStep({
  draftId,
  campaignData,
  initialData,
  saving,
  error,
  onBack,
  onPrevious,
  onSave,
}: AdSetSetupStepProps) {
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
  const [bidStrategy, setBidStrategy] = useState<MetaBidStrategy>(
    initialData?.bidStrategy ?? "LOWEST_COST_WITHOUT_CAP",
  );
  const [bidAmount, setBidAmount] = useState(
    initialData?.bidAmount?.toString() ?? "",
  );
  const [billingEvent, setBillingEvent] = useState<MetaBillingEvent>(
    initialData?.billingEvent ?? "IMPRESSIONS",
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate ?? defaultStartDateIso(),
  );
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "09:00");
  const [endDate, setEndDate] = useState(
    initialData?.endDate ?? defaultEndDateIso(),
  );
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "23:59");
  const [timezone, setTimezone] = useState(
    initialData?.timezone ?? detectTimezone(),
  );
  const [optimizationGoal, setOptimizationGoal] = useState<MetaOptimizationGoal>(
    initialData?.optimizationGoal ?? goalOptions[0]?.value ?? "LINK_CLICKS",
  );
  const [destinationType, setDestinationType] = useState<MetaDestinationType>(
    initialData?.destinationType ?? "WEBSITE",
  );
  const [pixelId, setPixelId] = useState(initialData?.promotedObject?.pixelId ?? "");
  const [customEventType, setCustomEventType] = useState(
    initialData?.promotedObject?.customEventType ?? "",
  );
  const [pageId, setPageId] = useState(initialData?.promotedObject?.pageId ?? "");
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

  const inputClass = builderInputClass;

  const showBidAmount =
    bidStrategy === "LOWEST_COST_WITH_BID_CAP" || bidStrategy === "COST_CAP";

  const showPromotedObject = useMemo(
    () =>
      optimizationGoal === "OFFSITE_CONVERSIONS" ||
      destinationType !== "WEBSITE",
    [destinationType, optimizationGoal],
  );

  const togglePlacement = <
    K extends keyof AdSetStepData["placements"],
    F extends keyof AdSetStepData["placements"][K],
  >(
    section: K,
    field: F,
  ) => {
    setPlacements((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !(prev[section] as Record<string, boolean>)[field as string],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("Ad set name is required.");
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
          setLocalError("Daily budget must be at least 1.");
          return;
        }
      } else {
        lifetime = Number.parseFloat(lifetimeBudget);
        if (!Number.isFinite(lifetime) || lifetime < 1) {
          setLocalError("Lifetime budget must be at least 1.");
          return;
        }
      }
    }

    let bid: number | undefined;
    if (showBidAmount && bidAmount.trim()) {
      bid = Number.parseFloat(bidAmount);
      if (!Number.isFinite(bid) || bid <= 0) {
        setLocalError("Bid amount must be greater than 0.");
        return;
      }
    }

    const includedLocations = locations.filter((loc) => loc.mode === "include");
    if (!includedLocations.length) {
      setLocalError("Add at least one included location.");
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
      bidStrategy: cboEnabled
        ? (campaignData.campaignBidStrategy ?? "LOWEST_COST_WITHOUT_CAP")
        : bidStrategy,
      bidAmount: bid,
      billingEvent,
      startDate,
      startTime,
      endDate,
      endTime,
      timezone,
      optimizationGoal,
      destinationType,
      promotedObject:
        pixelId.trim() || customEventType.trim() || pageId.trim()
          ? {
              pixelId: pixelId.trim() || undefined,
              customEventType: customEventType.trim() || undefined,
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
        description="Set budget, schedule, audience, and placements. Saved as draft — Meta runs only when you publish."
        badge={campaignData.objective.replace("OUTCOME_", "")}
      />

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Basic</BuilderSectionTitle>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Ad set name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <div className="flex flex-wrap gap-3">
          {(["PAUSED", "ACTIVE"] as const).map((value) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                status === value
                  ? "border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2]"
                  : "border-zinc-200 text-zinc-700"
              }`}
            >
              <input type="radio" name="adset-status" checked={status === value} onChange={() => setStatus(value)} className="sr-only" />
              {value === "PAUSED" ? "Paused (default)" : "Active"}
            </label>
          ))}
        </div>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Budget &amp; bidding</BuilderSectionTitle>
        {cboEnabled ? (
          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Using campaign budget</p>
            <p className="mt-1">
              {campaignData.campaignBudgetType === "lifetime"
                ? `Lifetime budget: $${campaignData.campaignLifetimeBudget?.toFixed(2) ?? "—"}`
                : `Daily budget: $${campaignData.campaignDailyBudget?.toFixed(2) ?? "—"}`}
              {" · "}
              Bid strategy:{" "}
              {campaignData.campaignBidStrategy === "LOWEST_COST_WITHOUT_CAP"
                ? "Highest volume"
                : campaignData.campaignBidStrategy}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
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
                    budgetType === type ? "bg-zinc-900 text-white" : "border border-zinc-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {budgetType === "daily" ? (
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Daily budget</span>
                <input type="number" min={1} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} className={inputClass} />
                <p className="mt-1 text-xs text-zinc-500">$20 → 2000 minor units on publish</p>
              </label>
            ) : (
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Lifetime budget</span>
                <input type="number" min={1} value={lifetimeBudget} onChange={(e) => setLifetimeBudget(e.target.value)} className={inputClass} />
              </label>
            )}
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Bid strategy</span>
              <select value={bidStrategy} onChange={(e) => setBidStrategy(e.target.value as MetaBidStrategy)} className={inputClass}>
                <option value="LOWEST_COST_WITHOUT_CAP">Lowest cost without cap</option>
                <option value="LOWEST_COST_WITH_BID_CAP">Lowest cost with bid cap</option>
                <option value="COST_CAP">Cost cap</option>
              </select>
            </label>
            {showBidAmount ? (
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Bid amount</span>
                <input type="number" min={0.01} step={0.01} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className={inputClass} />
              </label>
            ) : null}
          </>
        )}
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Billing event</span>
          <select value={billingEvent} onChange={(e) => setBillingEvent(e.target.value as MetaBillingEvent)} className={inputClass}>
            <option value="IMPRESSIONS">Impressions</option>
            <option value="LINK_CLICKS">Link clicks</option>
          </select>
        </label>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Schedule</BuilderSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">Start date</span>
            <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">Start time</span>
            <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">End date</span>
            <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">End time</span>
            <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Timezone</span>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </label>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Optimization</BuilderSectionTitle>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Optimization goal</span>
          <select value={optimizationGoal} onChange={(e) => setOptimizationGoal(e.target.value as MetaOptimizationGoal)} className={inputClass}>
            {goalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Destination type</span>
          <select value={destinationType} onChange={(e) => setDestinationType(e.target.value as MetaDestinationType)} className={inputClass}>
            <option value="WEBSITE">Website</option>
            <option value="MESSENGER">Messenger</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="INSTAGRAM_DIRECT">Instagram Direct</option>
          </select>
        </label>
        {showPromotedObject ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Pixel ID</span>
              <input value={pixelId} onChange={(e) => setPixelId(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Custom event</span>
              <input value={customEventType} onChange={(e) => setCustomEventType(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Page ID</span>
              <input value={pageId} onChange={(e) => setPageId(e.target.value)} className={inputClass} />
            </label>
          </div>
        ) : null}
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Audience</BuilderSectionTitle>
        <AdSetLocationsBox locations={locations} onChange={setLocations} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">Age min</span>
            <input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">Age max</span>
            <input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800">Gender</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as MetaGender)} className={inputClass}>
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Languages (optional, comma-separated)</span>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className={inputClass} placeholder="en, es" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Interests (optional)</span>
          <input value={interests} onChange={(e) => setInterests(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Behaviors (optional)</span>
          <input value={behaviors} onChange={(e) => setBehaviors(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Demographics (optional)</span>
          <input value={demographics} onChange={(e) => setDemographics(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Custom audiences (optional)</span>
          <input value={customAudiences} onChange={(e) => setCustomAudiences(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Excluded custom audiences (optional)</span>
          <input value={excludedCustomAudiences} onChange={(e) => setExcludedCustomAudiences(e.target.value)} className={inputClass} />
        </label>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Placements</BuilderSectionTitle>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
          <input
            type="checkbox"
            checked={placements.advantagePlusPlacements}
            onChange={(e) =>
              setPlacements((prev) => ({
                ...prev,
                advantagePlusPlacements: e.target.checked,
              }))
            }
          />
          Advantage+ Placements (Meta auto-optimizes)
        </label>
        {!placements.advantagePlusPlacements ? (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Device platforms</p>
              <div className="flex flex-wrap gap-2">
                {(["mobile", "desktop"] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm capitalize">
                    <input type="checkbox" checked={placements.devicePlatforms[key]} onChange={() => togglePlacement("devicePlatforms", key)} />
                    {key}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Publisher platforms</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["facebook", "Facebook"],
                    ["instagram", "Instagram"],
                    ["audienceNetwork", "Audience Network"],
                    ["messenger", "Messenger"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
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
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Facebook positions</p>
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
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Instagram positions</p>
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
      </section>

      {localError || error ? (
        <BuilderErrorAlert message={localError ?? error ?? ""} />
      ) : null}

      <BuilderFooter
        onBack={onBack}
        secondaryLabel="Back"
        onSecondary={onPrevious}
        primaryLabel={saving ? "Saving draft…" : "Save & continue to Ad / Creative"}
        primaryLoading={saving}
        primaryDisabled={saving}
      />
    </form>
  );
}
