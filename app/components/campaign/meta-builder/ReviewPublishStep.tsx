"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ExternalLink,
  Flag,
  ImageIcon,
  Loader2,
  Megaphone,
  Rocket,
  Target,
  Users,
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
  { key: "media", label: "Uploading Image" },
  { key: "creative", label: "Creating Creative" },
  { key: "ad", label: "Creating Ad" },
  { key: "done", label: "Done" },
] as const;

function resolveActiveStepIndex(publishStep: string | null | undefined): number {
  const normalized = (publishStep ?? "").toLowerCase();
  if (!normalized || normalized === "queued" || normalized === "preparing") {
    return 0;
  }
  const idx = PUBLISH_PROGRESS_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

function StatChip({ label, value }: { label: string; value: string }) {
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

function ReviewSection({
  icon: Icon,
  title,
  subtitle,
  children,
  action,
}: {
  icon: typeof Flag;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
      <div className="flex items-start justify-between gap-3 border-b border-[#e8edf5] bg-gradient-to-r from-[#f4f8ff] via-white to-white px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#dbeafe] bg-white text-[#1877f2] shadow-sm">
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
        {action}
      </div>
      <div className="min-w-0 p-5">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const isLongUrl = /^https?:\/\//i.test(value) || value.length > 48;

  return (
    <div className="grid gap-1 border-b border-[#eef2f7] py-2.5 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="shrink-0 text-xs font-semibold text-slate-500">{label}</dt>
      <dd
        className={`min-w-0 text-sm font-medium leading-snug text-[#07111f] ${
          isLongUrl ? "break-all" : "break-words"
        }`}
      >
        {value}
      </dd>
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
        description="Everything looks set. Double-check the summary, preview the ad, then publish to Meta."
        badge="Final step"
      />

      <section className="relative overflow-hidden rounded-2xl border border-[#dbeafe] bg-gradient-to-br from-[#1877f2] via-[#1a6fd6] to-[#0b4fad] p-5 text-white shadow-[0_18px_40px_rgba(24,119,242,0.28)] sm:p-6">
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-10 size-48 rounded-full bg-[#60a5fa]/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
              <Rocket className="size-3.5" aria-hidden />
              {publishStateLabel}
            </div>
            <h3 className="mt-3 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {campaignData.name}
            </h3>
            <p className="mt-1.5 text-sm text-white/80">
              {formatObjective(campaignData.objective)} ·{" "}
              {formatCreativeFormat(adCreativeData.creativeFormat)} ·{" "}
              {campaignData.status}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/70">
                Budget
              </p>
              <p className="mt-1 text-sm font-bold">{budgetLabel}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/70">
                Audience
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-bold">{audienceLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {showProgress ? (
        <section className="overflow-hidden rounded-2xl border border-[#dbeafe] bg-[#f4f8ff] p-5 shadow-sm ring-1 ring-[#1877f2]/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#07111f]">
              {publishing ? "Publishing to Meta…" : "Publish progress"}
            </p>
            <span className="text-xs font-bold tabular-nums text-[#1877f2]">
              {clampedProgress}%
            </span>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-[#1877f2]/15"
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#1877f2] transition-[width] duration-500 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>

          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {PUBLISH_PROGRESS_STEPS.map((step, index) => {
              const done =
                index < activeStepIndex ||
                (step.key === "done" && clampedProgress >= 100) ||
                (index === activeStepIndex && clampedProgress >= 100);
              const current = index === activeStepIndex && !done && publishing;
              return (
                <li
                  key={step.key}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
                    done
                      ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                      : current
                        ? "border-[#dbeafe] bg-white font-semibold text-[#1877f2]"
                        : "border-transparent bg-white/60 text-slate-500"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-emerald-500 text-white"
                        : current
                          ? "bg-[#1877f2] text-white"
                          : "bg-white ring-1 ring-[#dbeafe] text-slate-400"
                    }`}
                  >
                    {done ? (
                      <Check className="size-3" aria-hidden />
                    ) : current ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                    ) : (
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    )}
                  </span>
                  {step.label}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {partialPublish?.metaCampaignId && !publishSuccess && !publishing ? (
        <BuilderWarningAlert
          title="Publish did not finish in Dealioo"
          message="Publish runs in the background. Partial Meta IDs below mean earlier steps already succeeded — retry continues from there (no duplicate campaign/ad set). If Meta returned an error, it is shown below."
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

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <ReviewSection
            icon={Flag}
            title="Campaign"
            subtitle="Objective, budget strategy, and launch status"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <StatChip label="Objective" value={formatObjective(campaignData.objective)} />
              <StatChip label="Status" value={campaignData.status} />
              <StatChip
                label="CBO budget"
                value={formatCboBudget(campaignData, currencyCode)}
              />
              <StatChip label="Currency" value={currencyCode} />
            </div>
            <dl className="mt-4 min-w-0 overflow-hidden rounded-xl border border-[#eef2f7] bg-[#fafbfd] px-4">
              <DetailRow label="Buying type" value={campaignData.buyingType} />
              <DetailRow label="Special ad category" value={specialCategories} />
            </dl>
          </ReviewSection>

          <ReviewSection
            icon={Target}
            title="Ad set"
            subtitle="Who sees it, where it shows, and how spend is paced"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <StatChip label="Budget" value={budgetLabel} />
              <StatChip label="Schedule" value={formatSchedule(adSetData)} />
              <StatChip label="Audience" value={audienceLabel} />
              <StatChip label="Placements" value={formatPlacements(adSetData)} />
            </div>
            <dl className="mt-4 min-w-0 overflow-hidden rounded-xl border border-[#eef2f7] bg-[#fafbfd] px-4">
              <DetailRow label="Ad set name" value={adSetData.name} />
              <DetailRow label="Optimization goal" value={adSetData.optimizationGoal} />
              <DetailRow label="Destination type" value={adSetData.destinationType} />
              <DetailRow
                label="Bid strategy"
                value={formatBidStrategy(adSetData.bidStrategy)}
              />
            </dl>
          </ReviewSection>

          <ReviewSection
            icon={Megaphone}
            title="Ad & creative"
            subtitle="Copy, destination, and tracking people will see"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <StatChip
                label="Format"
                value={formatCreativeFormat(adCreativeData.creativeFormat)}
              />
              <StatChip
                label="CTA"
                value={formatCta(adCreativeData.callToAction)}
              />
              <StatChip
                label="Facebook Page"
                value={facebookPageName ?? adCreativeData.facebookPageId}
              />
              <StatChip
                label="Headline"
                value={adCreativeData.headline?.trim() || "N/A"}
              />
            </div>
            <dl className="mt-4 min-w-0 overflow-hidden rounded-xl border border-[#eef2f7] bg-[#fafbfd] px-4">
              <DetailRow label="Ad name" value={adCreativeData.name} />
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

          <ReviewSection
            icon={Users}
            title="Publish status"
            subtitle="Draft and Meta object IDs for this launch"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <StatChip label="On Meta" value={publishStateLabel} />
              <StatChip
                label="Draft ID"
                value={`${draftId.slice(0, 8)}…`}
              />
              <StatChip
                label="Campaign ID"
                value={
                  publishSuccess?.metaCampaignId ??
                  partialPublish?.metaCampaignId ??
                  "Not created"
                }
              />
              <StatChip
                label="Ad ID"
                value={publishSuccess?.metaAdId ?? "Not created"}
              />
            </div>
          </ReviewSection>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4">
          <ReviewSection
            icon={ImageIcon}
            title="Ad preview"
            subtitle="How it may look in Facebook Feed"
          >
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
              <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f4f8ff] px-4 py-10 text-center">
                <ImageIcon className="mx-auto size-8 text-[#1877f2]/50" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-[#07111f]">
                  No creative media yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Go back to Step 3 and upload an image or video.
                </p>
              </div>
            )}
          </ReviewSection>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#1877f2]">
              Media sent to Meta
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              HTTPS image/video link Dealioo sends on publish.
            </p>

            {mediaLinks.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {mediaLinks.map((link) => (
                  <li
                    key={`${link.label}-${link.url}`}
                    className="min-w-0 overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/80 px-3.5 py-3"
                  >
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                      {link.label}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block max-w-full overflow-hidden break-all text-xs font-medium leading-snug text-[#1877f2] hover:underline"
                    >
                      {link.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
                No image or video link is saved on this draft yet.
              </p>
            )}
          </section>
        </aside>
      </div>

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
