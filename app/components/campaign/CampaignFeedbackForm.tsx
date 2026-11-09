"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { FeedbackCategoryRatingsFields } from "@/app/components/campaign/feedback/FeedbackCategoryRatings";
import { FeedbackStarPicker } from "@/app/components/campaign/feedback/FeedbackStarPicker";
import type { ReviewCategoryRatings } from "@/app/components/campaign/feedback/review-categories";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  getPublicCampaignFeedback,
  submitPublicCampaignFeedback,
  type PublicCampaignFeedback,
} from "@/app/services/campaign-review/campaign-review-api";
import { CheckCircle2, MessageSquareQuote } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

const LOGO_SRC = "/black-logo.png";

export function CampaignFeedbackForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PublicCampaignFeedback | null>(null);
  const [rating, setRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<ReviewCategoryRatings>(
    {},
  );
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getPublicCampaignFeedback(token)
      .then((result) => {
        if (cancelled) return;
        setInfo(result);
        if (result.alreadySubmitted) setDone(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Feedback link not found.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || done) return;
    if (rating < 1 || rating > 5) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicCampaignFeedback(token, {
        rating,
        comment: comment.trim().slice(0, 2000) || undefined,
        categoryRatings,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not submit feedback.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const campaignLabel = info?.campaignName?.trim() || "this experience";
  const venueLogo = resolveUploadImageUrl(info?.logoUrl ?? null);
  const brandStyle = useMemo(() => {
    const primary = info?.logoPrimaryColor?.trim();
    if (!primary) return undefined;
    return {
      ["--brand-primary" as string]: primary,
      ["--brand-primary-hover" as string]:
        info?.logoAccentColor?.trim() || primary,
    } as CSSProperties;
  }, [info?.logoPrimaryColor, info?.logoAccentColor]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10 sm:px-6"
      style={brandStyle}
    >
      <div className="brand-auth-card animate-in fade-in duration-500">
        <div className="mb-7 flex flex-col items-center text-center">
          {venueLogo ? (
            <Image
              src={venueLogo}
              alt={info?.businessName?.trim() || "Business logo"}
              width={160}
              height={64}
              className="mb-5 h-12 w-auto max-w-[180px] object-contain"
              unoptimized
              priority
            />
          ) : (
            <DealiooLogo
              src={LOGO_SRC}
              variant="light"
              width={1389}
              height={334}
              className="mb-5 h-8 w-auto sm:h-9"
              priority
            />
          )}
          <span className="sr-only">
            {info?.businessName?.trim() || "Dealioo"}
          </span>
          <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Guest feedback
          </p>
          <h1 className="brand-heading mt-2">
            {loading
              ? "Give Feedback"
              : info && !info.expired
                ? campaignLabel
                : "Give Feedback"}
          </h1>
          {!loading && info?.businessName?.trim() ? (
            <p className="m-0 mt-1 text-xs font-medium text-brand-muted">
              {info.businessName.trim()}
            </p>
          ) : null}
          {!loading && info && !info.expired && !done ? (
            <p className="brand-subtext mt-2 max-w-[300px]">
              {info.guestName
                ? `Hi ${info.guestName} — how was your visit?`
                : "How was your visit? Your rating helps the team improve."}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <span
              className="size-9 animate-pulse rounded-full bg-brand-primary/15"
              aria-hidden
            />
            <p className="m-0 text-sm font-medium text-brand-muted">
              Loading your feedback form…
            </p>
          </div>
        ) : null}

        {!loading && error && !info ? (
          <div className="brand-error-banner" role="alert">
            <MessageSquareQuote className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!loading && info?.expired ? (
          <div className="rounded-xl border border-brand-border bg-brand-soft/80 px-4 py-5 text-center">
            <p className="m-0 text-sm font-semibold text-brand-navy">
              This feedback link has expired
            </p>
            <p className="brand-subtext mt-2">
              Please ask the business for a new link if you still want to share
              your thoughts.
            </p>
          </div>
        ) : null}

        {!loading && info && !info.expired && done ? (
          <div className="flex flex-col items-center py-2 text-center animate-in fade-in duration-500">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-retain)_14%,white)] text-brand-retain">
              <CheckCircle2 className="size-7" strokeWidth={2.25} />
            </span>
            <p className="m-0 text-lg font-semibold tracking-tight text-brand-navy">
              Thank you{info.guestName ? `, ${info.guestName}` : ""}!
            </p>
            <p className="brand-subtext mt-2 max-w-[300px]">
              Your feedback about{" "}
              <span className="font-semibold text-brand-navy">
                {campaignLabel}
              </span>{" "}
              was submitted.
            </p>
          </div>
        ) : null}

        {!loading && info && !info.expired && !done ? (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <p className="brand-label mb-2.5">Overall rating</p>
              <FeedbackStarPicker value={rating} onChange={setRating} />
            </div>

            <FeedbackCategoryRatingsFields
              value={categoryRatings}
              onChange={setCategoryRatings}
            />

            <label className="block">
              <span className="brand-label mb-2">Your thoughts (optional)</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Tell us what you liked or what we can improve…"
                className="h-auto min-h-[7.5rem] w-full resize-y rounded-xl border border-brand-border bg-brand-soft/80 px-4 py-3 text-[16px] leading-relaxed text-brand-navy outline-none transition-[border-color,box-shadow,background-color] placeholder:text-brand-muted focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
              />
            </label>

            {error ? (
              <div className="brand-error-banner" role="alert">
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="brand-btn-primary"
            >
              {submitting ? "Submitting…" : "Submit feedback"}
            </button>
          </form>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs font-medium text-brand-muted/80">
        Powered by Dealioo
      </p>
    </div>
  );
}
