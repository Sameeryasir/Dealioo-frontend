"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ExternalLink,
  ImageIcon,
  Loader2,
} from "lucide-react";
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
import {
  DEFAULT_META_ACCOUNT_CURRENCY,
  normalizeMetaCurrencyCode,
} from "@/app/lib/meta-account-currency";

export const PUBLISH_PROGRESS_STEPS = [
  { key: "campaign", label: "Creating Campaign" },
  { key: "adset", label: "Creating Ad Set" },
  { key: "media", label: "Uploading Media" },
  { key: "creative", label: "Creating Creative" },
  { key: "ad", label: "Creating Ad" },
  { key: "done", label: "Done" },
] as const;

function mediaProgressLabel(
  format: AdCreativeStepData["creativeFormat"] | null | undefined,
): string {
  if (format === "SINGLE_VIDEO") return "Uploading Video";
  if (format === "CAROUSEL") return "Uploading Carousel Images";
  return "Uploading Image";
}

function resolveActiveStepIndex(publishStep: string | null | undefined): number {
  const normalized = (publishStep ?? "").toLowerCase();
  if (!normalized || normalized === "queued" || normalized === "preparing") {
    return 0;
  }
  const idx = PUBLISH_PROGRESS_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e8edf5] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#07111f]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 border-b border-[#eef2f7] py-2 last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-[#07111f]">{value}</dd>
    </div>
  );
}

