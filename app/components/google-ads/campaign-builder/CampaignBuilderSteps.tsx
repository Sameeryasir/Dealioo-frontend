"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Ban,
  BarChart3,
  Building2,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  Globe,
  ImageIcon,
  Info,
  Languages,
  Link2,
  Loader2,
  MapPin,
  MapPinOff,
  Megaphone,
  MousePointerClick,
  Phone,
  Plus,
  Radar,
  Rocket,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Type,
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
  generateCallouts,
  generateNegativesFromProducts,
  generateSnippetValues,
  inferBusinessTypeFromProducts,
  prefillFromBusinessDescription,
  toSuggestedKeywords,
} from "@/app/components/google-ads/campaign-builder/auto-generate";
import { generateGoogleKeywordsWithAi } from "@/app/services/google-ads/generate-google-keywords";
import { getGoogleAdsBusinessProfile } from "@/app/services/google-ads/get-google-ads-business-profile";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { toast } from "sonner";
import {
  BudgetSlider,
  ChipToggleGroup,
  Field,
  Panel,
  SearchableMultiSelect,
  SearchableSelect,
  SelectableCard,
  SimpleSelect,
  StepShell,
  inputClass,
} from "@/app/components/google-ads/campaign-builder/builder-controls";
import { AdvancedOptions } from "@/app/components/google-ads/campaign-builder/AdvancedOptions";
import { BusinessLocationPicker } from "@/app/components/google-ads/campaign-builder/BusinessLocationPicker";
import { AccountConversionGoalsPanel } from "@/app/components/google-ads/campaign-builder/SalesConversionGoalsPanel";
import { LocalVisitsCampaignTypePanel } from "@/app/components/google-ads/campaign-builder/LocalVisitsCampaignTypePanel";
import { LocationAutocomplete } from "@/app/components/google-ads/campaign-builder/LocationAutocomplete";
import {
  deriveLegacyLocationFields,
  resolveLocationCoordinates,
  withDefaultLocationRadius,
  type GoogleAdsLocationRef,
  type RadiusUnitId,
} from "@/app/components/google-ads/campaign-builder/location-targeting";

const GoogleAdsLocationsMap = dynamic(
  () =>
    import("@/app/components/google-ads/campaign-builder/GoogleAdsLocationsMap").then(
      (mod) => mod.GoogleAdsLocationsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f8fafc] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);
import {
  GOAL_OPTIONS,
  GOOGLE_LEAD_FORM_CTA_OPTIONS,
  GOOGLE_LEAD_FORM_FIELD_OPTIONS,
  GOOGLE_LEAD_FORM_POST_SUBMIT_OPTIONS,
  LANGUAGE_OPTIONS,
  LEAD_CONTACT_OPTIONS,
  LEAD_PHONE_COUNTRY_CODES,
  SALES_CHANNEL_OPTIONS,
  TOTAL_WIZARD_STEPS,
  TRAFFIC_ACTION_OPTIONS,
  type CampaignGoalId,
  type GoogleCampaignBuilderDraft,
  type LeadContactMethodId,
  type SalesChannelId,
  type TrafficActionId,
} from "@/app/components/google-ads/campaign-builder/types";
import {
  DESCRIPTION_MAX,
  HEADLINE_MAX,
} from "@/app/components/google-ads/campaign-builder/validation";
import { DestinationPicker } from "@/app/components/google-ads/campaign-builder/DestinationPicker";
import {
  applyNonUrlDestination,
  destinationLabel,
  formatBusinessAddressLine,
  resolveCampaignDestinationUrl,
  withSyncedAdFinalUrl,
} from "@/app/components/google-ads/campaign-builder/destination";
import {
  mergeIdealCustomerOptions,
  suggestIdealCustomers,
} from "@/app/components/google-ads/campaign-builder/ideal-customer-suggestions";

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
  LOCAL_VISITS: MapPin,
};

const SALES_CHANNEL_ICONS: Record<
  Extract<SalesChannelId, "WEBSITE" | "PHONE_ORDERS" | "PHYSICAL_STORE">,
  LucideIcon
