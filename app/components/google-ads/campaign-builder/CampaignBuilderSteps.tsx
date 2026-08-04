"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Flag,
  Globe,
  ImageIcon,
  Layers,
  ListChecks,
  Loader2,
  MapPin,
  Megaphone,
  MousePointerClick,
  Phone,
  Plus,
  Rocket,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  GOOGLE_PUBLISH_PROGRESS_STEPS,
  resolveGooglePublishStepIndex,
} from "@/app/services/google-ads/google-campaign-draft";
import { AdLivePreview } from "@/app/components/google-ads/campaign-builder/AdLivePreview";
import {
  enabledKeywords,
  estimateMetrics,
  generateAdSuggestions,
  generateAudienceFromIdealCustomers,
  generateCallouts,
  generateNegativesFromProducts,
  generateSitelinks,
  generateSnippetValues,
  inferBusinessTypeFromProducts,
  MAX_SITELINKS,
  prefillFromBusinessDescription,
  toSuggestedKeywords,
} from "@/app/components/google-ads/campaign-builder/auto-generate";
import { generateGoogleKeywordsWithAi } from "@/app/services/google-ads/generate-google-keywords";
import { toast } from "sonner";
import {
  BudgetSlider,
  ChipToggleGroup,
  Field,
  Panel,
  SearchableMultiSelect,
  SearchableSelect,
  SelectableCard,
  StepShell,
  ToggleSwitch,
  inputClass,
} from "@/app/components/google-ads/campaign-builder/builder-controls";
import { AdvancedOptions } from "@/app/components/google-ads/campaign-builder/AdvancedOptions";
import { LocationAutocomplete } from "@/app/components/google-ads/campaign-builder/LocationAutocomplete";
import {
  deriveLegacyLocationFields,
  resolveLocationCoordinates,
  type GoogleAdsLocationRef,
  type RadiusUnitId,
} from "@/app/components/google-ads/campaign-builder/location-targeting";

const LocationRadiusMap = dynamic(
  () =>
    import("@/app/components/google-ads/campaign-builder/LocationRadiusMap").then(
      (mod) => mod.LocationRadiusMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f4f8ff] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);
import {
  BUSINESS_CATEGORY_OPTIONS,
  CTA_OPTIONS,
  GOAL_OPTIONS,
  IDEAL_CUSTOMER_OPTIONS,
  LANGUAGE_OPTIONS,
  LEAD_CONTACT_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  TOTAL_WIZARD_STEPS,
  TRAFFIC_ACTION_OPTIONS,
  type CallToActionId,
  type CampaignGoalId,
  type GoogleCampaignBuilderDraft,
  type LeadContactMethodId,
  type SalesChannelId,
  type TrafficActionId,
} from "@/app/components/google-ads/campaign-builder/types";
import {
  DESCRIPTION_MAX,
  HEADLINE_MAX,
  PATH_MAX,
} from "@/app/components/google-ads/campaign-builder/validation";

function formatRadiusLabel(value: number, unit: RadiusUnitId): string {
  const unitLabel = unit === "MILES" ? "miles" : "km";
  return `${value} ${unitLabel} radius`;
}

type StepProps = {
  businessId: number;
  draft: GoogleCampaignBuilderDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
};

const GOAL_ICONS: Record<
  Exclude<CampaignGoalId, "APP_PROMOTION">,
  LucideIcon
> = {
  SALES: ShoppingBag,
  LEADS: Users,
  WEBSITE_TRAFFIC: MousePointerClick,
  AWARENESS: Megaphone,
};