type ReviewPublishStepProps = {
  businessId: number;
  draftId: string;
  campaignData: CampaignStepData;
  adSetData: AdSetStepData;
  adCreativeData: AdCreativeStepData;
  accountCurrency?: string;
  publishing: boolean;
  publishError: string | null;
  publishStep?: string | null;
  publishProgress?: number;
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
  accountCurrency = DEFAULT_META_ACCOUNT_CURRENCY,
  publishing,
  publishError,
  publishStep = null,
  publishProgress = 0,
  partialPublish,
  publishSuccess,
  onBack,
  onPrevious,
  onPublish,
  onRefreshStatus,
  refreshingStatus = false,
}: ReviewPublishStepProps) {
  const currencyCode = normalizeMetaCurrencyCode(accountCurrency);
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

  const activeStepIndex = resolveActiveStepIndex(publishStep);
  const clampedProgress = Math.min(100, Math.max(0, publishProgress || 0));
  const showProgress = publishing || (clampedProgress > 0 && !publishSuccess);
  const showRetry =
    Boolean(publishError || partialPublish?.metaCampaignId) &&
    !publishing &&
    !publishSuccess;

  const publishStateLabel = publishSuccess
    ? "Published"
    : partialPublish?.metaCampaignId
      ? "Incomplete"
      : "Ready to publish";

  const budgetLabel = formatAdSetBudget(campaignData, adSetData, currencyCode);
  const audienceLabel = formatAudience(adSetData);

  return (
    <div className="space-y-5 pb-2">
      <BuilderStepHeader
        step={4}
        title="Review & Publish"
        description="Check the summary, then publish to Meta."
      />

      {showProgress ? (
        <section className="rounded-xl border border-[#e8edf5] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#07111f]">
              {publishing ? "Publishing to Meta…" : "Publish progress"}
            </p>
            <span className="text-xs tabular-nums text-slate-500">
              {clampedProgress}%
            </span>
          </div>

          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]"
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-slate-700 transition-[width] duration-500 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>

          <ol className="mt-3 space-y-1.5">
            {PUBLISH_PROGRESS_STEPS.map((step, index) => {
              const done =
                index < activeStepIndex ||
                (step.key === "done" && clampedProgress >= 100) ||
                (index === activeStepIndex && clampedProgress >= 100);
              const current = index === activeStepIndex && !done && publishing;
              const label =
                step.key === "media"
                  ? mediaProgressLabel(adCreativeData.creativeFormat)
                  : step.label;
              return (
                <li
                  key={step.key}
                  className={`flex items-center gap-2 text-sm ${
                    done
                      ? "font-medium text-emerald-700"
                      : current
                        ? "font-medium text-[#07111f]"
                        : "text-slate-400"
                  }`}
                >
                  {done ? (
                    <Check className="size-3.5 shrink-0" aria-hidden />
                  ) : current ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <span className="w-3.5 text-center text-[10px]">{index + 1}</span>
                  )}
                  {label}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {partialPublish?.metaCampaignId && !publishSuccess && !publishing ? (
        <BuilderWarningAlert
          title="Publish did not finish"
          message="Some Meta objects were already created. Retry continues from where it stopped — Dealioo will not create a duplicate campaign or ad set. If you deleted those objects in Ads Manager, retry starts clean."
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

      {!publishing ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <ReviewSection title="Campaign">
              <dl>
                <DetailRow label="Name" value={campaignData.name} />
                <DetailRow
                  label="Objective"
                  value={formatObjective(campaignData.objective)}
                />
                <DetailRow label="Status" value={campaignData.status} />
                <DetailRow
                  label="CBO budget"
                  value={formatCboBudget(campaignData, currencyCode)}
                />
                <DetailRow label="Currency" value={currencyCode} />
                <DetailRow label="Buying type" value={campaignData.buyingType} />
                <DetailRow label="Special ad category" value={specialCategories} />
              </dl>
            </ReviewSection>

            <ReviewSection title="Ad set">
              <dl>
                <DetailRow label="Name" value={adSetData.name} />
                <DetailRow label="Budget" value={budgetLabel} />
                <DetailRow label="Schedule" value={formatSchedule(adSetData)} />
                <DetailRow label="Audience" value={audienceLabel} />
                <DetailRow label="Placements" value={formatPlacements(adSetData)} />
                <DetailRow
                  label="Optimization goal"
                  value={adSetData.optimizationGoal}
                />
                <DetailRow
                  label="Destination type"
                  value={adSetData.destinationType}
                />
                <DetailRow
                  label="Bid strategy"
                  value={formatBidStrategy(adSetData.bidStrategy)}
                />
              </dl>
            </ReviewSection>

            <ReviewSection title="Ad & creative">
              <dl>
                <DetailRow label="Ad name" value={adCreativeData.name} />
                <DetailRow
                  label="Format"
                  value={formatCreativeFormat(adCreativeData.creativeFormat)}
                />
                <DetailRow
                  label="CTA"
                  value={formatCta(adCreativeData.callToAction)}
                />
                <DetailRow
                  label="Facebook Page"
                  value={facebookPageName ?? adCreativeData.facebookPageId}
                />
                <DetailRow
                  label="Headline"
                  value={adCreativeData.headline?.trim() || "N/A"}
                />
                <DetailRow label="Primary text" value={adCreativeData.primaryText} />
                <DetailRow
                  label="Description"
                  value={adCreativeData.description?.trim() || "N/A"}
                />
                <DetailRow
                  label="Landing page"
                  value={adCreativeData.destinationUrl?.trim() || "N/A"}
                />
                <DetailRow
                  label="Tracking parameters"
                  value={adCreativeData.urlParameters?.trim() || "N/A"}
                />
              </dl>
            </ReviewSection>

            <ReviewSection title="Publish status">
              <dl>
                <DetailRow label="On Meta" value={publishStateLabel} />
                <DetailRow label="Draft ID" value={`${draftId.slice(0, 8)}…`} />
                <DetailRow
                  label="Campaign ID"
                  value={
                    publishSuccess?.metaCampaignId ??
                    partialPublish?.metaCampaignId ??
                    "Not created"
                  }
                />
                <DetailRow
                  label="Ad ID"
                  value={publishSuccess?.metaAdId ?? "Not created"}
                />
              </dl>
            </ReviewSection>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <ReviewSection title="Ad preview">
              {previewUrl ? (
                <div className="mx-auto w-full max-w-[320px]">
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
              ) : (
                <div className="rounded-lg border border-dashed border-[#e8edf5] bg-[#fafbfd] px-4 py-8 text-center">
                  <ImageIcon className="mx-auto size-7 text-slate-300" aria-hidden />
                  <p className="mt-2 text-sm text-slate-600">No creative media yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Go back to Step 3 and upload an image or video.
                  </p>
                </div>
              )}
            </ReviewSection>

            <ReviewSection title="Media sent to Meta">
              {mediaLinks.length > 0 ? (
                <ul className="space-y-2">
                  {mediaLinks.map((link) => (
                    <li key={`${link.label}-${link.url}`}>
                      <p className="text-xs text-slate-500">{link.label}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block break-all text-xs text-[#1877f2] hover:underline"
                      >
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-amber-800">
                  No image or video link is saved on this draft yet.
                </p>
              )}
            </ReviewSection>
          </aside>
        </div>
      ) : null}

      {publishError ? <BuilderErrorAlert message={publishError} /> : null}

      {!publishSuccess ? (
        <BuilderFooter
          onBack={onBack}
          secondaryLabel="Back"
          onSecondary={onPrevious}
          primaryLabel={
            publishing
              ? "Publishing to Meta…"
              : showRetry
                ? "Retry Publish"
                : "Publish to Meta"
          }
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
