"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
} from "@/app/lib/meta-campaign-builder-types";
import {
  BuilderErrorAlert,
  BuilderFooter,
  BuilderStepHeader,
  BuilderSuccessAlert,
  BuilderSummaryCard,
  BuilderWarningAlert,
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
  getCreativeMediaLinks,
  getCreativePreviewUrl,
} from "@/app/lib/meta-review-helpers";

type ReviewPublishStepProps = {
  businessId: number;
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
  onRefreshStatus?: () => void | Promise<void>;
  refreshingStatus?: boolean;
};

export function ReviewPublishStep({
  businessId,
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
  onRefreshStatus,
  refreshingStatus = false,
}: ReviewPublishStepProps) {
  const [facebookPageName, setFacebookPageName] = useState<string | null>(null);

  useEffect(() => {
    void getFacebookPages(businessId)
      .then((pages) => {
        const match = pages.find((p) => p.id === adCreativeData.facebookPageId);
        setFacebookPageName(match?.name ?? adCreativeData.facebookPageId);
      })
      .catch(() => {
        setFacebookPageName(adCreativeData.facebookPageId);
      });
  }, [adCreativeData.facebookPageId, businessId]);

  const previewUrl = getCreativePreviewUrl(adCreativeData);
  const mediaLinks = getCreativeMediaLinks(adCreativeData);
  const specialCategories =
    campaignData.specialAdCategories.length > 0
      ? campaignData.specialAdCategories.join(", ")
      : "None";

  return (
    <div className="space-y-5 pb-2">
      <BuilderStepHeader
        step={4}
        title="Review & Publish"
        description="Review your campaign, ad set, and creative. Nothing goes live on Meta until you publish."
        badge="Final step"
      />

      {partialPublish?.metaCampaignId && !publishSuccess ? (
        <BuilderWarningAlert
          title="Publish did not finish in Dealioo"
          message="Meta may have already created your campaign while our app was still waiting for a response. Publishing can take 30–90 seconds (image upload, creative, and ad creation). If you already see the campaign in Ads Manager, use “Check status” below or close and reopen this builder."
        >
          <ul className="mt-3 space-y-1 font-mono text-xs text-amber-950">
            {partialPublish.metaCampaignId ? (
              <li>Campaign: {partialPublish.metaCampaignId}</li>
            ) : null}
            {partialPublish.metaAdsetId ? (
              <li>Ad set: {partialPublish.metaAdsetId}</li>
            ) : null}
            {partialPublish.metaCreativeId ? (
              <li>Creative: {partialPublish.metaCreativeId}</li>
            ) : null}
            {!partialPublish.metaCreativeId ? <li>Ad: not created yet</li> : null}
          </ul>
          {partialPublish.previousError ? (
            <p className="mt-3 text-sm text-amber-900">
              <span className="font-semibold">What Dealioo reported: </span>
              {partialPublish.previousError}
            </p>
          ) : null}
          {onRefreshStatus ? (
            <button
              type="button"
              onClick={() => void onRefreshStatus()}
              disabled={refreshingStatus}
              className="mt-4 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50 disabled:opacity-60"
            >
              {refreshingStatus ? "Checking status…" : "Check status"}
            </button>
          ) : null}
        </BuilderWarningAlert>
      ) : null}

      {publishSuccess ? (
        <BuilderSuccessAlert
          title={publishSuccess.message}
          message={
            campaignData.status === "ACTIVE"
              ? "Your campaign was published as Active. We opened Meta Ads Manager in a new tab so you can confirm delivery and spending."
              : "Your ad was created on Meta in Paused status. Turn it on in Ads Manager when you're ready."
          }
        >
          <ul className="space-y-1 font-mono text-xs text-emerald-900">
            <li>Campaign: {publishSuccess.metaCampaignId}</li>
            <li>Ad set: {publishSuccess.metaAdsetId}</li>
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
        </BuilderSuccessAlert>
      ) : null}

      <div className="space-y-4">
        <BuilderSummaryCard
          title="Campaign"
          accent="blue"
          rows={[
            { label: "Campaign name", value: campaignData.name },
            { label: "Objective", value: formatObjective(campaignData.objective) },
            { label: "Buying type", value: campaignData.buyingType },
            { label: "Special ad category", value: specialCategories },
            { label: "Status", value: campaignData.status },
            { label: "CBO budget", value: formatCboBudget(campaignData) },
          ]}
        />

        <BuilderSummaryCard
          title="Ad set"
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

        <BuilderSummaryCard
          title="Ad & creative"
          rows={[
            { label: "Ad name", value: adCreativeData.name },
            {
              label: "Facebook Page",
              value: facebookPageName ?? adCreativeData.facebookPageId,
            },
            {
              label: "Creative format",
              value: formatCreativeFormat(adCreativeData.creativeFormat),
            },
            { label: "Primary text", value: adCreativeData.primaryText },
            { label: "Headline", value: adCreativeData.headline ?? "N/A" },
            { label: "Description", value: adCreativeData.description ?? "N/A" },
            { label: "CTA", value: formatCta(adCreativeData.callToAction) },
            { label: "Landing page", value: adCreativeData.destinationUrl ?? "N/A" },
            {
              label: "Tracking parameters",
              value: adCreativeData.urlParameters?.trim() || "N/A",
            },
            ...(mediaLinks.length > 0
              ? mediaLinks.map((link) => ({
                  label: link.label,
                  value: link.url,
                }))
              : [{ label: "Media link", value: "No image/video uploaded yet" }]),
          ]}
        />

        <BuilderSummaryCard
          title="Publish status"
          rows={[
            {
              label: "Draft ID",
              value: draftId,
            },
            {
              label: "On Meta",
              value: publishSuccess
                ? "Published, campaign created"
                : partialPublish?.metaCampaignId
                  ? "Incomplete, retry publish to finish"
                  : "Not published yet",
            },
            {
              label: "Campaign ID",
              value:
                publishSuccess?.metaCampaignId ??
                partialPublish?.metaCampaignId ??
                "N/A",
            },
            {
              label: "Ad set ID",
              value:
                publishSuccess?.metaAdsetId ??
                partialPublish?.metaAdsetId ??
                "N/A",
            },
            {
              label: "Creative ID",
              value:
                publishSuccess?.metaCreativeId ??
                partialPublish?.metaCreativeId ??
                "N/A",
            },
            {
              label: "Ad ID",
              value: publishSuccess?.metaAdId ?? "N/A",
            },
          ]}
        />

        <section className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#1877f2]">
            Media sent to Meta
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            This is the HTTPS image/video link Dealioo sends when you publish.
          </p>

          {mediaLinks.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {mediaLinks.map((link) => (
                <li
                  key={`${link.label}-${link.url}`}
                  className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/80 px-3.5 py-3"
                >
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {link.label}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all text-sm font-medium text-[#1877f2] hover:underline"
                  >
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
              No image or video link is saved on this draft yet. Go back to Step 3 and upload media.
            </p>
          )}

          {previewUrl ? (
            <div className="mt-4 max-w-xs">
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
        </section>
      </div>

      {publishError ? (
        <BuilderErrorAlert message={publishError} />
      ) : null}

      {!publishSuccess ? (
        <BuilderFooter
          onBack={onBack}
          secondaryLabel="Back"
          onSecondary={onPrevious}
          primaryLabel={publishing ? "Publishing to Meta…" : "Publish to Meta"}
          primaryLoading={publishing}
          primaryDisabled={publishing}
          primaryDisabledReason={
            publishing
              ? "Sending your campaign to Meta. This can take a few minutes."
              : undefined
          }
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
