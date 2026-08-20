"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  MoreVertical,
} from "lucide-react";
import type { CampaignGoalId } from "@/app/components/google-ads/campaign-builder/types";
import {
  getGoogleAdsConversionGoals,
  type GoogleAdsConversionGoal,
} from "@/app/services/google-ads/get-google-ads-conversion-goals";

type AccountConversionGoalsPanelProps = {
  businessId: number;
  objectiveLabel: string;
  campaignGoal: CampaignGoalId;
  onChange?: (
    patch: Partial<{
      selectedConversionGoals: Array<{
        category: string;
        origin: string;
        accountDefault?: boolean;
        name?: string;
      }>;
      conversionGoals: string;
    }>,
  ) => void;
};

const GOAL_CATEGORY_FILTERS: Record<CampaignGoalId, string[]> = {
  SALES: [
    "PURCHASE",
    "ADD_TO_CART",
    "BEGIN_CHECKOUT",
    "SUBSCRIBE_PAID",
    "STORE_SALE",
  ],
  LEADS: [
    "LEAD",
    "SIGNUP",
    "CONTACT",
    "SUBMIT_LEAD_FORM",
    "BOOK_APPOINTMENT",
    "REQUEST_QUOTE",
    "PHONE_CALL_LEAD",
    "IMPORTED_LEAD",
    "QUALIFIED_LEAD",
    "CONVERTED_LEAD",
  ],
  WEBSITE_TRAFFIC: ["PAGE_VIEW", "OUTBOUND_CLICK", "ENGAGEMENT"],
  AWARENESS: ["ENGAGEMENT", "PAGE_VIEW", "YOUTUBE_VIEW"],
  LOCAL_VISITS: [
    "STORE_VISIT",
    "GET_DIRECTIONS",
    "STORE_SALE",
    "PHONE_CALL_LEAD",
    "CONTACT",
    "LEAD",
  ],
  APP_PROMOTION: ["DOWNLOAD", "ENGAGEMENT", "PURCHASE", "SIGNUP"],
};

function filterGoalsForObjective(
  goals: GoogleAdsConversionGoal[],
  campaignGoal: CampaignGoalId,
): GoogleAdsConversionGoal[] {
  const allowed = new Set(GOAL_CATEGORY_FILTERS[campaignGoal] ?? []);
  if (allowed.size === 0) {
    return goals;
  }

  const matched = goals.filter((goal) => allowed.has(goal.category));
  if (matched.length > 0) {
    return matched;
  }

  const accountDefaults = goals.filter((goal) => goal.accountDefault);
  return accountDefaults.length > 0 ? accountDefaults : goals;
}

export function AccountConversionGoalsPanel({
  businessId,
  objectiveLabel,
  campaignGoal,
  onChange,
}: AccountConversionGoalsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoogleAdsConversionGoal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (businessId < 1) {
        setLoading(false);
        setGoals([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getGoogleAdsConversionGoals(businessId);
        if (cancelled) {
          return;
        }
        const nextGoals = Array.isArray(response.goals) ? response.goals : [];
        setGoals(nextGoals);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setGoals([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load conversion goals.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const visibleGoals = useMemo(
    () => filterGoalsForObjective(goals, campaignGoal),
    [goals, campaignGoal],
  );

  useEffect(() => {
    if (!onChangeRef.current || loading || error) {
      return;
    }

    const selectedConversionGoals = visibleGoals.map((goal) => ({
      category: goal.category,
      origin: goal.origin,
      accountDefault: goal.accountDefault,
      name: goal.name,
    }));
    const conversionGoals = visibleGoals.map((goal) => goal.name).join(", ");

    onChangeRef.current({
      selectedConversionGoals,
      conversionGoals,
    });
  }, [visibleGoals, loading, error, campaignGoal]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#e8edf5] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin text-[#4285F4]" aria-hidden />
          Loading conversion goals from your Google Ads account…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-[#e8edf5] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-[#07111f]">
          Use these conversion goals to improve {objectiveLabel}
        </h2>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
      </section>
    );
  }

  if (visibleGoals.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#e8edf5] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[#07111f]">
        Use these conversion goals to improve {objectiveLabel}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
        Conversion goals labeled as account default will use data from all of
        your campaigns to improve your bid strategy and campaign performance,
        even if they don&apos;t seem directly related to {objectiveLabel}.
      </p>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[36rem]">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-3 border-b border-[#e8edf5] px-3 pb-2 text-xs font-medium text-slate-500">
            <span>Conversion Goals</span>
            <span>Conversion Source</span>
            <span>Conversion Actions</span>
            <span className="sr-only">More</span>
          </div>

          <div className="mt-3 space-y-2">
            {visibleGoals.map((goal) => (
              <div
                key={`${goal.category}-${goal.origin}`}
                className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-xl border border-[#e8edf5] bg-white px-3 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f1f3f4] text-slate-500">
                    <CreditCard className="size-4" aria-hidden />
                  </span>
                  <p className="truncate text-sm text-[#07111f]">
                    <span className="font-medium">{goal.name}</span>
                    {goal.accountDefault ? (
                      <span className="text-slate-500"> (account default)</span>
                    ) : null}
                  </p>
                </div>

                <p className="text-sm text-[#07111f]">{goal.sourceLabel}</p>

                <div className="inline-flex items-center gap-1.5 text-sm text-[#07111f]">
                  <AlertTriangle
                    className="size-4 shrink-0 text-[#e37400]"
                    aria-hidden
                  />
                  <span className="underline decoration-dashed decoration-[#dadce0] underline-offset-2">
                    {goal.actionCount}{" "}
                    {goal.actionCount === 1 ? "action" : "actions"}
                  </span>
                </div>

                <span
                  className="inline-flex size-8 items-center justify-center rounded-full text-slate-400"
                  aria-hidden
                >
                  <MoreVertical className="size-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SalesConversionGoalsPanel({
  businessId,
  objectiveLabel = "Sales",
  campaignGoal = "SALES",
}: {
  businessId: number;
  objectiveLabel?: string;
  campaignGoal?: CampaignGoalId;
}) {
  return (
    <AccountConversionGoalsPanel
      businessId={businessId}
      objectiveLabel={objectiveLabel}
      campaignGoal={campaignGoal}
    />
  );
}
