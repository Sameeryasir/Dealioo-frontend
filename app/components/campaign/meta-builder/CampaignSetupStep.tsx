"use client";

import { useEffect, useState } from "react";
import { DollarSign, Flag, Target } from "lucide-react";
import type {
  CampaignStepData,
  MetaBidStrategy,
  MetaBudgetStrategy,
  MetaCampaignBudgetType,
  MetaCampaignObjective,
  MetaCampaignStatus,
  MetaSpecialAdCategory,
} from "@/app/lib/meta-campaign-builder-types";
import {
  BuilderCard,
  BuilderErrorAlert,
  BuilderField,
  BuilderFooter,
  BuilderRadioCard,
  BuilderSelect,
  BuilderStatusToggle,
  BuilderStepHeader,
  builderInputClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import {
  DEFAULT_META_ACCOUNT_CURRENCY,
  formatMetaAccountMoney,
  normalizeMetaCurrencyCode,
} from "@/app/lib/meta-account-currency";

const OBJECTIVES: { value: MetaCampaignObjective; label: string }[] = [
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Sales" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
];

const SPECIAL_CATEGORIES: {
  value: MetaSpecialAdCategory;
  label: string;
}[] = [
  { value: "HOUSING", label: "Housing" },
  { value: "EMPLOYMENT", label: "Employment" },
  { value: "CREDIT", label: "Credit" },
  {
    value: "ISSUES_ELECTIONS_POLITICS",
    label: "Social issues, elections or politics",
  },
  {
    value: "FINANCIAL_PRODUCTS_SERVICES",
    label: "Financial products & services",
  },
];

type CampaignSetupStepProps = {
  defaultName?: string;
  preferredObjective?: MetaCampaignObjective | null;
  initialData?: CampaignStepData | null;
  accountCurrency?: string;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (data: CampaignStepData) => void | Promise<void>;
  onWorkingChange?: (data: CampaignStepData) => void;
};

export function CampaignSetupStep({
  defaultName = "",
  preferredObjective = null,
  initialData,
  accountCurrency = DEFAULT_META_ACCOUNT_CURRENCY,
  saving,
  error,
  onBack,
  onSave,
  onWorkingChange,
}: CampaignSetupStepProps) {
  const currencyCode = normalizeMetaCurrencyCode(accountCurrency);
  const [name, setName] = useState(initialData?.name ?? defaultName);
  const [objective, setObjective] = useState<MetaCampaignObjective>(
    initialData?.objective ?? preferredObjective ?? "OUTCOME_TRAFFIC",
  );
  const [specialNone, setSpecialNone] = useState(
    !initialData?.specialAdCategories?.length,
  );
  const [specialCategories, setSpecialCategories] = useState<
    MetaSpecialAdCategory[]
  >(initialData?.specialAdCategories ?? []);
  const [budgetStrategy, setBudgetStrategy] = useState<MetaBudgetStrategy>(
    initialData?.budgetStrategy ??
      (initialData?.campaignBudgetOptimization ? "campaign" : "adset"),
  );
  const [campaignBudgetType, setCampaignBudgetType] =
    useState<MetaCampaignBudgetType>(
      initialData?.campaignBudgetType ?? "daily",
    );
  const [campaignBudgetAmount, setCampaignBudgetAmount] = useState(() => {
    if (initialData?.campaignDailyBudget != null) {
      return initialData.campaignDailyBudget.toString();
    }
    if (initialData?.campaignLifetimeBudget != null) {
      return initialData.campaignLifetimeBudget.toString();
    }
    return "25";
  });
  const [campaignBidStrategy, setCampaignBidStrategy] =
    useState<MetaBidStrategy>(
      initialData?.campaignBidStrategy ?? "LOWEST_COST_WITHOUT_CAP",
    );
  const [showAdvancedBudget, setShowAdvancedBudget] = useState(false);
  const [status, setStatus] = useState<MetaCampaignStatus>(
    initialData?.status ?? "PAUSED",
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const inputClass = builderInputClass;

  const toggleCategory = (value: MetaSpecialAdCategory) => {
    setSpecialNone(false);
    setSpecialCategories((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleSpecialNone = (checked: boolean) => {
    setSpecialNone(checked);
    if (checked) setSpecialCategories([]);
  };

  const cboEnabled = budgetStrategy === "campaign";

  useEffect(() => {
    if (!onWorkingChange) return;

    const amount = Number.parseFloat(campaignBudgetAmount);

    onWorkingChange({
      name: name.trim() || defaultName || "Untitled campaign",
      buyingType: "AUCTION",
      objective,
      specialAdCategories: specialNone ? [] : specialCategories,
      budgetStrategy,
      campaignBudgetOptimization: cboEnabled,
      campaignBudgetType: cboEnabled ? campaignBudgetType : undefined,
      campaignDailyBudget:
        cboEnabled &&
        campaignBudgetType === "daily" &&
        Number.isFinite(amount)
          ? amount
          : undefined,
      campaignLifetimeBudget:
        cboEnabled &&
        campaignBudgetType === "lifetime" &&
        Number.isFinite(amount)
          ? amount
          : undefined,
      campaignBidStrategy,
      budgetScheduling: "none",
      status,
    });
  }, [
    budgetStrategy,
    campaignBidStrategy,
    campaignBudgetAmount,
    campaignBudgetType,
    cboEnabled,
    defaultName,
    name,
    objective,
    onWorkingChange,
    specialCategories,
    specialNone,
    status,
  ]);

  const parsedBudgetAmount = Number.parseFloat(campaignBudgetAmount);
  const budgetHelperText =
    cboEnabled &&
    campaignBudgetType === "daily" &&
    Number.isFinite(parsedBudgetAmount) &&
    parsedBudgetAmount > 0
      ? `You'll spend an average of ${formatMetaAccountMoney(parsedBudgetAmount, currencyCode)} per day. Your maximum daily spend is about ${formatMetaAccountMoney(parsedBudgetAmount * 1.75, currencyCode)} and your maximum weekly spend is about ${formatMetaAccountMoney(parsedBudgetAmount * 7, currencyCode)}.`
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setFieldErrors({});

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldErrors({ name: "Campaign name is required." });
      return;
    }

    let daily: number | undefined;
    let lifetime: number | undefined;

    if (cboEnabled) {
      const amount = Number.parseFloat(campaignBudgetAmount);
      if (!Number.isFinite(amount) || amount < 1) {
        setLocalError(
          `Campaign budget must be at least ${formatMetaAccountMoney(1, currencyCode)}.`,
        );
        return;
      }
      if (campaignBudgetType === "daily") {
        daily = amount;
      } else {
        lifetime = amount;
      }
    }

    await onSave({
      name: trimmedName,
      buyingType: "AUCTION",
      objective,
      specialAdCategories: specialNone ? [] : specialCategories,
      budgetStrategy,
      campaignBudgetOptimization: cboEnabled,
      campaignBudgetType: cboEnabled ? campaignBudgetType : undefined,
      campaignDailyBudget: daily,
      campaignLifetimeBudget: lifetime,
      campaignBidStrategy,
      budgetScheduling: "none",
      status,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 pb-2">
      <BuilderStepHeader
        step={1}
        title="Campaign setup"
        description="Define your campaign goal and budget strategy. Everything here is saved as a draft, Meta is only contacted when you publish on Step 4."
        badge="Draft only"
      />

      <BuilderCard title="Campaign details" icon={Target}>
        <BuilderField label="Campaign name" required error={fieldErrors.name} hint="Use a name you'll recognize in Ads Manager.">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Summer lunch deal"
          />
        </BuilderField>

        <BuilderField label="Buying type">
          <input
            readOnly
            value="Auction"
            className={`${inputClass} bg-[#f4f8ff] text-slate-500`}
          />
        </BuilderField>

        <BuilderField label="Objective" hint="What you want people to do when they see your ad.">
          <BuilderSelect
            aria-label="Objective"
            value={objective}
            options={OBJECTIVES}
            onChange={setObjective}
          />
        </BuilderField>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#07111f]">
            Special ad categories
          </legend>
          <label className="flex items-center gap-2.5 rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/50 px-3 py-2.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={specialNone}
              onChange={(e) => handleSpecialNone(e.target.checked)}
              className="size-4 rounded border-[#dbeafe] text-[#1877F2]"
            />
            None (default)
          </label>
          {!specialNone ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {SPECIAL_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-2 rounded-xl border border-[#e8edf5] px-3 py-2.5 text-sm transition hover:border-[#dbeafe]"
                >
                  <input
                    type="checkbox"
                    checked={specialCategories.includes(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                    className="size-4 rounded border-[#dbeafe] text-[#1877F2]"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          ) : null}
        </fieldset>
      </BuilderCard>

      <BuilderCard
        title="Budget"
        description="Choose how spend is managed across your ad sets"
        icon={DollarSign}
      >
        <div className="space-y-3">
          <BuilderRadioCard
            name="budget-strategy"
            selected={budgetStrategy === "campaign"}
            title="Campaign budget"
            description="Automatically distribute your budget to the best opportunities across your campaign."
            onSelect={() => setBudgetStrategy("campaign")}
          />
          <BuilderRadioCard
            name="budget-strategy"
            selected={budgetStrategy === "adset"}
            title="Ad set budget"
            description="Set different bid strategies or budget schedules for each ad set on Step 2."
            onSelect={() => setBudgetStrategy("adset")}
          />
        </div>

        <div className="space-y-4 border-t border-[#e8edf5] pt-4">
          {cboEnabled ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                <label className="block text-sm">
                  <span className="font-medium text-[#07111f]">Budget type</span>
                  <select
                    value={campaignBudgetType}
                    onChange={(e) =>
                      setCampaignBudgetType(
                        e.target.value as MetaCampaignBudgetType,
                      )
                    }
                    className={`${inputClass} mt-1.5`}
                  >
                    <option value="daily">Daily budget</option>
                    <option value="lifetime">Lifetime budget</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-[#07111f]">Amount</span>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                      {currencyCode}
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={campaignBudgetAmount}
                      onChange={(e) => setCampaignBudgetAmount(e.target.value)}
                      className={`${inputClass} pl-14`}
                      placeholder="25"
                    />
                  </div>
                </label>
              </div>

              {budgetHelperText ? (
                <p className="text-xs leading-relaxed text-slate-500">
                  {budgetHelperText}
                </p>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl bg-[#f4f8ff] px-3 py-2.5 text-xs text-slate-500">
              Budget amounts will be set per ad set on Step 2. You can still set
              campaign-level bid strategy below.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowAdvancedBudget((prev) => !prev)}
            className="text-sm font-semibold text-[#1877F2] hover:underline"
          >
            {showAdvancedBudget ? "Hide settings" : "Show settings"}
          </button>

          {showAdvancedBudget ? (
            <div className="space-y-4 rounded-xl bg-[#f4f8ff] p-4">
              <label className="block text-sm">
                <span className="font-medium text-[#07111f]">
                  Campaign bid strategy
                </span>
                <select
                  value={campaignBidStrategy}
                  onChange={(e) =>
                    setCampaignBidStrategy(
                      e.target.value as MetaBidStrategy,
                    )
                  }
                  className={inputClass}
                >
                  <option value="LOWEST_COST_WITHOUT_CAP">
                    Highest volume (lowest cost)
                  </option>
                  <option value="LOWEST_COST_WITH_BID_CAP">
                    Bid cap
                  </option>
                  <option value="COST_CAP">Cost cap</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </BuilderCard>

      <BuilderCard title="Campaign status" icon={Flag}>
        <BuilderStatusToggle
          value={status}
          onChange={(v) => setStatus(v as MetaCampaignStatus)}
          options={[
            {
              value: "PAUSED",
              label: "Paused (recommended)",
              hint: "Review in Ads Manager before going live",
            },
            { value: "ACTIVE", label: "Active", hint: "Start delivery when published" },
          ]}
        />
      </BuilderCard>

      {localError || error ? (
        <BuilderErrorAlert message={localError ?? error ?? ""} />
      ) : null}

      <BuilderFooter
        onBack={onBack}
        primaryLabel={saving ? "Saving draft…" : "Save & continue to Ad Set"}
        primaryLoading={saving}
        primaryDisabled={saving}
        primaryDisabledReason={saving ? "Saving your campaign draft…" : undefined}
      />
    </form>
  );
}
