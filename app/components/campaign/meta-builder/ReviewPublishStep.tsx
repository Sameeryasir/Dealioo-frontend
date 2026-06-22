"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import {
  getPublishMetaCampaignDiagnostic,
  type PublishMetaCampaignDiagnostic,
} from "@/app/services/facebook/meta-campaign-draft";
import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
} from "@/app/lib/meta-campaign-builder-types";
import {
  BuilderErrorAlert,
  BuilderFooter,
  BuilderStepHeader,
} from "@/app/components/campaign/meta-builder/builder-ui";
import { AdCreativePreview } from "@/app/components/campaign/meta-builder/AdCreativePreview";
import { getFacebookPages } from "@/app/services/facebook/get-facebook-pages";
import {
  formatAdSetBudget,
  formatAudience,
  formatBidStrategy,
  formatCboBudget,
  formatCreativeFormat,
  formatCta,
  formatObjective,
  formatPlacements,
  formatSchedule,
  getCreativePreviewUrl,
} from "@/app/lib/meta-review-helpers";

type ReviewPublishStepProps = {
  restaurantId: number;
  draftId: string;
  campaignData: CampaignStepData;
  adSetData: AdSetStepData;
  adCreativeData: AdCreativeStepData;
  publishing: boolean;
  publishError: string | null;
  partialPublish?: {
    metaCampaignId?: string | null;
    metaAdsetId?: string | null;
    metaCreativeId?: string | null;
    previousError?: string | null;
  };
  publishSuccess: {
    metaCampaignId: string;
    metaAdsetId: string;
    metaCreativeId: string;
    metaAdId: string;
    adsManagerUrl: string;
    message: string;
  } | null;
  onBack: () => void;
  onPrevious: () => void;
  onPublish: () => void | Promise<void>;
};

function SummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50/80 to-white px-5 py-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          {title}
        </h3>
      </div>
      <dl className="space-y-3 p-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-b border-zinc-50 pb-3 last:border-0 last:pb-0 sm:grid-cols-[10rem_1fr]"
          >
            <dt className="text-sm font-medium text-zinc-500">{row.label}</dt>
            <dd className="text-sm font-semibold text-zinc-900 break-words">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReviewPublishStep({
  restaurantId,
  draftId,
  campaignData,
  adSetData,
  adCreativeData,
  publishing,
  publishError,
  partialPublish,
  publishSuccess,
  onBack,
  onPrevious,
  onPublish,
}: ReviewPublishStepProps) {
  const [facebookPageName, setFacebookPageName] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<PublishMetaCampaignDiagnostic | null>(
    null,
  );
  const [diagnosticLoading, setDiagnosticLoading] = useState(true);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  useEffect(() => {
    void getPublishMetaCampaignDiagnostic(restaurantId, draftId)
      .then((report) => {
        setDiagnostic(report);
        console.group("[MetaPublish] Review step preflight");
        console.log(report);
        console.groupEnd();
      })
      .catch((err) => {
        setDiagnosticError(
          err instanceof Error ? err.message : "Could not run publish diagnostic.",
        );
      })
      .finally(() => setDiagnosticLoading(false));
  }, [draftId, restaurantId]);

  useEffect(() => {
    void getFacebookPages(restaurantId)
      .then((pages) => {
        const match = pages.find((p) => p.id === adCreativeData.facebookPageId);
        setFacebookPageName(match?.name ?? adCreativeData.facebookPageId);
      })
      .catch(() => {
        setFacebookPageName(adCreativeData.facebookPageId);
      });
  }, [adCreativeData.facebookPageId, restaurantId]);

  const previewUrl = getCreativePreviewUrl(adCreativeData);
  const specialCategories =
    campaignData.specialAdCategories.length > 0
      ? campaignData.specialAdCategories.join(", ")
      : "None";

  return (
    <div className="space-y-5 pb-2">
      <BuilderStepHeader
        step={4}
        title="Review & Publish"
        description="Confirm everything below, then publish once to Meta. Campaign → Ad Set → Media → Creative → Ad."
        badge="One-time publish"
      />

      {!publishSuccess ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
            Publish preflight check
          </h3>
          {diagnosticLoading ? (
            <p className="mt-2 text-sm text-zinc-500">Running diagnostic…</p>
          ) : null}
          {diagnosticError ? (
            <p className="mt-2 text-sm text-red-700">{diagnosticError}</p>
          ) : null}
          {diagnostic ? (
            <div className="mt-3 space-y-2">
              <p
                className={`text-sm font-semibold ${
                  diagnostic.overallSuccess ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {diagnostic.overallSuccess
                  ? "Ready to publish — all preflight checks passed."
                  : `Blocked at: ${diagnostic.firstFailingStep ?? "unknown"}`}
              </p>
              {!diagnostic.overallSuccess && diagnostic.recommendedFix ? (
                <p className="text-sm text-zinc-600">{diagnostic.recommendedFix}</p>
              ) : null}
              <ul className="space-y-1.5">
                {diagnostic.steps
                  .filter((step) => step.status !== "skipped")
                  .map((step) => (
                    <li
                      key={step.name}
                      className="flex items-start gap-2 text-sm text-zinc-700"
                    >
                      {step.status === "success" ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                      )}
                      <span>
                        <span className="font-medium">{step.label}</span>
                        {step.message ? (
                          <span className="block text-zinc-500">{step.message}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
              </ul>
              <dl className="mt-3 grid gap-1 rounded-xl bg-zinc-50 p-3 font-mono text-xs text-zinc-600">
                <div>ad_account_id: {diagnostic.connection.adAccountId ?? "—"}</div>
                <div>facebook_user_id: {diagnostic.connection.metaUserId ?? "—"}</div>
                <div>page_id: {diagnostic.connection.facebookPageId ?? "—"}</div>
                <div>
                  permissions:{" "}
                  {Object.entries(diagnostic.permissions)
                    .filter(([key]) =>
                      ["ads_management", "ads_read", "business_management"].includes(
                        key,
                      ),
                    )
                    .map(([key, val]) => `${key}=${val}`)
                    .join(", ") || "—"}
                </div>
              </dl>
            </div>
          ) : null}
        </section>
      ) : null}

      {partialPublish?.metaCampaignId && !publishSuccess ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Previous publish was incomplete</p>
          <p className="mt-1 text-sm text-amber-800">
            Facebook already has part of this campaign. That is why you may see a
            Campaign and Ad Set in Ads Manager but <strong>no Ad</strong> yet.
          </p>
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-amber-900">
            {partialPublish.metaCampaignId ? (
              <li>Campaign: {partialPublish.metaCampaignId}</li>
            ) : null}
            {partialPublish.metaAdsetId ? (
              <li>Ad Set: {partialPublish.metaAdsetId}</li>
            ) : null}
            {partialPublish.metaCreativeId ? (
              <li>Creative: {partialPublish.metaCreativeId}</li>
            ) : null}
            {!partialPublish.metaCreativeId ? <li>Ad: not created yet</li> : null}
          </ul>
          {partialPublish.previousError ? (
            <p className="mt-3 text-sm text-amber-900">{partialPublish.previousError}</p>
          ) : null}
        </div>
      ) : null}

      {publishSuccess ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="space-y-2">
              <p className="font-semibold text-emerald-900">{publishSuccess.message}</p>
              <p className="text-sm text-emerald-800">
                Your ad was created in Meta as <strong>Paused</strong>. All four Meta
                IDs were returned successfully.
              </p>
              <ul className="space-y-1 font-mono text-xs text-emerald-900">
                <li>Campaign: {publishSuccess.metaCampaignId}</li>
                <li>Ad Set: {publishSuccess.metaAdsetId}</li>
                <li>Creative: {publishSuccess.metaCreativeId}</li>
                <li>Ad: {publishSuccess.metaAdId}</li>
              </ul>
              <a
                href={publishSuccess.adsManagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#1877F2] hover:underline"
              >
                Open in Ads Manager
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <SummaryCard
        title="Campaign summary"
        rows={[
          { label: "Campaign name", value: campaignData.name },
          { label: "Objective", value: formatObjective(campaignData.objective) },
          { label: "Buying type", value: campaignData.buyingType },
          { label: "Special ad category", value: specialCategories },
          { label: "Status", value: campaignData.status },
          { label: "CBO budget", value: formatCboBudget(campaignData) },
        ]}
      />

      <SummaryCard
        title="Ad set summary"
        rows={[
          { label: "Ad set name", value: adSetData.name },
          { label: "Budget", value: formatAdSetBudget(campaignData, adSetData) },
          { label: "Schedule", value: formatSchedule(adSetData) },
          { label: "Optimization goal", value: adSetData.optimizationGoal },
          { label: "Destination type", value: adSetData.destinationType },
          { label: "Audience", value: formatAudience(adSetData) },
          { label: "Placements", value: formatPlacements(adSetData) },
          { label: "Bid strategy", value: formatBidStrategy(adSetData.bidStrategy) },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50/80 to-white px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Ad summary
          </h3>
        </div>
        <div className="p-5">
        <dl className="space-y-3">
          {[
            { label: "Ad name", value: adCreativeData.name },
            {
              label: "Facebook Page",
              value: facebookPageName ?? adCreativeData.facebookPageId,
            },
            {
              label: "Instagram account",
              value: adCreativeData.instagramActorId?.trim() || "—",
            },
            {
              label: "Creative format",
              value: formatCreativeFormat(adCreativeData.creativeFormat),
            },
            { label: "Primary text", value: adCreativeData.primaryText },
            { label: "Headline", value: adCreativeData.headline ?? "—" },
            { label: "Description", value: adCreativeData.description ?? "—" },
            { label: "CTA", value: formatCta(adCreativeData.callToAction) },
            { label: "Landing page", value: adCreativeData.destinationUrl ?? "—" },
            {
              label: "Tracking parameters",
              value: adCreativeData.urlParameters?.trim() || "—",
            },
          ].map((row) => (
            <div key={row.label} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-sm font-medium text-zinc-500">{row.label}</dt>
              <dd className="text-sm text-zinc-900 break-words">{row.value}</dd>
            </div>
          ))}
        </dl>

        {previewUrl ? (
          <div className="mt-4 max-w-xs">
            <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
              Media preview
            </p>
            <AdCreativePreview
              placement="facebook_feed"
              primaryText={adCreativeData.primaryText}
              headline={adCreativeData.headline ?? ""}
              description={adCreativeData.description}
              imageUrl={previewUrl}
              displayLink={adCreativeData.displayLink}
              callToAction={adCreativeData.callToAction}
            />
          </div>
        ) : null}
        </div>
      </section>

      {publishError ? (
        <BuilderErrorAlert message={`Publish failed: ${publishError}`} />
      ) : null}

      {!publishSuccess ? (
        <BuilderFooter
          onBack={onBack}
          secondaryLabel="Back"
          onSecondary={onPrevious}
          primaryLabel={publishing ? "Publishing to Meta…" : "Publish to Meta"}
          primaryLoading={publishing}
          primaryDisabled={publishing}
          primaryType="button"
          onPrimary={() => void onPublish()}
        />
      ) : (
        <BuilderFooter
          onBack={onBack}
          backLabel="Close"
          primaryLabel="Done"
          primaryType="button"
          onPrimary={onBack}
        />
      )}
    </div>
  );
}