> = {
  WEBSITE: Globe,
  PHYSICAL_STORE: Store,
  PHONE_ORDERS: Phone,
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

  const tiles: {
    label: string;
    value: string;
    footnote: string;
    Icon: LucideIcon;
    iconWrap: string;
    iconColor: string;
  }[] = [
    {
      label: "Est. monthly spend",
      value: m.monthlySpend,
      footnote: "Based on daily budget",
      Icon: BarChart3,
      iconWrap: "bg-[#ecfdf5]",
      iconColor: "text-emerald-600",
    },
    {
      label: "Est. clicks",
      value: m.clicks,
      footnote: "Rough estimate",
      Icon: MousePointerClick,
      iconWrap: "bg-[#f3e8ff]",
      iconColor: "text-violet-600",
    },
    {
      label: "Est. impressions",
      value: m.impressions,
      footnote: "How often ads may show",
      Icon: Eye,
      iconWrap: "bg-[#fff7ed]",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiles.map(({ label, value, footnote, Icon, iconWrap, iconColor }) => (
        <div
          key={label}
          className="flex gap-3 rounded-2xl border border-[#e8edf5] bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.03)]"
        >
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconWrap} ${iconColor}`}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-sm font-bold text-[#07111f]">{value}</p>
            <p className="mt-0.5 text-[0.65rem] text-slate-400">{footnote}</p>
          </div>
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

function SetupSectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-bold text-[#07111f]">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SetupFieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="mt-7 inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

export function StepGoal({ businessId, draft, errors, onChange }: StepProps) {
  const selectedGoalLabel =
    GOAL_OPTIONS.find((goal) => goal.id === draft.goal)?.title ?? null;

  return (
    <StepShell
      step={1}
      total={TOTAL_WIZARD_STEPS}
      title="What do you want this campaign to achieve?"
      description="Choose the goal that best matches what you want to accomplish with this campaign."
    >
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="radiogroup"
        aria-label="Campaign goal"
      >
        {GOAL_OPTIONS.map((goal) => {
          const Icon =
            GOAL_ICONS[goal.id as Exclude<CampaignGoalId, "APP_PROMOTION">];
          return (
            <SelectableCard
              key={goal.id}
              selectionMode="radio"
              selected={draft.goal === goal.id}
              title={goal.title}
              description={goal.description}
              icon={<Icon className="size-5" aria-hidden />}
              onClick={() =>
                onChange(
                  goal.id === "LOCAL_VISITS"
                    ? { goal: goal.id, campaignType: "PERFORMANCE_MAX" }
                    : { goal: goal.id },
                )
              }
            />
          );
        })}
      </div>
      {errors.goal ? (
        <p className="text-sm font-medium text-red-500">{errors.goal}</p>
      ) : null}

      {draft.goal === "LOCAL_VISITS" ? (
        <LocalVisitsCampaignTypePanel
          businessId={businessId}
          campaignType={draft.campaignType}
          onChange={onChange}
        />
      ) : draft.goal && selectedGoalLabel ? (
        <AccountConversionGoalsPanel
          businessId={businessId}
          campaignGoal={draft.goal}
          objectiveLabel={selectedGoalLabel}
          onChange={onChange}
        />
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#4285F4]">
            <Info className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#07111f]">
              Not sure which goal to choose?
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              You can learn more about each goal and how it works in Google Ads.
            </p>
          </div>
        </div>
        <a
          href="https://support.google.com/google-ads/answer/7515513"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] shadow-sm transition hover:bg-white hover:border-[#d2e3fc]"
        >
          Learn more
          <ExternalLink className="size-3.5 text-slate-400" aria-hidden />
        </a>
      </div>
    </StepShell>
  );
}


export function StepCampaignDetails({
  businessId,
  draft,
  errors,
  onChange,
}: StepProps) {
  const didPrefillContactFromBusiness = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const { data: businessProfile } = useBusinessByIdQuery(businessId);

  const isSalesGoal = draft.goal === "SALES";
  const isLeadsGoal = draft.goal === "LEADS";

  const salesChannel: SalesChannelId | null =
    draft.salesChannel === "ONLINE_STORE" || draft.salesChannel === "MULTIPLE"
      ? "WEBSITE"
      : draft.salesChannel;

  // Prefill business name from connected Google Ads when this step mounts
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;

    void getGoogleAdsBusinessProfile(businessId, { force: true })
      .then((adsProfile) => {
        if (cancelled) return;

        const current = draftRef.current;
        const patch: Partial<GoogleCampaignBuilderDraft> = {};

        if (adsProfile.businessName?.trim()) {
          const name = adsProfile.businessName.trim();
          patch.businessName = name;
          if (!current.extensionBusinessName.trim()) {
            patch.extensionBusinessName = name;
          }
        }
        if (Object.keys(patch).length > 0) onChangeRef.current(patch);
      })
      .catch(() => {
        // Leave fields as-is if Ads lookup fails; user can still type manually.
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // Contact / location still come from Dealioo when Ads does not provide them
  useEffect(() => {
    if (!businessProfile || didPrefillContactFromBusiness.current) return;
    didPrefillContactFromBusiness.current = true;

    const addressLine = formatBusinessAddressLine({
      city: businessProfile.city,
      state: businessProfile.state,
      postalCode: businessProfile.postalCode,
      country: businessProfile.country,
    });

    const patch: Partial<GoogleCampaignBuilderDraft> = {};
    if (!draft.websiteUrl.trim() && businessProfile.websiteUrl?.trim()) {
      patch.websiteUrl = businessProfile.websiteUrl.trim();
    }
    if (!draft.businessPhone.trim() && businessProfile.phoneNumber?.trim()) {
      patch.businessPhone = businessProfile.phoneNumber.trim();
      patch.phoneNumber = businessProfile.phoneNumber.trim();
    }
    if (!draft.businessAddress.trim() && addressLine) {
      patch.businessAddress = addressLine;
    }
    if (!draft.businessLocation.trim() && addressLine) {
      patch.businessLocation = addressLine;
    }
    if (Object.keys(patch).length > 0) onChange(patch);
  }, [
    businessProfile,
    draft.businessAddress,
    draft.businessLocation,
    draft.businessPhone,
    draft.websiteUrl,
    onChange,
  ]);


  const selectPrimaryLeadMethod = (id: LeadContactMethodId) => {
    if (id === "CONTACT_FORM") {
      onChange({
        leadContactMethods: [id],
        destinationType:
          draft.destinationType === "dealioo_funnel" ||
          draft.destinationType === "external_website"
            ? draft.destinationType
            : null,
      });
      return;
    }
    if (id === "GOOGLE_LEAD_FORM") {
      onChange({
        leadContactMethods: [id],
        ...applyNonUrlDestination("google_lead_form"),
      });
      return;
    }
    if (id === "PHONE_CALLS") {
      onChange({
        leadContactMethods: [id],
        ...applyNonUrlDestination("phone"),
      });
      return;
    }
    onChange({ leadContactMethods: [id] });
  };

  const primaryLeadMethod =
    draft.leadContactMethods.find((id) =>
      LEAD_CONTACT_OPTIONS.some((option) => option.id === id),
    ) ?? null;

  const selectSalesChannel = (id: SalesChannelId) => {
    if (id === "WEBSITE") {
      onChange({
        salesChannel: id,
        destinationType:
          draft.destinationType === "dealioo_funnel" ||
          draft.destinationType === "external_website"
            ? draft.destinationType
            : null,
      });
      return;
    }
    if (id === "PHONE_ORDERS") {
      onChange({
        salesChannel: id,
        ...applyNonUrlDestination("phone"),
      });
      return;
    }
    if (id === "PHYSICAL_STORE") {
      onChange({
        salesChannel: id,
        ...applyNonUrlDestination("physical_location"),
      });
      return;
    }
    onChange({ salesChannel: id });
  };

  return (
    <StepShell
      step={2}
      total={TOTAL_WIZARD_STEPS}
      title="Set up your campaign"
      description="We prefilled what we already know about your business. Tell us how customers should reach you."
    >
      <Panel className="space-y-4">
        <SetupSectionTitle
          icon={FileText}
          title="Campaign information"
          description="Basics for this campaign. We filled in what we already know."
        />
        <div className="flex items-start gap-3">
          <SetupFieldIcon icon={Tag} />
          <div className="min-w-0 flex-1">
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
          </div>
        </div>
        <div className="flex items-start gap-3">
          <SetupFieldIcon icon={Building2} />
          <div className="min-w-0 flex-1">
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
          </div>
        </div>

      </Panel>

      {isSalesGoal ? (
        <>
          <Panel className="space-y-3">
            <SetupSectionTitle
              icon={ShoppingCart}
              title="How do customers complete a purchase?"
              description="Choose the main way people buy from you."
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {SALES_CHANNEL_OPTIONS.map((option) => {
                const Icon = SALES_CHANNEL_ICONS[option.id];
                return (
                  <SelectableCard
                    key={option.id}
                    selectionMode="radio"
                    selected={salesChannel === option.id}
                    title={option.title}
                    description={option.description}
                    icon={<Icon className="size-5" aria-hidden />}
                    onClick={() => selectSalesChannel(option.id)}
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

          {salesChannel === "WEBSITE" ? (
            <DestinationPicker
              businessId={businessId}
              draft={draft}
              errors={errors}
              onChange={onChange}
            />
          ) : null}

          {salesChannel === "PHYSICAL_STORE" ? (
            <Panel>
              <BusinessLocationPicker
                label="Business location"
                description="Search your address, use current location, or place a pin on the map."
                value={draft.businessLocation}
                latitude={draft.businessLocationLat}
                longitude={draft.businessLocationLng}
                error={errors.businessLocation}
                onChange={(patch) =>
                  onChange({
                    ...patch,
                    ...applyNonUrlDestination("physical_location"),
                  })
                }
              />
            </Panel>
          ) : null}

          {salesChannel === "PHONE_ORDERS" ? (
            <Panel>
              <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <Field label="Country code" required>
                  <select
                    className={inputClass()}
                    value={draft.phoneCountryCode}
                    onChange={(e) =>
                      onChange({ phoneCountryCode: e.target.value })
                    }
                  >
                    {LEAD_PHONE_COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Phone number"
                  required
                  error={errors.businessPhone}
                >
                  <input
                    className={inputClass(errors.businessPhone)}
                    value={draft.businessPhone}
                    onChange={(e) =>
                      onChange({
                        businessPhone: e.target.value,
                        phoneNumber: e.target.value,
                        ...applyNonUrlDestination("phone"),
                      })
                    }
                    placeholder="555 0100"
                  />
                </Field>
              </div>
            </Panel>
          ) : null}
        </>
      ) : null}

      {isLeadsGoal ? (
        <Panel className="space-y-4">
          <div>
            <p className="text-sm font-bold text-[#07111f]">
              How would you like to receive leads?
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Choose one primary way customers should contact you.
            </p>
          </div>

          <div
            className="grid gap-3 sm:grid-cols-3"
            role="radiogroup"
            aria-label="Primary lead method"
          >
            {LEAD_CONTACT_OPTIONS.map((option) => (
              <SelectableCard
                key={option.id}
                selectionMode="radio"
                selected={primaryLeadMethod === option.id}
                title={option.title}
                description={option.description}
                onClick={() => selectPrimaryLeadMethod(option.id)}
              />
            ))}
          </div>
          {errors.leadContactMethods ? (
            <p className="text-sm font-medium text-red-500">
              {errors.leadContactMethods}
            </p>
          ) : null}

          {primaryLeadMethod === "CONTACT_FORM" ? (
            <DestinationPicker
              businessId={businessId}
              draft={draft}
              errors={errors}
              onChange={onChange}
              title="Where should customers go?"
            />
          ) : null}

          {primaryLeadMethod === "GOOGLE_LEAD_FORM" ? (
            <div className="space-y-5 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
              <div>
                <p className="text-sm font-bold text-[#07111f]">
                  Google Lead Form
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Collect leads without sending people away from Google.
                </p>
              </div>

              <Field
                label="Headline"
                required
                error={errors.googleLeadFormHeadline}
              >
                <input
                  className={inputClass(errors.googleLeadFormHeadline)}
                  value={draft.googleLeadFormHeadline}
                  onChange={(e) =>
                    onChange({ googleLeadFormHeadline: e.target.value })
                  }
                  placeholder="Get a Free Quote"
                />
              </Field>

              <Field
                label="Description"
                required
                error={errors.googleLeadFormDescription}
              >
                <textarea
                  className={`${inputClass(errors.googleLeadFormDescription)} min-h-[80px]`}
                  value={draft.googleLeadFormDescription}
                  onChange={(e) =>
                    onChange({ googleLeadFormDescription: e.target.value })
                  }
                  placeholder="Tell us what you need and our team will contact you."
                />
              </Field>

              <Field
                label="Call to action"
                required
                error={errors.googleLeadFormCta}
              >
                <SimpleSelect
                  aria-label="Call to action"
                  value={draft.googleLeadFormCta}
                  options={GOOGLE_LEAD_FORM_CTA_OPTIONS.map((cta) => ({
                    id: cta.id,
                    label: cta.label,
                  }))}
                  onChange={(googleLeadFormCta) =>
                    onChange({ googleLeadFormCta })
                  }
                  error={errors.googleLeadFormCta}
                  placeholder="Choose a call to action"
                />
              </Field>

              <Field
                label="CTA description"
                required
                error={errors.googleLeadFormCtaDescription}
              >
                <input
                  className={inputClass(errors.googleLeadFormCtaDescription)}
                  value={draft.googleLeadFormCtaDescription}
                  onChange={(e) =>
                    onChange({ googleLeadFormCtaDescription: e.target.value })
                  }
                  placeholder="Get your free quote today"
                />
              </Field>

              <div className="space-y-2 border-t border-[#dbeafe] pt-4">
                <p className="text-sm font-bold text-[#07111f]">
                  Fields to collect
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GOOGLE_LEAD_FORM_FIELD_OPTIONS.map((field) => {
                    const checked = draft.googleLeadFormFields.includes(
                      field.id,
                    );
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => {
                          const next = checked
                            ? draft.googleLeadFormFields.filter(
                                (id) => id !== field.id,
                              )
                            : [...draft.googleLeadFormFields, field.id];
                          onChange({ googleLeadFormFields: next });
                        }}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                          checked
                            ? "border-[#4285F4] bg-white text-[#4285F4]"
                            : "border-[#e8edf5] bg-white text-slate-600"
                        }`}
                      >
                        <span
                          className={`flex size-4 items-center justify-center rounded border ${
                            checked
                              ? "border-[#4285F4] bg-[#4285F4] text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {checked ? (
                            <Check className="size-2.5" strokeWidth={3} />
                          ) : null}
                        </span>
                        {field.label}
                      </button>
                    );
                  })}
                </div>
                {errors.googleLeadFormFields ? (
                  <p className="text-xs font-medium text-red-500">
                    {errors.googleLeadFormFields}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 border-t border-[#dbeafe] pt-4">
                <Field
                  label="Privacy policy URL"
                  required
                  error={errors.googleLeadFormPrivacyUrl}
                >
                  <input
                    className={inputClass(errors.googleLeadFormPrivacyUrl)}
                    value={draft.googleLeadFormPrivacyUrl}
                    onChange={(e) =>
                      onChange({ googleLeadFormPrivacyUrl: e.target.value })
                    }
                    placeholder="https://example.com/privacy"
                  />
                </Field>
              </div>

              <div className="space-y-3 border-t border-[#dbeafe] pt-4">
                <p className="text-sm font-bold text-[#07111f]">
                  Thank-you screen
                </p>
                <Field
                  label="Thank-you headline"
                  required
                  error={errors.googleLeadFormThankYouHeadline}
                >
                  <input
                    className={inputClass(errors.googleLeadFormThankYouHeadline)}
                    value={draft.googleLeadFormThankYouHeadline}
                    onChange={(e) =>
                      onChange({
                        googleLeadFormThankYouHeadline: e.target.value,
                      })
                    }
                    placeholder="Thank you!"
                  />
                </Field>
                <Field
                  label="Thank-you message"
                  required
                  error={errors.googleLeadFormThankYouMessage}
                >
                  <textarea
                    className={`${inputClass(errors.googleLeadFormThankYouMessage)} min-h-[72px]`}
                    value={draft.googleLeadFormThankYouMessage}
                    onChange={(e) =>
                      onChange({
                        googleLeadFormThankYouMessage: e.target.value,
                      })
                    }
                    placeholder="We'll contact you shortly."
                  />
                </Field>
                <Field
                  label="Post-submit action"
                  required
                  error={errors.googleLeadFormPostSubmitAction}
                >
                  <SimpleSelect
                    aria-label="Post-submit action"
                    value={draft.googleLeadFormPostSubmitAction}
                    options={GOOGLE_LEAD_FORM_POST_SUBMIT_OPTIONS.map(
                      (action) => ({
                        id: action.id,
                        label: action.label,
                      }),
                    )}
                    onChange={(googleLeadFormPostSubmitAction) =>
                      onChange({ googleLeadFormPostSubmitAction })
                    }
                    error={errors.googleLeadFormPostSubmitAction}
                    placeholder="Choose a post-submit action"
                  />
                </Field>
                {draft.googleLeadFormPostSubmitAction === "VISIT_WEBSITE" ||
                draft.googleLeadFormPostSubmitAction === "DOWNLOAD" ||
                draft.googleLeadFormPostSubmitAction === "LEARN_MORE" ? (
                  <Field
                    label="Post-submit URL"
                    required={
                      draft.googleLeadFormPostSubmitAction === "VISIT_WEBSITE"
                    }
                    error={errors.googleLeadFormPostSubmitUrl}
                  >
                    <input
                      className={inputClass(
                        errors.googleLeadFormPostSubmitUrl,
                      )}
                      value={
                        draft.googleLeadFormPostSubmitUrl ||
                        draft.websiteUrl ||
                        draft.landingPageUrl
                      }
                      onChange={(e) =>
                        onChange({
                          googleLeadFormPostSubmitUrl: e.target.value,
                          websiteUrl: draft.websiteUrl || e.target.value,
                        })
                      }
                      placeholder="https://example.com"
                    />
                  </Field>
                ) : null}
              </div>
            </div>
          ) : null}

          {primaryLeadMethod === "PHONE_CALLS" ? (
            <div className="space-y-3 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-[#07111f]">Phone Calls</p>
              <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                <Field label="Country code" required>
                  <select
                    className={inputClass()}
                    value={draft.phoneCountryCode}
                    onChange={(e) =>
                      onChange({ phoneCountryCode: e.target.value })
                    }
                  >
                    {LEAD_PHONE_COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Business phone"
                  required
                  hint="Prefilled from your business profile when available."
                  error={errors.businessPhone}
                >
                  <input
                    className={inputClass(errors.businessPhone)}
                    value={draft.businessPhone}
                    onChange={(e) =>
                      onChange({
                        businessPhone: e.target.value,
                        phoneNumber: e.target.value,
                      })
                    }
                    placeholder="416-555-0123"
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {draft.goal === "WEBSITE_TRAFFIC" ? (
        <>
          <DestinationPicker
            businessId={businessId}
            draft={draft}
            errors={errors}
            onChange={onChange}
            title="Where should we send visitors?"
          />
          <Panel className="space-y-3">
            <p className="text-sm font-bold text-[#07111f]">
              What should visitors do?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TRAFFIC_ACTION_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.id}
                  selectionMode="radio"
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
        </>
      ) : null}

      {draft.goal === "AWARENESS" ? (
        <Panel className="space-y-4">
          <p className="text-xs text-slate-500">
            Prefilled from your business profile — edit only if something
            changed.
          </p>
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

      {draft.goal === "LOCAL_VISITS" ? (
        <div className="space-y-4">
          <Panel>
            <BusinessLocationPicker
              label="Business location"
              value={draft.businessLocation}
              latitude={draft.businessLocationLat}
              longitude={draft.businessLocationLng}
              error={errors.businessLocation}
              onChange={(patch) =>
                onChange({
                  ...patch,
                  ...applyNonUrlDestination("physical_location"),
                })
              }
            />
          </Panel>
          <Panel className="space-y-4">
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
        </div>
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
      title="Set up your budget"
      description="Set a daily budget you're comfortable with. Advanced Google settings stay hidden unless you need them."
    >
      <div className="space-y-4">
        <BudgetSlider
          value={draft.dailyBudget}
          onChange={(dailyBudget) => onChange({ dailyBudget })}
        />
        {errors.dailyBudget ? (
          <p className="text-sm font-medium text-red-500">{errors.dailyBudget}</p>
        ) : null}
        <MetricTiles dailyBudget={draft.dailyBudget} />
      </div>

      <Panel className="grid gap-5 sm:grid-cols-2">
        <Field label="Start date" hint="Defaults to today">
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="date"
              className={`${inputClass()} pl-10`}
              value={draft.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
          </div>
        </Field>
        <Field
          label="End date"
          hint="Leave empty to run continuously"
          error={errors.endDate}
        >
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="date"
              className={`${inputClass(errors.endDate)} pl-10`}
              value={draft.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
          </div>
        </Field>
      </Panel>

      <AdvancedOptions draft={draft} onChange={onChange} />
    </StepShell>
  );
}

export function StepLocationsLanguages({ draft, errors, onChange }: StepProps) {
  const RADIUS_PRESETS_KM = [1, 5, 10, 16, 25, 50, 80] as const;
  const [activeLocationId, setActiveLocationId] = useState<string | null>(
    draft.targetLocations.find((row) => row.type !== "country")?.id ??
      draft.targetLocations[0]?.id ??
      null,
  );
  const [activeList, setActiveList] = useState<"include" | "exclude">("include");

  const activeLocation = useMemo(() => {
    if (activeList === "exclude") {
      return (
        draft.excludedLocationTargets.find((row) => row.id === activeLocationId) ??
        draft.excludedLocationTargets[draft.excludedLocationTargets.length - 1] ??
        null
      );
    }
    return (
      draft.targetLocations.find((row) => row.id === activeLocationId) ??
      draft.targetLocations.find((row) => row.type !== "country") ??
      draft.targetLocations[draft.targetLocations.length - 1] ??
      null
    );
  }, [
    activeList,
    activeLocationId,
    draft.excludedLocationTargets,
    draft.targetLocations,
  ]);

  const activeCoords = useMemo(
    () => resolveLocationCoordinates(activeLocation),
    [activeLocation],
  );

  const activeRadiusValue = Math.min(
    80,
    Math.max(1, activeLocation?.radiusValue ?? draft.radiusValue ?? 16),
  );
  const activeRadiusUnit: RadiusUnitId =
    activeLocation?.radiusUnit === "MILES" ? "MILES" : "KILOMETERS";

  const usesRadiusOnMap =
    activeLocation != null &&
    activeLocation.type !== "country" &&
    activeCoords != null;

  const mapPins = useMemo(
    () => [
      ...draft.targetLocations.map((row) => ({ ...row, mode: "include" as const })),
      ...draft.excludedLocationTargets.map((row) => ({
        ...row,
        mode: "exclude" as const,
      })),
    ],
    [draft.excludedLocationTargets, draft.targetLocations],
  );

  const radiusPct = ((activeRadiusValue - 1) / 79) * 100;

  const legacyFromLocation = (location: GoogleAdsLocationRef | null) => {
    const coords = resolveLocationCoordinates(location);
    const isPin =
      location != null && location.type !== "country" && coords != null;
    const value = location?.radiusValue ?? 16;
    const unit: RadiusUnitId =
      location?.radiusUnit === "MILES" ? "MILES" : "KILOMETERS";
    return {
      radiusEnabled: isPin,
      radiusCenter:
        isPin && location && coords
          ? { ...location, latitude: coords.latitude, longitude: coords.longitude }
          : null,
      radiusLat: coords?.latitude ?? null,
      radiusLng: coords?.longitude ?? null,
      radiusValue: value,
      radiusUnit: unit,
      radiusTargeting: isPin ? formatRadiusLabel(value, unit) : "",
      presenceOption: "PRESENCE" as const,
    };
  };

  const updateActiveLocation = (patch: {
    radiusValue?: number;
    radiusUnit?: RadiusUnitId;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!activeLocation || activeLocation.type === "country") return;

    const updated = withDefaultLocationRadius({
      ...activeLocation,
      ...patch,
      radiusValue: patch.radiusValue ?? activeLocation.radiusValue ?? 16,
      radiusUnit: patch.radiusUnit ?? activeLocation.radiusUnit ?? "KILOMETERS",
    });

    if (activeList === "exclude") {
      const next = draft.excludedLocationTargets.map((row) =>
        row.id === activeLocation.id ? updated : row,
      );
      onChange({
        excludedLocationTargets: next,
        excludedLocations: next.map((row) => row.name),
      });
      return;
    }

    const next = draft.targetLocations.map((row) =>
      row.id === activeLocation.id ? updated : row,
    );
    onChange({
      targetLocations: next,
      ...deriveLegacyLocationFields(next),
      ...legacyFromLocation(updated),
    });
  };

  const applyTargetLocations = (incoming: GoogleAdsLocationRef[]) => {
    const targetLocations = incoming.map((row) =>
      withDefaultLocationRadius(row, 16, "KILOMETERS"),
    );
    const nextActive =
      targetLocations.find((row) => row.id === activeLocationId) ??
      targetLocations[targetLocations.length - 1] ??
      null;

    setActiveList("include");
    setActiveLocationId(nextActive?.id ?? null);
    onChange({
      targetLocations,
      ...deriveLegacyLocationFields(targetLocations),
      ...legacyFromLocation(nextActive),
    });
  };

  const activateInclude = (location: GoogleAdsLocationRef) => {
    setActiveList("include");
    setActiveLocationId(location.id);
    onChange(legacyFromLocation(location));
  };

  const activateExclude = (location: GoogleAdsLocationRef) => {
    setActiveList("exclude");
    setActiveLocationId(location.id);
  };

  const applyExcludedLocations = (incoming: GoogleAdsLocationRef[]) => {
    const excludedLocationTargets = incoming.map((row) => {
      if (row.type === "country") {
        return { ...row, radiusValue: undefined, radiusUnit: undefined };
      }
      const coords = resolveLocationCoordinates(row);
      return {
        ...row,
        latitude: row.latitude ?? coords?.latitude,
        longitude: row.longitude ?? coords?.longitude,
        radiusValue: undefined,
        radiusUnit: undefined,
      };
    });
    const nextActive =
      excludedLocationTargets.find((row) => row.id === activeLocationId) ??
      excludedLocationTargets[excludedLocationTargets.length - 1] ??
      null;
    setActiveList("exclude");
    setActiveLocationId(nextActive?.id ?? null);
    onChange({
      excludedLocationTargets,
      excludedLocations: excludedLocationTargets.map((row) => row.name),
    });
  };

  const handleMapRadiusChange = (radiusValue: number) => {
    if (!activeLocation || !usesRadiusOnMap) return;
    updateActiveLocation({ radiusValue });
  };

  return (
    <StepShell
      step={4}
      total={TOTAL_WIZARD_STEPS}
      title="Where are your customers?"
      description="Add the places you want to reach, then choose languages. English is selected by default."
    >
      <Panel className="space-y-5">
        <LocationAutocomplete
          icon={MapPin}
          label="Countries, states, or cities"
          description="Search and add places. Click a chip to set that place’s own radius."
          required
          values={draft.targetLocations}
          onChange={applyTargetLocations}
          onActivate={activateInclude}
          activeId={activeList === "include" ? activeLocation?.id ?? null : null}
          placeholder="Search countries, states, cities, postal codes..."
          error={
            errors.targetLocations || errors.radiusCenter || errors.radiusValue
          }
        />

        <LocationAutocomplete
          icon={MapPinOff}
          label="Exclude locations"
          values={draft.excludedLocationTargets}
          onChange={applyExcludedLocations}
          onActivate={activateExclude}
          activeId={activeList === "exclude" ? activeLocation?.id ?? null : null}
          placeholder="Search places to exclude..."
          description="Optional — excludes the whole place (Google does not support exclude-by-radius)."
        />

        <div className="space-y-3">
          {usesRadiusOnMap && activeList === "include" ? (
            <div className="space-y-2 rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-3">
              <p className="text-xs font-semibold text-slate-500">
                Radius for “{activeLocation?.name}” only
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RADIUS_PRESETS_KM.map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() =>
                      updateActiveLocation({
                        radiusValue: km,
                        radiusUnit: "KILOMETERS",
                      })
                    }
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      activeRadiusValue === km && activeRadiusUnit !== "MILES"
                        ? "bg-[#4285F4] text-white"
                        : "border border-[#e8edf5] bg-white text-slate-600"
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={activeRadiusValue}
                  onChange={(e) =>
                    handleMapRadiusChange(Number.parseInt(e.target.value, 10))
                  }
                  className="google-budget-slider h-2 min-w-[140px] flex-1 cursor-pointer appearance-none rounded-full"
                  style={{
                    background: `linear-gradient(to right, #4285F4 0%, #4285F4 ${radiusPct}%, #e8edf5 ${radiusPct}%, #e8edf5 100%)`,
                  }}
                  aria-label="Radius slider"
                />
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={activeRadiusValue}
                  onChange={(e) =>
                    handleMapRadiusChange(
                      Math.min(
                        80,
                        Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      ),
                    )
                  }
                  className="w-14 rounded border border-[#e8edf5] bg-white px-2 py-1 text-sm"
                  aria-label="Radius value"
                />
                <div className="flex overflow-hidden rounded-lg border border-[#e8edf5] bg-white">
                  {(
                    [
                      ["KILOMETERS", "km"],
                      ["MILES", "mi"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        updateActiveLocation({ radiusUnit: value })
                      }
                      className={`px-2.5 py-1 text-xs font-semibold ${
                        activeRadiusUnit === value
                          ? "bg-[#4285F4] text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeList === "exclude" && activeLocation ? (
            <p className="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              “{activeLocation.name}” will be excluded as a whole place (no
              radius).
            </p>
          ) : !usesRadiusOnMap ? (
            <p className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fbff] px-3 py-2 text-xs text-slate-600">
              Select or search a city/address first, then set a radius.
              Country-only targeting does not use a radius circle.
            </p>
          ) : null}

          <GoogleAdsLocationsMap
            locations={mapPins}
            activeLocationId={activeLocation?.id ?? null}
            dropPinMode={false}
            onDropPin={() => {}}
            onSelectPin={(id) => {
              const include = draft.targetLocations.find((row) => row.id === id);
              if (include) {
                activateInclude(include);
                return;
              }
              const exclude = draft.excludedLocationTargets.find(
                (row) => row.id === id,
              );
              if (exclude) activateExclude(exclude);
            }}
          />
        </div>
      </Panel>

      <Panel>
        <SearchableMultiSelect
          icon={Languages}
          label="Languages"
          description="People who speak these languages can see your ads."
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

export function StepTargetCustomers({
  businessId,
  draft,
  errors,
  onChange,
}: StepProps) {
  const [customText, setCustomText] = useState("");
  const { data: businessProfile } = useBusinessByIdQuery(businessId);

  const suggestionResult = useMemo(
    () =>
      suggestIdealCustomers({
        businessName: draft.businessName || businessProfile?.name || "",
        businessCategory: draft.businessCategory,
        businessType: draft.businessType,
        businessDescription:
          draft.businessDescription || businessProfile?.description || "",
        productsServices: draft.productsServices,
        goal: draft.goal,
      }),
    [
      businessProfile?.description,
      businessProfile?.name,
      draft.businessCategory,
      draft.businessDescription,
      draft.businessName,
      draft.businessType,
      draft.goal,
      draft.productsServices,
    ],
  );

  const displayOptions = useMemo(
    () =>
      mergeIdealCustomerOptions(
        suggestionResult.suggestions,
        draft.idealCustomers,
      ),
    [draft.idealCustomers, suggestionResult.suggestions],
  );

  const applyIdealCustomers = (idealCustomers: string[]) => {
    onChange({ idealCustomers });
  };

  const addCustom = () => {
    const value = customText.trim().replace(/\s+/g, " ");
    if (!value) return;
    const exists = draft.idealCustomers.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    if (exists) {
      setCustomText("");
      return;
    }
    applyIdealCustomers([...draft.idealCustomers, value]);
    setCustomText("");
  };

  const suggestionHeading = suggestionResult.isFallback
    ? "Suggested for your business"
    : `Suggested for ${suggestionResult.label}`;

  return (
    <StepShell
      step={5}
      total={TOTAL_WIZARD_STEPS}
      title="Who are you trying to reach?"
      description="Tell us about your ideal customers. Dealioo will use this to improve your campaign recommendations."
    >
      <Panel className="space-y-5">
        {/* Suggested audiences — soft blue icon matches Budget / Locations fields */}
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
            <Users className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-bold text-[#07111f]">{suggestionHeading}</p>
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
          </div>
        </div>

        {/* Custom customer type — same icon + input + Add row as the mockup */}
        <div className="flex gap-3 border-t border-[#e8edf5] pt-5">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
            <Plus className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm font-bold text-[#07111f]">
              + Add custom customer type
            </p>
            <div className="flex gap-2">
              <input
                className={inputClass()}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. First-time home buyers"
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
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(66,133,244,0.22)] transition hover:bg-[#1a73e8]"
              >
                <Plus className="size-3.5" aria-hidden />
                Add
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex gap-3 rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#4285F4]">
          <Info className="size-4" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-slate-500">
          Dealioo will use your selections to improve keywords, ad content, and
          audience recommendations.
        </p>
      </div>
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
      title="What products or services would you like to promote?"
      description="Add what you sell — then generate keywords Dealioo can use for your ads."
    >
      <Panel className="space-y-4">
        {/* Products / services — soft blue icon matches other builder steps */}
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div>
              <p className="text-sm font-bold text-[#07111f]">
                Products or services
                <span className="text-red-500"> *</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Add one or many. Multi-word names are fine (e.g. Air Conditioning
                Installation). Separate several with commas.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass(errors.productsServices)}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Catering, Private dining"
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
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(66,133,244,0.22)] transition hover:bg-[#1a73e8]"
              >
                <Plus className="size-3.5" aria-hidden />
                Add
              </button>
            </div>
            {errors.productsServices ? (
              <p className="text-xs font-medium text-red-500">
                {errors.productsServices}
              </p>
            ) : null}
            {draft.productsServices.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {draft.productsServices.map((item) => (
                  <RemovableChip
                    key={item}
                    label={item}
                    onRemove={() => removeProduct(item)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#07111f]">
                  Keyword suggestions
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {enabledKeywords(draft).length} selected
                </p>
              </div>
              <button
                type="button"
                disabled={draft.productsServices.length === 0 || generating}
                onClick={() => void runGenerate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(66,133,244,0.22)] transition hover:bg-[#1a73e8] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                {generating ? "Generating…" : "Generate Keywords"}
              </button>
            </div>
          </div>
        </div>

        {draft.suggestedKeywords.length > 0 ? (
          <div className="space-y-2">
            {draft.suggestedKeywords.map((keyword) => (
              <div
                key={keyword.id}
                className="flex items-center gap-3 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5"
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
                  className="text-slate-400 transition hover:text-red-500"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#4285F4]">
              <Tag className="size-4" aria-hidden />
            </span>
            <p className="text-sm text-slate-500">
              Add a product or service above, then generate suggestions.
            </p>
          </div>
        )}
        {errors.keywords ? (
          <p className="text-xs font-medium text-red-500">{errors.keywords}</p>
        ) : null}
      </Panel>

      {draft.negativeKeywords.length > 0 ? (
        <Panel className="space-y-3">
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
              <Ban className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-bold text-[#07111f]">
                  Searches to avoid
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Words that should not trigger your ads (for example “jobs” or
                  “free”).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.negativeKeywords.map((word) => (
                  <RemovableChip
                    key={word}
                    label={word}
                    onRemove={() => removeNegative(word)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Panel>
      ) : null}
    </StepShell>
  );
}

const MIN_RSA_HEADLINES = 3;
const MAX_RSA_HEADLINES = 15;
const MIN_RSA_DESCRIPTIONS = 2;
const MAX_RSA_DESCRIPTIONS = 4;

function padAdSlots(values: string[], min: number, max: number): string[] {
  const next = values.slice(0, max);
  while (next.length < min) next.push("");
  return next;
}

export function StepAds({ businessId, draft, errors, onChange }: StepProps) {
  const [changingDestination, setChangingDestination] = useState(false);

  useEffect(() => {
    if (!draft.adsGenerated) {
      onChange({
        ads: [generateAdSuggestions(draft)],
        adsGenerated: true,
      });
      return;
    }
    const current = draft.ads[0];
    if (!current) return;

    const destinationUrl = resolveCampaignDestinationUrl(draft);
    const headlines = padAdSlots(
      current.headlines,
      MIN_RSA_HEADLINES,
      MAX_RSA_HEADLINES,
    );
    const descriptions = padAdSlots(
      current.descriptions,
      MIN_RSA_DESCRIPTIONS,
      MAX_RSA_DESCRIPTIONS,
    );

    const needsUrlSync =
      Boolean(destinationUrl) &&
      current.finalUrl.trim() !== destinationUrl &&
      (draft.destinationType === "dealioo_funnel" ||
        !current.finalUrl.trim());

    if (
      headlines.length !== current.headlines.length ||
      descriptions.length !== current.descriptions.length ||
      needsUrlSync
    ) {
      onChange({
        ads: [
          {
            ...current,
            headlines,
            descriptions,
            finalUrl: needsUrlSync ? destinationUrl : current.finalUrl,
          },
        ],
      });
    }
  }, [draft, draft.adsGenerated, onChange]);

  const ad = draft.ads[0];
  if (!ad) return null;

  const headlines = padAdSlots(
    ad.headlines,
    MIN_RSA_HEADLINES,
    MAX_RSA_HEADLINES,
  );
  const descriptions = padAdSlots(
    ad.descriptions,
    MIN_RSA_DESCRIPTIONS,
    MAX_RSA_DESCRIPTIONS,
  );

  const updateAd = (patch: Partial<typeof ad>) => {
    onChange({ ads: [{ ...ad, ...patch }] });
  };

  const destinationUrl = resolveCampaignDestinationUrl(draft);
  const isFunnelDestination = draft.destinationType === "dealioo_funnel";
  const isExternalDestination = draft.destinationType === "external_website";
  const usesLandingUrl = isFunnelDestination || isExternalDestination;
  const showLandingEditor =
    changingDestination || (!isFunnelDestination && usesLandingUrl);

  const regenerate = () => {
    const next = generateAdSuggestions(draft);
    onChange({
      ads: [
        {
          ...next,
          id: ad.id,
          finalUrl: destinationUrl || next.finalUrl || ad.finalUrl,
          path1: ad.path1 || next.path1,
          path2: ad.path2 || next.path2,
        },
      ],
      adsGenerated: true,
    });
  };

  return (
    <StepShell
      step={7}
      total={TOTAL_WIZARD_STEPS}
      title="Let's create your ad"
      description="We suggested headlines and descriptions from your earlier answers. Edit anything before publishing."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="space-y-5">
          {usesLandingUrl ? (
            <div className="space-y-3 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#4285F4] shadow-sm">
                  <Link2 className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#07111f]">
                        Landing page
                      </p>
                      {isFunnelDestination ? (
                        <>
                          <p className="mt-1 text-sm font-semibold text-[#07111f]">
                            {draft.selectedFunnelName || "Dealioo Funnel"}
                          </p>
                          <p className="mt-0.5 break-all text-xs text-slate-500">
                            {destinationUrl || ad.finalUrl}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-700">
                            <Check className="size-3" aria-hidden />
                            Connected
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {destinationUrl || ad.finalUrl || "Add a website URL"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setChangingDestination((v) => !v)}
                      className="text-xs font-bold text-[#4285F4] hover:underline"
                    >
                      {changingDestination ? "Done" : "Change destination"}
                    </button>
                  </div>
                </div>
              </div>

              {showLandingEditor ? (
                isFunnelDestination ? (
                  <DestinationPicker
                    businessId={businessId}
                    draft={draft}
                    errors={errors}
                    onChange={(patch) => {
                      onChange(withSyncedAdFinalUrl(draft, patch));
                    }}
                  />
                ) : (
                  <div className="flex gap-3">
                    <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
                      <Globe className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Field
                        label="Website URL"
                        required
                        error={errors.finalUrl}
                      >
                        <input
                          className={inputClass(errors.finalUrl)}
                          value={ad.finalUrl || draft.websiteUrl}
                          onChange={(e) => {
                            const value = e.target.value;
                            onChange(
                              withSyncedAdFinalUrl(draft, {
                                destinationType: "external_website",
                                websiteUrl: value,
                                landingPageUrl: value,
                                ads: [{ ...ad, finalUrl: value }],
                              }),
                            );
                          }}
                          placeholder="https://…"
                        />
                      </Field>
                    </div>
                  </div>
                )
              ) : null}
              {errors.finalUrl && !showLandingEditor ? (
                <p className="text-sm font-medium text-red-500">
                  {errors.finalUrl}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] p-4">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
                  <ExternalLink className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-[#07111f]">
                      {destinationLabel(draft)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      This campaign focuses on{" "}
                      {destinationLabel(draft).toLowerCase()}. A website URL is
                      still used behind the scenes when Google needs one.
                    </p>
                  </div>
                  <Field
                    label="Website URL (optional fallback)"
                    error={errors.finalUrl}
                  >
                    <input
                      className={inputClass(errors.finalUrl)}
                      value={ad.finalUrl || draft.websiteUrl}
                      onChange={(e) => {
                        const value = e.target.value;
                        onChange({
                          websiteUrl: value || draft.websiteUrl,
                          ads: [{ ...ad, finalUrl: value }],
                        });
                      }}
                      placeholder="https://…"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Headlines */}
          <div className="space-y-4 border-t border-[#e8edf5] pt-5">
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
                <Type className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#07111f]">Headlines</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      At least {MIN_RSA_HEADLINES} required · up to{" "}
                      {MAX_RSA_HEADLINES}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={regenerate}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#dbeafe] bg-[#f4f8ff] px-3 py-1.5 text-sm font-semibold text-[#4285F4] transition hover:bg-[#e8f0fe]"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>

            {errors.headlines ? (
              <p className="text-xs font-medium text-red-500">
                {errors.headlines}
              </p>
            ) : null}
            {headlines.map((headline, index) => (
              <div key={`h-${index}`} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Headline {index + 1}
                    {index < MIN_RSA_HEADLINES ? (
                      <span className="text-red-500"> *</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <CharCount value={headline} max={HEADLINE_MAX} />
                    {index >= MIN_RSA_HEADLINES ? (
                      <button
                        type="button"
                        onClick={() => {
                          const next = headlines.filter((_, i) => i !== index);
                          updateAd({
                            headlines: padAdSlots(
                              next,
                              MIN_RSA_HEADLINES,
                              MAX_RSA_HEADLINES,
                            ),
                          });
                        }}
                        className="text-slate-400 transition hover:text-red-500"
                        aria-label={`Remove headline ${index + 1}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
                <input
                  className={inputClass(
                    index < MIN_RSA_HEADLINES && errors.headlines
                      ? errors.headlines
                      : undefined,
                  )}
                  value={headline}
                  maxLength={HEADLINE_MAX}
                  onChange={(e) => {
                    const next = [...headlines];
                    next[index] = e.target.value;
                    updateAd({ headlines: next });
                  }}
                />
              </div>
            ))}
            {headlines.length < MAX_RSA_HEADLINES ? (
              <button
                type="button"
                onClick={() => updateAd({ headlines: [...headlines, ""] })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4285F4] transition hover:text-[#1a73e8]"
              >
                <Plus className="size-4" aria-hidden />
                Add headline
              </button>
            ) : null}
          </div>

          {/* Descriptions */}
          <div className="space-y-4 border-t border-[#e8edf5] pt-5">
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
                <FileText className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#07111f]">
                      Descriptions
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      At least {MIN_RSA_DESCRIPTIONS} required · up to{" "}
                      {MAX_RSA_DESCRIPTIONS}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-slate-500">
                    {descriptions.length} / {MAX_RSA_DESCRIPTIONS}
                  </p>
                </div>
              </div>
            </div>
            {errors.descriptions ? (
              <p className="text-xs font-medium text-red-500">
                {errors.descriptions}
              </p>
            ) : null}
            {descriptions.map((description, index) => (
              <div key={`d-${index}`} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Description {index + 1}
                    {index < MIN_RSA_DESCRIPTIONS ? (
                      <span className="text-red-500"> *</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <CharCount value={description} max={DESCRIPTION_MAX} />
                    {index >= MIN_RSA_DESCRIPTIONS ? (
                      <button
                        type="button"
                        onClick={() => {
                          const next = descriptions.filter(
                            (_, i) => i !== index,
                          );
                          updateAd({
                            descriptions: padAdSlots(
                              next,
                              MIN_RSA_DESCRIPTIONS,
                              MAX_RSA_DESCRIPTIONS,
                            ),
                          });
                        }}
                        className="text-slate-400 transition hover:text-red-500"
                        aria-label={`Remove description ${index + 1}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
                <textarea
                  className={`${inputClass(
                    index < MIN_RSA_DESCRIPTIONS && errors.descriptions
                      ? errors.descriptions
                      : undefined,
                  )} min-h-[72px]`}
                  value={description}
                  maxLength={DESCRIPTION_MAX}
                  onChange={(e) => {
                    const next = [...descriptions];
                    next[index] = e.target.value;
                    updateAd({ descriptions: next });
                  }}
                />
              </div>
            ))}
            {descriptions.length < MAX_RSA_DESCRIPTIONS ? (
              <button
                type="button"
                onClick={() =>
                  updateAd({ descriptions: [...descriptions, ""] })
                }
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4285F4] transition hover:text-[#1a73e8]"
              >
                <Plus className="size-4" aria-hidden />
                Add description
              </button>
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
  const [editingBusinessInfo, setEditingBusinessInfo] = useState(false);
  const [calloutDraft, setCalloutDraft] = useState("");

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
      sitelinks: [],
      assetsGenerated: true,
    });
  }, [draft, draft.assetsGenerated, onChange]);

  const phoneReady = Boolean(draft.phoneNumber.trim() || draft.businessPhone.trim());
  const addressReady = Boolean(draft.businessAddress.trim());
  const hoursReady = Boolean(draft.businessHours.trim());

  const addCallout = () => {
    const next = calloutDraft.trim().slice(0, 25);
    if (!next || draft.callouts.includes(next)) return;
    onChange({ callouts: [...draft.callouts, next] });
    setCalloutDraft("");
  };

  return (
    <StepShell
      step={8}
      total={TOTAL_WIZARD_STEPS}
      title="Enhance your ad"
      description="Add short benefits that can appear with your ad. Business details are loaded from your profile."
    >
      <Panel className="space-y-4">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
            <Building2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#07111f]">
                  Business information
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Used for call extensions and location details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBusinessInfo((v) => !v)}
                className="shrink-0 text-xs font-bold text-[#4285F4] hover:underline"
              >
                {editingBusinessInfo ? "Done" : "Edit"}
              </button>
            </div>
          </div>
        </div>

        {!editingBusinessInfo ? (

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  label: "Phone",
                  value:
                    draft.phoneNumber || draft.businessPhone || "Not set",
                  ready: phoneReady,
                  Icon: Phone,
                  iconWrap: "bg-[#ecfdf5]",
                  iconColor: "text-emerald-600",
                },
                {
                  label: "Address",
                  value: draft.businessAddress || "Not set",
                  ready: addressReady,
                  Icon: MapPin,
                  iconWrap: "bg-[#eff6ff]",
                  iconColor: "text-[#4285F4]",
                },
                {
                  label: "Business Hours",
                  value: draft.businessHours || "Not set",
                  ready: hoursReady,
                  Icon: Clock,
                  iconWrap: "bg-[#fff7ed]",
                  iconColor: "text-orange-500",
                },
              ] as const
            ).map(({ label, value, ready, Icon, iconWrap, iconColor }) => (
              <div
                key={label}
                className="flex gap-3 rounded-2xl border border-[#e8edf5] bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.03)]"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconWrap} ${iconColor}`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {label}
                    {ready ? (
                      <Check className="size-3 text-emerald-600" aria-hidden />
                    ) : null}
                  </p>
                  <p
                    className={`mt-1 break-words text-sm font-semibold leading-snug ${
                      ready ? "text-[#07111f]" : "text-slate-400"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 border-t border-[#e8edf5] pt-4">
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5] text-emerald-600">
                <Phone className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
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
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#4285F4]">
                <MapPin className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Field label="Business address">
                  <input
                    className={inputClass()}
                    value={draft.businessAddress}
                    onChange={(e) =>
                      onChange({ businessAddress: e.target.value })
                    }
                    placeholder="123 Main Street"
                  />
                </Field>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff7ed] text-orange-500">
                <Clock className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
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
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel className="space-y-4">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
            <Megaphone className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-bold text-[#07111f]">Callouts</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Add short benefits that can appear with your ad.
              </p>
            </div>
            <ChipToggleGroup
              options={draft.callouts}
              values={draft.callouts}
              onChange={(callouts) => onChange({ callouts })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-[220px] flex-1 gap-2">
                <input
                  className={inputClass()}
                  value={calloutDraft}
                  maxLength={25}
                  onChange={(e) => setCalloutDraft(e.target.value)}
                  placeholder="e.g. Free Consultation"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCallout();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCallout}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(66,133,244,0.22)] transition hover:bg-[#1a73e8]"
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add
                </button>
              </div>
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
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4285F4] transition hover:text-[#1a73e8]"
              >
                <Sparkles className="size-4" aria-hidden />
                Refresh suggestions
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </StepShell>
  );
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  detail,
  onEdit,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  onEdit: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#e8edf5] py-4 last:border-b-0">
      <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-sm font-bold leading-snug text-[#07111f]">
              {value}
            </p>
            {detail ? (
              <p className="mt-0.5 line-clamp-2 break-all text-xs leading-relaxed text-slate-500">
                {detail}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[#4285F4] transition hover:bg-[#f4f8ff]"
          >
            Edit
          </button>
        </div>
        {/* Extra content (e.g. keyword chips) stays under the text, left-aligned */}
        {children ? <div className="mt-2.5">{children}</div> : null}
      </div>
    </div>
  );
}

export function StepReviewPublish({
  draft,
  onEditStep,
  publishing,
  publishProgress,
  publishPhase,
  publishStep,
  publishError,
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
  const destinationUrl = resolveCampaignDestinationUrl(draft);
  const destinationTitle = destinationLabel(draft);
  const destinationPrimary =
    draft.destinationType === "dealioo_funnel"
      ? draft.selectedFunnelName || "Dealioo Funnel"
      : destinationTitle;
  const destinationSecondary =
    draft.destinationType === "dealioo_funnel"
      ? destinationUrl || undefined
      : destinationUrl && destinationUrl !== destinationTitle
        ? destinationUrl
        : undefined;

  const headlineCount = draft.ads[0]?.headlines.filter(Boolean).length || 0;
  const descriptionCount =
    draft.ads[0]?.descriptions.filter(Boolean).length || 0;

  const clampedProgress = Math.min(
    100,
    Math.max(0, publishSuccess ? 100 : publishProgress || 0),
  );
  const activeStepIndex = resolveGooglePublishStepIndex(publishStep);
  const showProgress = publishing || publishSuccess || clampedProgress > 0;
  const hasPublishFailure =
    Boolean(publishError?.trim()) && !publishing && !publishSuccess;
  const publishStateLabel = publishSuccess
    ? "Published"
    : publishing
      ? "Publishing"
      : hasPublishFailure
        ? "Publish failed"
        : "Ready to publish";

  return (
    <StepShell
      step={9}
      total={TOTAL_WIZARD_STEPS}
      title={hasPublishFailure ? "Publish did not finish" : "Ready to launch?"}
      description={
        hasPublishFailure
          ? "Read why Google rejected this publish, fix the draft using Edit on any row below, then try again."
          : "Review your campaign summary, then publish. Dealioo handles the Google Ads setup for you."
      }
    >
      <div className="space-y-5 pb-2">
        {hasPublishFailure ? (
          <section
            className="rounded-2xl border border-red-200 bg-red-50/90 p-5 shadow-sm"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-red-950">
                  Why this campaign failed
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-red-900">
                  {publishError}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-red-800/90">
                  Check the matching step in your draft (name, destination URL,
                  ad copy, locations, etc.), make the fix, then click{" "}
                  <span className="font-semibold">Try again</span> below.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEditStep(2)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-950 transition hover:bg-red-50"
                  >
                    Edit setup
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditStep(7)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-950 transition hover:bg-red-50"
                  >
                    Edit ad copy
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditStep(4)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-950 transition hover:bg-red-50"
                  >
                    Edit locations
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#4285F4]">
                <Rocket className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#4285F4]">
                  {publishStateLabel}
                </p>
                <h3 className="mt-2 truncate text-xl font-extrabold tracking-tight text-[#07111f] sm:text-2xl">
                  {draft.campaignName || "Untitled campaign"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {goalTitle}
                  {draft.businessName ? ` · ${draft.businessName}` : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
              <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Daily budget
                </p>
                <p className="mt-1 text-sm font-bold text-[#07111f]">
                  {budgetLabel}
                </p>
              </div>
              <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Est. monthly
                </p>
                <p className="mt-1 text-sm font-bold text-[#07111f]">
                  {metrics.monthlySpend}
                </p>
              </div>
            </div>
          </div>
        </section>

        {showProgress ? (
          <section className="overflow-hidden rounded-2xl border border-[#d2e3fc] bg-[#f8fbff] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#07111f]">
                {publishSuccess
                  ? "Campaign created"
                  : publishing
                    ? "Creating your campaign..."
                    : "Publish progress"}
              </p>
              <span className="text-xs font-bold tabular-nums text-[#4285F4]">
                {clampedProgress}%
              </span>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-[#4285F4]/15"
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
                ? "Pending Google Review — your campaign is submitted."
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
                            : "bg-white text-slate-400 ring-1 ring-[#d2e3fc]"
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

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
          {/* One checklist card instead of seven heavy sections */}
          <Panel className="!p-0 overflow-hidden">
            <div className="border-b border-[#e8edf5] px-5 py-4">
              <p className="text-sm font-bold text-[#07111f]">
                Campaign checklist
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Everything looks good? Edit any row, then publish.
              </p>
            </div>
            <div className="px-5">
              <ReviewRow
                icon={Flag}
                label="Goal & name"
                value={`${goalTitle} · ${draft.campaignName || "Untitled"}`}
                onEdit={() => onEditStep(1)}
              />
              <ReviewRow
                icon={Link2}
                label="Destination"
                value={destinationPrimary}
                detail={destinationSecondary}
                onEdit={() => onEditStep(2)}
              />
              <ReviewRow
                icon={Wallet}
                label="Budget & dates"
                value={`${budgetLabel} · starts ${draft.startDate || "today"}`}
                detail={
                  draft.endDate
                    ? `Ends ${draft.endDate}`
                    : "Runs continuously"
                }
                onEdit={() => onEditStep(3)}
              />
              <ReviewRow
                icon={MapPin}
                label="Locations & languages"
                value={locationsLabel}
                detail={draft.languages.join(", ") || undefined}
                onEdit={() => onEditStep(4)}
              />
              <ReviewRow
                icon={Users}
                label="Customers"
                value={draft.idealCustomers.join(", ") || "Not set"}
                onEdit={() => onEditStep(5)}
              />
              <ReviewRow
                icon={ShoppingBag}
                label="Products & keywords"
                value={
                  draft.productsServices.join(", ") || "No products added"
                }
                detail={`${keywords.length} keyword${keywords.length === 1 ? "" : "s"} selected`}
                onEdit={() => onEditStep(6)}
              >
                {keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.slice(0, 8).map((word) => (
                      <span
                        key={word}
                        className="rounded-full border border-[#dbeafe] bg-[#f4f8ff] px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#4285F4]"
                      >
                        {word}
                      </span>
                    ))}
                    {keywords.length > 8 ? (
                      <span className="self-center px-1 text-[0.7rem] font-semibold text-slate-400">
                        +{keywords.length - 8} more
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </ReviewRow>
              <ReviewRow
                icon={Megaphone}
                label="Ad copy"
                value={`${headlineCount} headline${headlineCount === 1 ? "" : "s"} · ${descriptionCount} description${descriptionCount === 1 ? "" : "s"}`}
                onEdit={() => onEditStep(7)}
              />
              <ReviewRow
                icon={Phone}
                label="Enhancements"
                value={
                  [
                    draft.phoneNumber || draft.businessPhone || null,
                    draft.callouts.length
                      ? `${draft.callouts.length} callouts`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No extras yet"
                }
                detail={draft.businessAddress || undefined}
                onEdit={() => onEditStep(8)}
              />
            </div>
          </Panel>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <Panel className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f8ff] text-[#4285F4]">
                  <ImageIcon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#07111f]">
                        Ad preview
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        How it may look in Google Search
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditStep(7)}
                      className="shrink-0 text-xs font-bold text-[#4285F4] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
              {draft.ads[0] ? (
                <AdLivePreview
                  ad={draft.ads[0]}
                  businessName={draft.businessName}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-[#07111f]">
                    No ad creative yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Go back to Ads and add headlines.
                  </p>
                </div>
              )}
            </Panel>
          </aside>
        </div>

        {/* Full-width below checklist + preview — avoids cramped sidebar 2-col fields */}
        <AdvancedOptions draft={draft} onChange={onChange} />
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