const SALES_CHANNEL_ICONS: Record<SalesChannelId, LucideIcon> = {
  WEBSITE: Globe,
  ONLINE_STORE: ShoppingCart,
  PHYSICAL_STORE: Store,
  PHONE_ORDERS: Phone,
  MULTIPLE: Layers,
};

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs ${over ? "font-semibold text-red-500" : "text-slate-400"}`}>
      {value.length}/{max}
    </span>
  );
}

function MetricTiles({ dailyBudget }: { dailyBudget: number }) {
  const m = estimateMetrics(dailyBudget);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Est. monthly spend", m.monthlySpend],
        ["Est. clicks", m.clicks],
        ["Est. impressions", m.impressions],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-[#e8edf5] bg-white px-4 py-3"
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-bold text-[#07111f]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function RemovableChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbeafe] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold text-[#4285F4]">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="rounded-full p-0.5 transition hover:bg-[#dbeafe]"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}

export function StepGoal({ draft, errors, onChange }: StepProps) {
  return (
    <StepShell
      step={1}
      total={TOTAL_WIZARD_STEPS}
      title="What's your campaign goal?"
      description="Pick one goal. We'll personalize every next screen for you."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_OPTIONS.map((goal) => {
          const Icon =
            GOAL_ICONS[goal.id as Exclude<CampaignGoalId, "APP_PROMOTION">];
          return (
            <SelectableCard
              key={goal.id}
              selected={draft.goal === goal.id}
              title={goal.title}
              description={goal.description}
              icon={<Icon className="size-5" aria-hidden />}
              onClick={() => onChange({ goal: goal.id })}
            />
          );
        })}
      </div>
      {errors.goal ? (
        <p className="text-sm font-medium text-red-500">{errors.goal}</p>
      ) : null}
    </StepShell>
  );
}

export function StepCampaignDetails({ draft, errors, onChange }: StepProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const clearLogo = () => {
    if (draft.logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(draft.logoPreviewUrl);
    }
    onChange({ logoPreviewUrl: "", logoFileName: "" });
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const onLogoSelected = (file: File | undefined) => {
    if (!file) {
      clearLogo();
      return;
    }
    if (draft.logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(draft.logoPreviewUrl);
    }
    onChange({
      logoPreviewUrl: URL.createObjectURL(file),
      logoFileName: file.name,
    });
  };

  const toggleLeadMethod = (id: LeadContactMethodId) => {
    const exists = draft.leadContactMethods.includes(id);
    onChange({
      leadContactMethods: exists
        ? draft.leadContactMethods.filter((m) => m !== id)
        : [...draft.leadContactMethods, id],
    });
  };

  return (
    <StepShell
      step={2}
      total={TOTAL_WIZARD_STEPS}
      title="Tell us about your campaign"
      description="A few basics about your business, plus anything specific to your goal."
    >
      <Panel className="space-y-4">
        <Field
          label="Campaign name"
          required
          hint="Choose a clear name you'll recognize later."
          error={errors.campaignName}
        >
          <input
            className={inputClass(errors.campaignName)}
            value={draft.campaignName}
            onChange={(e) => onChange({ campaignName: e.target.value })}
            placeholder="e.g. Spring sales campaign"
          />
        </Field>
        <Field label="Business name" required error={errors.businessName}>
          <input
            className={inputClass(errors.businessName)}
            value={draft.businessName}
            onChange={(e) =>
              onChange({
                businessName: e.target.value,
                extensionBusinessName:
                  draft.extensionBusinessName || e.target.value,
              })
            }
            placeholder="Acme Coffee"
          />
        </Field>
        <Field label="Website" error={errors.websiteUrl}>
          <input
            className={inputClass(errors.websiteUrl)}
            value={draft.websiteUrl}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            placeholder="https://www.example.com"
          />
        </Field>
        <SearchableSelect
          label="Business category"
          options={BUSINESS_CATEGORY_OPTIONS}
          value={draft.businessCategory}
          onChange={(businessCategory) => onChange({ businessCategory })}
          error={errors.businessCategory}
          placeholder="Search categories"
        />

        <div className="space-y-1.5">
          <div>
            <p className="text-sm font-bold text-[#07111f]">Logo</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Optional — shown in ad previews when you add extensions
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] p-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-center">
            <div className="min-w-0 space-y-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => onLogoSelected(e.target.files?.[0])}
              />

              {draft.logoPreviewUrl ? (
                <>
                  <p className="truncate text-sm font-semibold text-[#07111f]">
                    {draft.logoFileName || "Logo selected"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Looks good — you can change or remove it anytime.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#4285F4]/30 bg-white px-3 py-2 text-sm font-semibold text-[#4285F4] transition hover:bg-[#e8f0fe]"
                    >
                      <Upload className="size-3.5" aria-hidden />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8edf5] bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#07111f]">
                    Upload a square logo
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    PNG or JPG works best. Aim for a clear square image.
                  </p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4285F4] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3367d6]"
                  >
                    <Upload className="size-3.5" aria-hidden />
                    Choose logo
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="relative mx-auto flex size-[120px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#c5d4f0] bg-white shadow-sm transition hover:border-[#4285F4] hover:bg-[#f4f8ff] sm:mx-0 sm:justify-self-end"
              aria-label={draft.logoPreviewUrl ? "Change logo" : "Upload logo"}
            >
              {draft.logoPreviewUrl ? (
                <img
                  src={draft.logoPreviewUrl}
                  alt="Logo preview"
                  className="size-full object-contain p-2"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-slate-400">
                  <ImageIcon className="size-7" aria-hidden />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
                    Preview
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </Panel>

      {draft.goal === "SALES" ? (
        <>
          <Panel className="space-y-3">
            <p className="text-sm font-bold text-[#07111f]">
              How do customers buy from you?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SALES_CHANNEL_OPTIONS.map((option) => {
                const Icon = SALES_CHANNEL_ICONS[option.id];
                return (
                  <SelectableCard
                    key={option.id}
                    selected={draft.salesChannel === option.id}
                    title={option.title}
                    description={option.description}
                    icon={<Icon className="size-5" aria-hidden />}
                    onClick={() => onChange({ salesChannel: option.id })}
                  />
                );
              })}
            </div>
            {errors.salesChannel ? (
              <p className="text-sm font-medium text-red-500">
                {errors.salesChannel}
              </p>
            ) : null}
          </Panel>

          {(draft.salesChannel === "PHYSICAL_STORE" ||
            draft.salesChannel === "MULTIPLE") && (
            <Panel>
              <SearchableSelect
                label="Business location"
                required
                options={[
                  "Downtown",
                  "City Center",
                  "Mall Location",
                  "Suburb",
                  "Airport Area",
                  ...draft.cities,
                ].filter(Boolean)}
                value={draft.businessLocation}
                onChange={(businessLocation) => onChange({ businessLocation })}
                placeholder="Search location type"
                error={errors.businessLocation}
              />
            </Panel>
          )}

          {draft.salesChannel === "PHONE_ORDERS" && (
            <Panel>
              <Field label="Business phone" required error={errors.businessPhone}>
                <input
                  className={inputClass(errors.businessPhone)}
                  value={draft.businessPhone}
                  onChange={(e) =>
                    onChange({
                      businessPhone: e.target.value,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="+1 555 0100"
                />
              </Field>
            </Panel>
          )}
        </>
      ) : null}

      {draft.goal === "LEADS" ? (
        <>
          <Panel className="space-y-3">
            <p className="text-sm font-bold text-[#07111f]">
              How should customers contact you?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {LEAD_CONTACT_OPTIONS.map((option) => {
                const selected = draft.leadContactMethods.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleLeadMethod(option.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      selected
                        ? "border-[#4285F4] bg-[#f4f8ff] ring-1 ring-[#4285F4]"
                        : "border-[#e8edf5] bg-white hover:border-[#4285F4]/40"
                    }`}
                  >
                    <span
                      className={`flex size-5 items-center justify-center rounded border ${
                        selected
                          ? "border-[#4285F4] bg-[#4285F4] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected ? (
                        <Check className="size-3" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="text-sm font-bold text-[#07111f]">
                      {option.title}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.leadContactMethods ? (
              <p className="text-sm font-medium text-red-500">
                {errors.leadContactMethods}
              </p>
            ) : null}
          </Panel>

          {draft.leadContactMethods.includes("CONTACT_FORM") ? (
            <Panel>
              <Field label="Landing page URL" required error={errors.landingPageUrl}>
                <input
                  className={inputClass(errors.landingPageUrl)}
                  value={draft.landingPageUrl || draft.websiteUrl}
                  onChange={(e) =>
                    onChange({
                      landingPageUrl: e.target.value,
                      websiteUrl: draft.websiteUrl || e.target.value,
                    })
                  }
                  placeholder="https://www.example.com/contact"
                />
              </Field>
            </Panel>
          ) : null}

          {draft.leadContactMethods.includes("PHONE_CALLS") ? (
            <Panel>
              <Field label="Business phone" required error={errors.businessPhone}>
                <input
                  className={inputClass(errors.businessPhone)}
                  value={draft.businessPhone}
                  onChange={(e) =>
                    onChange({
                      businessPhone: e.target.value,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="+1 555 0100"
                />
              </Field>
            </Panel>
          ) : null}
        </>
      ) : null}

      {draft.goal === "WEBSITE_TRAFFIC" ? (
        <Panel className="space-y-3">
          <p className="text-sm font-bold text-[#07111f]">
            What should visitors do?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRAFFIC_ACTION_OPTIONS.map((option) => (
              <SelectableCard
                key={option.id}
                selected={draft.trafficAction === option.id}
                title={option.label}
                onClick={() =>
                  onChange({ trafficAction: option.id as TrafficActionId })
                }
              />
            ))}
          </div>
          {errors.trafficAction ? (
            <p className="text-sm font-medium text-red-500">
              {errors.trafficAction}
            </p>
          ) : null}
        </Panel>
      ) : null}

      {draft.goal === "AWARENESS" ? (
        <Panel className="space-y-4">
          <Field label="Business address">
            <input
              className={inputClass()}
              value={draft.businessAddress}
              onChange={(e) => onChange({ businessAddress: e.target.value })}
              placeholder="123 Main Street"
            />
          </Field>
          <Field label="Business phone">
            <input
              className={inputClass()}
              value={draft.businessPhone}
              onChange={(e) =>
                onChange({
                  businessPhone: e.target.value,
                  phoneNumber: e.target.value,
                })
              }
              placeholder="+1 555 0100"
            />
          </Field>
          <SearchableSelect
            label="Business hours"
            options={[
              "Open 24/7",
              "Mon–Fri 9am–5pm",
              "Mon–Sat 10am–8pm",
              "Weekends only",
              "By appointment",
            ]}
            value={draft.businessHours}
            onChange={(businessHours) => onChange({ businessHours })}
            placeholder="Select hours"
          />
        </Panel>
      ) : null}

      {draft.goal === "APP_PROMOTION" ? (
        <Panel>
          <Field label="App name" required error={errors.appName}>
            <input
              className={inputClass(errors.appName)}
              value={draft.appName}
              onChange={(e) => onChange({ appName: e.target.value })}
              placeholder="My App"
            />
          </Field>
        </Panel>
      ) : null}
    </StepShell>
  );
}

export function StepBudget({ draft, errors, onChange }: StepProps) {
  return (
    <StepShell
      step={3}
      total={TOTAL_WIZARD_STEPS}
      title="Set a comfortable daily budget"
      description="No jargon — just how much you're happy to spend each day."
    >
      <BudgetSlider
        value={draft.dailyBudget}
        onChange={(dailyBudget) => onChange({ dailyBudget })}
      />
      {errors.dailyBudget ? (
        <p className="text-sm font-medium text-red-500">{errors.dailyBudget}</p>
      ) : null}
      <MetricTiles dailyBudget={draft.dailyBudget} />
      <Panel className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" hint="Optional">
          <input
            type="date"
            className={inputClass()}
            value={draft.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </Field>
        <Field label="End date" hint="Optional" error={errors.endDate}>
          <input
            type="date"
            className={inputClass(errors.endDate)}
            value={draft.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </Field>
      </Panel>

      <AdvancedOptions draft={draft} onChange={onChange} />
    </StepShell>
  );
}

export function StepLocationsLanguages({ draft, errors, onChange }: StepProps) {
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(
    draft.targetLocations[0]?.id ?? null,
  );

  const activeLocation = useMemo(() => {
    const fromId = draft.targetLocations.find(
      (row) => row.id === activeLocationId,
    );
    if (fromId) return fromId;
    return draft.targetLocations[draft.targetLocations.length - 1] ?? null;
  }, [activeLocationId, draft.targetLocations]);

  const activeCoords = useMemo(
    () => resolveLocationCoordinates(activeLocation),
    [activeLocation],
  );

  const usesRadiusOnMap =
    activeLocation != null &&
    activeLocation.type !== "country" &&
    activeCoords != null;

  const syncRadiusFromLocation = (
    location: GoogleAdsLocationRef | null,
    extras?: Partial<{
      radiusValue: number;
      radiusUnit: RadiusUnitId;
      latitude: number;
      longitude: number;
    }>,
  ) => {
    if (!location) {
      onChange({
        radiusEnabled: false,
        radiusCenter: null,
        radiusTargeting: "",
        presenceOption: "PRESENCE",
      });
      return;
    }

    const coords =
      extras?.latitude != null && extras?.longitude != null
        ? { latitude: extras.latitude, longitude: extras.longitude }
        : resolveLocationCoordinates(location);

    const isPinLocation = location.type !== "country" && coords != null;
    const nextValue = extras?.radiusValue ?? draft.radiusValue;
    const nextUnit = extras?.radiusUnit ?? draft.radiusUnit;
    const nextCenter =
      isPinLocation && coords
        ? { ...location, latitude: coords.latitude, longitude: coords.longitude }
        : null;

    onChange({
      radiusEnabled: Boolean(isPinLocation),
      radiusCenter: nextCenter,
      radiusValue: nextValue,
      radiusUnit: nextUnit,
      radiusLat: coords?.latitude ?? null,
      radiusLng: coords?.longitude ?? null,
      radiusTargeting: isPinLocation
        ? formatRadiusLabel(nextValue, nextUnit)
        : "",
      presenceOption: "PRESENCE",
    });
  };

  const applyTargetLocations = (targetLocations: GoogleAdsLocationRef[]) => {
    const legacy = deriveLegacyLocationFields(targetLocations);
    const nextActive =
      targetLocations.find((row) => row.id === activeLocationId) ??
      targetLocations[targetLocations.length - 1] ??
      null;
    const coords = resolveLocationCoordinates(nextActive);
    const isPinLocation =
      nextActive != null && nextActive.type !== "country" && coords != null;

    setActiveLocationId(nextActive?.id ?? null);
    onChange({
      targetLocations,
      ...legacy,
      presenceOption: "PRESENCE",
      radiusEnabled: Boolean(isPinLocation),
      radiusCenter:
        isPinLocation && nextActive && coords
          ? { ...nextActive, latitude: coords.latitude, longitude: coords.longitude }
          : null,
      radiusLat: coords?.latitude ?? null,
      radiusLng: coords?.longitude ?? null,
      radiusTargeting: isPinLocation
        ? formatRadiusLabel(draft.radiusValue, draft.radiusUnit)
        : "",
    });
    setMapFocusToken((token) => token + 1);
  };

  const activateLocation = (location: GoogleAdsLocationRef) => {
    setActiveLocationId(location.id);
    syncRadiusFromLocation(location);
    setMapFocusToken((token) => token + 1);
  };

  const applyExcludedLocations = (
    excludedLocationTargets: GoogleAdsLocationRef[],
  ) => {
    onChange({
      excludedLocationTargets,
      excludedLocations: excludedLocationTargets.map((row) => row.name),
    });
  };

  const handleMapPinMove = (latitude: number, longitude: number) => {
    if (!activeLocation || activeLocation.type === "country") return;

    const updated: GoogleAdsLocationRef = {
      ...activeLocation,
      latitude,
      longitude,
    };
    const nextTargets = draft.targetLocations.map((row) =>
      row.id === activeLocation.id ? updated : row,
    );

    onChange({
      targetLocations: nextTargets,
      ...deriveLegacyLocationFields(nextTargets),
    });
    syncRadiusFromLocation(updated, { latitude, longitude });
    setMapFocusToken((token) => token + 1);
  };

  const handleMapRadiusChange = (radiusValue: number) => {
    if (!activeLocation || !usesRadiusOnMap) return;
    syncRadiusFromLocation(activeLocation, { radiusValue });
  };

  return (
    <StepShell
      step={4}
      total={TOTAL_WIZARD_STEPS}
      title="Where should your ads show?"
      description="Add the places you want to reach, then choose your languages."
    >
      <Panel className="space-y-4">
        <LocationAutocomplete
          label="Countries, states, or cities"
          required
          values={draft.targetLocations}
          onChange={applyTargetLocations}
          onActivate={activateLocation}
          activeId={activeLocation?.id ?? null}
          placeholder="Search countries, states, cities, postal codes..."
          error={errors.targetLocations}
        />

        {activeLocation && usesRadiusOnMap ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#07111f]">
              Radius around {activeLocation.name}
              <span className="ml-2 font-normal text-slate-400">
                (optional)
              </span>
            </p>

            <LocationRadiusMap
              latitude={activeCoords!.latitude}
              longitude={activeCoords!.longitude}
              radiusValue={draft.radiusValue}
              radiusUnit={draft.radiusUnit}
              showRadius
              countryZoom={false}
              focusToken={mapFocusToken}
              onPinMove={handleMapPinMove}
              onRadiusChange={handleMapRadiusChange}
            />

            <div className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff] p-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                How far around this place should we reach customers?
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={Math.min(80, Math.max(1, draft.radiusValue))}
                  onChange={(e) =>
                    handleMapRadiusChange(Number.parseInt(e.target.value, 10))
                  }
                  className="h-2 min-w-[140px] flex-1 cursor-pointer appearance-none rounded-full bg-[#e8edf5] accent-[#4285F4]"
                  aria-label="Radius slider"
                />
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={draft.radiusValue}
                  onChange={(e) =>
                    handleMapRadiusChange(
                      Math.min(
                        80,
                        Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      ),
                    )
                  }
                  className="w-14 rounded border border-[#e8edf5] bg-white px-2 py-1 text-sm text-[#07111f]"
                  aria-label="Radius value"
                />
                <select
                  value={draft.radiusUnit === "MILES" ? "mile" : "kilometer"}
                  onChange={(e) =>
                    syncRadiusFromLocation(activeLocation, {
                      radiusUnit:
                        e.target.value === "mile" ? "MILES" : "KILOMETERS",
                    })
                  }
                  className="rounded border border-[#e8edf5] bg-white px-2 py-1 text-sm text-[#07111f]"
                  aria-label="Radius unit"
                >
                  <option value="kilometer">km</option>
                  <option value="mile">mi</option>
                </select>
              </div>
              {errors.radiusValue ? (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {errors.radiusValue}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  {draft.radiusValue} {draft.radiusUnit === "MILES" ? "mi" : "km"}{" "}
                  around this place · drag the map pin to adjust
                </p>
              )}
            </div>
          </div>
        ) : activeLocation ? (
          <p className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-3 text-sm text-slate-500">
            {activeLocation.name} is a whole country — no radius needed.
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-3 text-sm text-slate-500">
            Add a location above to start targeting your ads.
          </p>
        )}
      </Panel>

      <Panel className="space-y-4">
        <LocationAutocomplete
          label="Exclude locations"
          values={draft.excludedLocationTargets}
          onChange={applyExcludedLocations}
          placeholder="Search places to exclude..."
          description="Optional — your ads won't show to people here."
        />
      </Panel>

      <Panel>
        <SearchableMultiSelect
          label="Languages"
          required
          options={LANGUAGE_OPTIONS}
          values={draft.languages}
          onChange={(languages) => onChange({ languages })}
          error={errors.languages}
          placeholder="Search any language…"
        />
      </Panel>
    </StepShell>
  );
}

export function StepTargetCustomers({ draft, errors, onChange }: StepProps) {
  const [customText, setCustomText] = useState("");

  const displayOptions = useMemo(() => {
    const base: string[] = [...IDEAL_CUSTOMER_OPTIONS];
    const extras = draft.idealCustomers.filter((item) => !base.includes(item));
    return [...base, ...extras];
  }, [draft.idealCustomers]);

  const applyIdealCustomers = (idealCustomers: string[]) => {
    const audience = generateAudienceFromIdealCustomers(idealCustomers);
    onChange({ idealCustomers, ...audience });
  };

  const addCustom = () => {
    const value = customText.trim();
    if (!value || draft.idealCustomers.includes(value)) return;
    applyIdealCustomers([...draft.idealCustomers, value]);
    setCustomText("");
  };

  return (
    <StepShell
      step={5}
      total={TOTAL_WIZARD_STEPS}
      title="Who are your ideal customers?"
      description="Tap every group that fits your business. You can add your own too."
    >
      <Panel className="space-y-4">
        <ChipToggleGroup
          options={displayOptions}
          values={draft.idealCustomers}
          onChange={applyIdealCustomers}
        />
        {errors.idealCustomers ? (
          <p className="text-sm font-medium text-red-500">
            {errors.idealCustomers}
          </p>
        ) : null}

        <Field label="Add a custom customer type" hint="Optional">
          <div className="flex gap-2">
            <input
              className={inputClass()}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Wedding planners"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              className="inline-flex items-center gap-1 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </Field>
      </Panel>

      <p className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-3 text-sm text-slate-500">
        We'll set audience targeting automatically from your answers.
      </p>
    </StepShell>
  );
}

export function StepProductsServices({
  businessId,
  draft,
  errors,
  onChange,
}: StepProps) {
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);

  const addProducts = (raw: string) => {
    const parts = raw
      .split(/[,|\n]+/)
      .map((part) => part.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    if (parts.length === 0) return;

    const next = [...draft.productsServices];
    for (const part of parts) {
      const exists = next.some(
        (item) => item.toLowerCase() === part.toLowerCase(),
      );
      if (!exists) next.push(part);
    }
    if (next.length === draft.productsServices.length) {
      setText("");
      return;
    }

    onChange({
      productsServices: next,
      businessType: inferBusinessTypeFromProducts(next, draft.businessType),
    });
    setText("");
  };

  const removeProduct = (value: string) => {
    const next = draft.productsServices.filter((item) => item !== value);
    onChange({
      productsServices: next,
      businessType: inferBusinessTypeFromProducts(next, draft.businessType),
      ...(next.length === 0
        ? { suggestedKeywords: [], negativeKeywords: [] }
        : {}),
    });
  };

  const removeNegative = (value: string) => {
    onChange({
      negativeKeywords: draft.negativeKeywords.filter((item) => item !== value),
    });
  };

  const runGenerate = async () => {
    if (draft.productsServices.length === 0 || generating) return;
    setGenerating(true);
    try {
      const result = await generateGoogleKeywordsWithAi(businessId, {
        productsServices: draft.productsServices,
        businessName: draft.businessName || draft.extensionBusinessName,
        businessCategory: draft.businessCategory,
        goal: draft.goal,
        goalLabel:
          GOAL_OPTIONS.find((option) => option.id === draft.goal)?.title ??
          draft.goal ??
          undefined,
        idealCustomers: draft.idealCustomers,
        ageRanges: draft.ageRanges,
        gender: draft.gender,
        interests: draft.interests,
      });
      const keywords = toSuggestedKeywords(result.keywords).slice(0, 7);
      if (keywords.length === 0) {
        toast.error("AI returned no keywords. Try again.");
        return;
      }
      onChange({
        businessType: inferBusinessTypeFromProducts(
          draft.productsServices,
          draft.businessType,
        ),
        suggestedKeywords: keywords,
        negativeKeywords:
          result.negativeKeywords.length > 0
            ? result.negativeKeywords
            : generateNegativesFromProducts(draft.productsServices),
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not generate keywords with AI. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <StepShell
      step={6}
      total={TOTAL_WIZARD_STEPS}
      title="What products or services do you offer?"
      description="List what you sell — we'll turn this into search keywords with AI."
    >
      <Panel className="space-y-3">
        <Field
          label="Products or services"
          required
          hint="Add one or many. Multi-word names are fine (e.g. Air Conditioning Installation). Separate several with commas."
          error={errors.productsServices}
        >
          <div className="flex gap-2">
            <input
              className={inputClass(errors.productsServices)}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Emergency plumbing, HVAC Repair"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addProducts(text);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addProducts(text)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </Field>
        {draft.productsServices.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {draft.productsServices.map((item) => (
              <RemovableChip
                key={item}
                label={item}
                onRemove={() => removeProduct(item)}
              />
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#07111f]">
              Keyword suggestions
            </p>
            <p className="text-xs text-slate-500">
              {enabledKeywords(draft).length} selected
            </p>
          </div>
          <button
            type="button"
            disabled={draft.productsServices.length === 0 || generating}
            onClick={() => void runGenerate()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3367d6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {generating ? "Generating…" : "Generate keywords"}
          </button>
        </div>

        {draft.suggestedKeywords.length > 0 ? (
          <div className="space-y-2">
            {draft.suggestedKeywords.map((keyword) => (
              <div
                key={keyword.id}
                className="flex items-center gap-3 rounded-xl border border-[#e8edf5] px-3 py-2.5"
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={keyword.enabled}
                  onClick={() =>
                    onChange({
                      suggestedKeywords: draft.suggestedKeywords.map((k) =>
                        k.id === keyword.id ? { ...k, enabled: !k.enabled } : k,
                      ),
                    })
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    keyword.enabled ? "bg-[#4285F4]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${
                      keyword.enabled ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
                <span
                  className={`min-w-0 flex-1 text-sm font-semibold ${
                    keyword.enabled
                      ? "text-[#07111f]"
                      : "text-slate-400 line-through"
                  }`}
                >
                  {keyword.text}
                </span>
                <button
                  type="button"
                  aria-label="Remove keyword"
                  onClick={() =>
                    onChange({
                      suggestedKeywords: draft.suggestedKeywords.filter(
                        (k) => k.id !== keyword.id,
                      ),
                    })
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Add a product or service above, then generate suggestions.
          </p>
        )}
        {errors.keywords ? (
          <p className="text-xs font-medium text-red-500">{errors.keywords}</p>
        ) : null}
      </Panel>

      {draft.negativeKeywords.length > 0 ? (
        <Panel className="space-y-3">
          <p className="text-sm font-bold text-[#07111f]">Searches to avoid</p>
          <div className="flex flex-wrap gap-2">
            {draft.negativeKeywords.map((word) => (
              <RemovableChip
                key={word}
                label={word}
                onRemove={() => removeNegative(word)}
              />
            ))}
          </div>
        </Panel>
      ) : null}
    </StepShell>
  );
}

export function StepAds({ draft, errors, onChange }: StepProps) {
  const [showPaths, setShowPaths] = useState(false);

  useEffect(() => {
    if (!draft.adsGenerated) {
      onChange({
        ads: [generateAdSuggestions(draft)],
        adsGenerated: true,
      });
    }
  }, [draft, draft.adsGenerated, onChange]);

  const ad = draft.ads[0];
  if (!ad) return null;

  const updateAd = (patch: Partial<typeof ad>) => {
    onChange({ ads: [{ ...ad, ...patch }] });
  };

  return (
    <StepShell
      step={7}
      total={TOTAL_WIZARD_STEPS}
      title="Write your ad"
      description="We drafted headlines and descriptions for you. Edit anything before moving on."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="space-y-4">
          <button
            type="button"
            onClick={() =>
              onChange({
                ads: [generateAdSuggestions(draft)],
                adsGenerated: true,
              })
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#1a73e8] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(66,133,244,0.28)] transition hover:brightness-105"
          >
            <Sparkles className="size-4" aria-hidden />
            Generate with AI
          </button>

          <Field label="Final URL" required error={errors.finalUrl}>
            <input
              className={inputClass(errors.finalUrl)}
              value={ad.finalUrl}
              onChange={(e) => updateAd({ finalUrl: e.target.value })}
            />
          </Field>

          <div className="space-y-2">
            <p className="text-sm font-bold text-[#07111f]">Headlines</p>
            {errors.headlines ? (
              <p className="text-xs font-medium text-red-500">{errors.headlines}</p>
            ) : null}
            {ad.headlines.map((headline, index) => (
              <div key={`h-${index}`} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Headline {index + 1}
                  </span>
                  <CharCount value={headline} max={HEADLINE_MAX} />
                </div>
                <input
                  className={inputClass()}
                  value={headline}
                  maxLength={HEADLINE_MAX}
                  onChange={(e) => {
                    const headlines = [...ad.headlines];
                    headlines[index] = e.target.value;
                    updateAd({ headlines });
                  }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-[#07111f]">Descriptions</p>
            {errors.descriptions ? (
              <p className="text-xs font-medium text-red-500">
                {errors.descriptions}
              </p>
            ) : null}
            {ad.descriptions.map((description, index) => (
              <div key={`d-${index}`} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Description {index + 1}
                  </span>
                  <CharCount value={description} max={DESCRIPTION_MAX} />
                </div>
                <textarea
                  className={`${inputClass()} min-h-[72px]`}
                  value={description}
                  maxLength={DESCRIPTION_MAX}
                  onChange={(e) => {
                    const descriptions = [...ad.descriptions];
                    descriptions[index] = e.target.value;
                    updateAd({ descriptions });
                  }}
                />
              </div>
            ))}
          </div>

          <Field label="Call to action">
            <select
              className={inputClass()}
              value={ad.callToAction}
              onChange={(e) =>
                updateAd({ callToAction: e.target.value as CallToActionId })
              }
            >
              {CTA_OPTIONS.map((cta) => (
                <option key={cta.id} value={cta.id}>
                  {cta.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-xl border border-[#e8edf5]">
            <button
              type="button"
              onClick={() => setShowPaths((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={showPaths}
            >
              <span className="text-sm font-bold text-[#07111f]">
                Display paths
                <span className="ml-1.5 font-normal text-slate-400">
                  (optional)
                </span>
              </span>
              <ChevronDown
                className={`size-4 text-slate-500 transition ${
                  showPaths ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
            {showPaths ? (
              <div className="grid gap-3 border-t border-[#e8edf5] p-4 sm:grid-cols-2">
                <Field label="Display path 1">
                  <div className="space-y-1">
                    <div className="flex justify-end">
                      <CharCount value={ad.path1} max={PATH_MAX} />
                    </div>
                    <input
                      className={inputClass()}
                      value={ad.path1}
                      maxLength={PATH_MAX}
                      onChange={(e) => updateAd({ path1: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Display path 2">
                  <div className="space-y-1">
                    <div className="flex justify-end">
                      <CharCount value={ad.path2} max={PATH_MAX} />
                    </div>
                    <input
                      className={inputClass()}
                      value={ad.path2}
                      maxLength={PATH_MAX}
                      onChange={(e) => updateAd({ path2: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <AdLivePreview ad={ad} businessName={draft.businessName} />
        </div>
      </div>
    </StepShell>
  );
}

export function StepBusinessDetails({ draft, onChange }: StepProps) {
  useEffect(() => {
    if (draft.assetsGenerated) return;
    const type =
      draft.businessType ||
      inferBusinessTypeFromProducts(draft.productsServices, "Local Business");

    onChange({
      extensionBusinessName: draft.extensionBusinessName || draft.businessName,
      phoneNumber: draft.phoneNumber || draft.businessPhone,
      callouts: generateCallouts(type),
      structuredSnippetHeader: draft.structuredSnippetHeader || "Services",
      structuredSnippetValues: generateSnippetValues(type),
      sitelinks: generateSitelinks(draft.websiteUrl, type),
      assetsGenerated: true,
    });
  }, [draft, draft.assetsGenerated, onChange]);

  return (
    <StepShell
      step={8}
      total={TOTAL_WIZARD_STEPS}
      title="A few more business details"
      description="We'll add callouts, sitelinks, and other ad extras automatically."
    >
      <Panel className="space-y-4">
        <Field label="Phone number">
          <input
            className={inputClass()}
            value={draft.phoneNumber}
            onChange={(e) =>
              onChange({
                phoneNumber: e.target.value,
                businessPhone: e.target.value,
              })
            }
            placeholder="+1 555 0100"
          />
        </Field>
        <Field label="Business address">
          <input
            className={inputClass()}
            value={draft.businessAddress}
            onChange={(e) => onChange({ businessAddress: e.target.value })}
            placeholder="123 Main Street"
          />
        </Field>
        <SearchableSelect
          label="Business hours"
          options={[
            "Open 24/7",
            "Mon–Fri 9am–5pm",
            "Mon–Sat 10am–8pm",
            "Weekends only",
            "By appointment",
          ]}
          value={draft.businessHours}
          onChange={(businessHours) => onChange({ businessHours })}
          placeholder="Select hours"
        />
      </Panel>

      <Panel className="space-y-3">
        <p className="text-sm font-bold text-[#07111f]">Callouts</p>
        <p className="text-xs text-slate-500">
          Short highlights shown under your ad. Tap to remove any you don't want.
        </p>
        <ChipToggleGroup
          options={draft.callouts}
          values={draft.callouts}
          onChange={(callouts) => onChange({ callouts })}
        />
        <button
          type="button"
          onClick={() =>
            onChange({
              callouts: generateCallouts(
                draft.businessType ||
                  inferBusinessTypeFromProducts(
                    draft.productsServices,
                    "Local Business",
                  ),
              ),
            })
          }
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4285F4]"
        >
          <Sparkles className="size-3.5" aria-hidden />
          Refresh suggestions
        </button>
      </Panel>

      {draft.sitelinks.length > 0 ? (
        <Panel className="space-y-3">
          <div>
            <p className="text-sm font-bold text-[#07111f]">
              Helpful links (sitelinks)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Up to {MAX_SITELINKS} quick links appear below your ad. Turn any
              off if it doesn't apply to your business.
            </p>
          </div>
          <div className="space-y-2">
            {draft.sitelinks.map((link) => (
              <ToggleSwitch
                key={link.id}
                checked={link.enabled}
                label={link.text || "Sitelink"}
                description={link.enabled ? "Shown under your ad" : "Hidden"}
                onChange={(enabled) =>
                  onChange({
                    sitelinks: draft.sitelinks.map((item) =>
                      item.id === link.id ? { ...item, enabled } : item,
                    ),
                  })
                }
              />
            ))}
          </div>
        </Panel>
      ) : null}
    </StepShell>
  );
}

function GoogleStatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-semibold leading-snug text-[#07111f]">
        {value}
      </p>
    </div>
  );
}

function GoogleReviewSection({
  icon: Icon,
  title,
  subtitle,
  onEdit,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
      <div className="flex items-start justify-between gap-3 border-b border-[#e8edf5] bg-gradient-to-r from-[#f8fbff] via-white to-white px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d2e3fc] bg-white text-[#4285F4] shadow-sm">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold tracking-tight text-[#07111f]">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 text-xs font-bold text-[#4285F4] hover:underline"
          >
            Edit
          </button>
        ) : null}
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

export function StepReviewPublish({
  draft,
  onEditStep,
  publishing,
  publishProgress,
  publishPhase,
  publishStep,
  publishError: _publishError,
  publishSuccess,
  onChange,
}: {
  draft: GoogleCampaignBuilderDraft;
  onEditStep: (step: number) => void;
  publishing: boolean;
  publishProgress: number;
  publishPhase: string | null;
  publishStep: string | null;
  publishError: string | null;
  publishSuccess: boolean;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
}) {
  const goalTitle =
    GOAL_OPTIONS.find((g) => g.id === draft.goal)?.title ?? "Not set";
  const metrics = estimateMetrics(draft.dailyBudget);
  const keywords = enabledKeywords(draft);
  const keywordsSample = keywords.slice(0, 6).join(", ") || "—";

  const locationsLabel =
    [
      draft.targetLocations.map((row) => row.name).join(", ") || null,
      draft.radiusEnabled && draft.radiusCenter
        ? `${formatRadiusLabel(draft.radiusValue, draft.radiusUnit)} around ${draft.radiusCenter.name}`
        : null,
      draft.excludedLocationTargets.length
        ? `Exclude: ${draft.excludedLocationTargets.map((row) => row.name).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—";

  const budgetLabel = `$${draft.dailyBudget}/day`;
  const enabledSitelinksCount = draft.sitelinks.filter((s) => s.enabled).length;

  const clampedProgress = Math.min(
    100,
    Math.max(0, publishSuccess ? 100 : publishProgress || 0),
  );
  const activeStepIndex = resolveGooglePublishStepIndex(publishStep);
  const showProgress = publishing || publishSuccess || clampedProgress > 0;
  const publishStateLabel = publishSuccess
    ? "Published"
    : publishing
      ? "Publishing"
      : "Ready to publish";

  return (
    <StepShell
      step={9}
      total={TOTAL_WIZARD_STEPS}
      title="Review & publish"
      description="Everything looks set. Double-check the summary, preview the ad, then publish to Google Ads."
    >
      <div className="space-y-5 pb-2">
        <section className="relative overflow-hidden rounded-2xl border border-[#d2e3fc] bg-gradient-to-br from-[#4285F4] via-[#3b78e7] to-[#1a73e8] p-5 text-white shadow-[0_18px_40px_rgba(66,133,244,0.28)] sm:p-6">
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-10 size-48 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
                <Rocket className="size-3.5" aria-hidden />
                {publishStateLabel}
              </div>
              <h3 className="mt-3 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                {draft.campaignName || "Untitled campaign"}
              </h3>
              <p className="mt-1.5 text-sm text-white/80">
                {goalTitle} · {draft.businessName || "Your business"} ·{" "}
                {budgetLabel}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/70">
                  Daily budget
                </p>
                <p className="mt-1 text-sm font-bold">{budgetLabel}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/70">
                  Est. monthly
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-bold">
                  {metrics.monthlySpend}
                </p>
              </div>
            </div>
          </div>
        </section>

        {showProgress ? (
          <section className="overflow-hidden rounded-2xl border border-[#d2e3fc] bg-[#f8fbff] p-5 shadow-sm ring-1 ring-[#4285F4]/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#07111f]">
                {publishSuccess
                  ? "Campaign published"
                  : publishing
                    ? "Publishing to Google Ads…"
                    : "Publish progress"}
              </p>
              <span className="text-xs font-bold tabular-nums text-[#4285F4]">
                {clampedProgress}%
              </span>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-[#4285F4]/15"
              role="progressbar"
              aria-valuenow={clampedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#4285F4] transition-[width] duration-500 ease-out"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {publishSuccess
                ? "You're all set. We handled the technical setup behind the scenes."
                : publishPhase || "Preparing your campaign"}
            </p>

            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {GOOGLE_PUBLISH_PROGRESS_STEPS.map((stepItem, index) => {
                const done =
                  publishSuccess ||
                  index < activeStepIndex ||
                  (stepItem.key === "done" && clampedProgress >= 100) ||
                  (index === activeStepIndex && clampedProgress >= 100);
                const current =
                  !publishSuccess &&
                  index === activeStepIndex &&
                  !done &&
                  publishing;
                return (
                  <li
                    key={stepItem.key}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
                      done
                        ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                        : current
                          ? "border-[#d2e3fc] bg-white font-semibold text-[#4285F4]"
                          : "border-transparent bg-white/60 text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? "bg-emerald-500 text-white"
                          : current
                            ? "bg-[#4285F4] text-white"
                            : "bg-white ring-1 ring-[#d2e3fc] text-slate-400"
                      }`}
                    >
                      {done ? (
                        <Check className="size-3" aria-hidden />
                      ) : current ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                      ) : (
                        <span className="text-[10px] font-bold">
                          {index + 1}
                        </span>
                      )}
                    </span>
                    {stepItem.label}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <GoogleReviewSection
              icon={Flag}
              title="Campaign"
              subtitle="Goal, name, and business"
              onEdit={() => onEditStep(2)}
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                <GoogleStatChip label="Goal" value={goalTitle} />
                <GoogleStatChip
                  label="Campaign name"
                  value={draft.campaignName || "—"}
                />
                <GoogleStatChip
                  label="Business"
                  value={draft.businessName || "—"}
                />
                <GoogleStatChip
                  label="Website"
                  value={draft.websiteUrl || draft.landingPageUrl || "—"}
                />
              </div>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="mt-3 text-xs font-bold text-[#4285F4] hover:underline"
              >
                Edit goal
              </button>
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={Wallet}
              title="Budget"
              subtitle="What you'll spend and roughly what you'll get"
              onEdit={() => onEditStep(3)}
            >
              <div className="grid gap-2.5 sm:grid-cols-3">
                <GoogleStatChip label="Daily budget" value={budgetLabel} />
                <GoogleStatChip
                  label="Est. monthly"
                  value={metrics.monthlySpend}
                />
                <GoogleStatChip label="Est. clicks" value={metrics.clicks} />
              </div>
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={MapPin}
              title="Locations & languages"
              subtitle="Where and in which languages your ads run"
              onEdit={() => onEditStep(4)}
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                <GoogleStatChip label="Locations" value={locationsLabel} />
                <GoogleStatChip
                  label="Languages"
                  value={draft.languages.join(", ") || "—"}
                />
              </div>
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={Users}
              title="Target customers"
              subtitle="Who your ads are shown to"
              onEdit={() => onEditStep(5)}
            >
              <GoogleStatChip
                label="Ideal customers"
                value={draft.idealCustomers.join(", ") || "—"}
              />
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={Tag}
              title="Keywords"
              subtitle="What people search to find your ads"
              onEdit={() => onEditStep(6)}
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                <GoogleStatChip
                  label="Keywords"
                  value={`${keywords.length} selected`}
                />
                <GoogleStatChip label="Sample" value={keywordsSample} />
              </div>
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={Megaphone}
              title="Ads"
              subtitle="Headlines and copy people will see"
              onEdit={() => onEditStep(7)}
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                <GoogleStatChip
                  label="Headlines"
                  value={`${draft.ads[0]?.headlines.filter(Boolean).length || 0} written`}
                />
                <GoogleStatChip
                  label="Descriptions"
                  value={`${draft.ads[0]?.descriptions.filter(Boolean).length || 0} written`}
                />
              </div>
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={Phone}
              title="Business details"
              subtitle="Extra info shown alongside your ad"
              onEdit={() => onEditStep(8)}
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                <GoogleStatChip
                  label="Phone"
                  value={draft.phoneNumber || "—"}
                />
                <GoogleStatChip
                  label="Address"
                  value={draft.businessAddress || "—"}
                />
                <GoogleStatChip
                  label="Callouts"
                  value={`${draft.callouts.length} callouts`}
                />
                <GoogleStatChip
                  label="Sitelinks"
                  value={`${enabledSitelinksCount} links`}
                />
              </div>
            </GoogleReviewSection>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <GoogleReviewSection
              icon={ImageIcon}
              title="Ad preview"
              subtitle="How it may look in Google Search"
              onEdit={() => onEditStep(7)}
            >
              {draft.ads[0] ? (
                <AdLivePreview
                  ad={draft.ads[0]}
                  businessName={draft.businessName}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-[#d2e3fc] bg-[#f8fbff] px-4 py-10 text-center">
                  <ImageIcon
                    className="mx-auto size-8 text-[#4285F4]/50"
                    aria-hidden
                  />
                  <p className="mt-3 text-sm font-semibold text-[#07111f]">
                    No ad creative yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Go back to Ads and add headlines.
                  </p>
                </div>
              )}
            </GoogleReviewSection>

            <GoogleReviewSection
              icon={ListChecks}
              title="Quick links"
              subtitle="Jump back to any step"
            >
              <div className="flex flex-wrap gap-2">
                {[
                  [1, "Goal"],
                  [2, "Campaign"],
                  [3, "Budget"],
                  [4, "Locations"],
                  [5, "Customers"],
                  [6, "Keywords"],
                  [7, "Ads"],
                  [8, "Business details"],
                ].map(([step, label]) => (
                  <button
                    key={String(step)}
                    type="button"
                    onClick={() => onEditStep(Number(step))}
                    className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-xs font-bold text-[#4285F4] transition hover:border-[#d2e3fc] hover:bg-[#f8fbff]"
                  >
                    Edit {label}
                  </button>
                ))}
              </div>
            </GoogleReviewSection>

            <AdvancedOptions draft={draft} onChange={onChange} />
          </aside>
        </div>
      </div>
    </StepShell>
  );
}

export function StepOnboarding({
  draft,
  onChange,
  onSkip,
  onContinue,
}: {
  draft: GoogleCampaignBuilderDraft;
  onChange: (patch: Partial<GoogleCampaignBuilderDraft>) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const [description, setDescription] = useState(draft.businessDescription);

  const handleContinue = () => {
    const prefill = prefillFromBusinessDescription(description);
    onChange(prefill);
    onContinue();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#4285F4]">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#07111f]">
          Let's speed things up
        </h2>
        <p className="mt-2 text-base leading-relaxed text-slate-500">
          Describe your business in a sentence or two and we'll pre-fill the
          rest of this campaign for you.
        </p>
      </div>

      <Panel className="space-y-3">
        <Field label="Describe your business">
          <textarea
            className={`${inputClass()} min-h-[140px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. We're a family-owned plumbing company in Austin offering emergency repairs, drain cleaning, and water heater installation for homeowners."
          />
        </Field>
      </Panel>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-xl border border-[#e8edf5] bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fafc]"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!description.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3367d6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="size-4" aria-hidden />
          Continue
        </button>
      </div>
    </div>
  );
}

export function renderCampaignBuilderStep(
  step: number,
  props: StepProps & {
    onEditStep: (step: number) => void;
    publishing: boolean;
    publishProgress: number;
    publishPhase: string | null;
    publishStep: string | null;
    publishError: string | null;
    publishSuccess: boolean;
  },
): ReactNode {
  switch (step) {
    case 1:
      return <StepGoal {...props} />;
    case 2:
      return <StepCampaignDetails {...props} />;
    case 3:
      return <StepBudget {...props} />;
    case 4:
      return <StepLocationsLanguages {...props} />;
    case 5:
      return <StepTargetCustomers {...props} />;
    case 6:
      return <StepProductsServices {...props} />;
    case 7:
      return <StepAds {...props} />;
    case 8:
      return <StepBusinessDetails {...props} />;
    case 9:
      return (
        <StepReviewPublish
          draft={props.draft}
          onChange={props.onChange}
          onEditStep={props.onEditStep}
          publishing={props.publishing}
          publishProgress={props.publishProgress}
          publishPhase={props.publishPhase}
          publishStep={props.publishStep}
          publishError={props.publishError}
          publishSuccess={props.publishSuccess}
        />
      );
    default:
      return null;
  }
}
