"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import {
  getPublicCampaignFeedback,
  submitPublicCampaignFeedback,
  type PublicCampaignFeedback,
} from "@/app/services/campaign-review/campaign-review-api";
import { CheckCircle2, MessageSquareQuote, Star } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const LOGO_SRC = "/black-logo.png";

export function CampaignFeedbackForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PublicCampaignFeedback | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
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

  const displayRating = hoverRating || rating;
  const campaignLabel = info?.campaignName?.trim() || "this experience";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10 sm:px-6">
      <div className="brand-auth-card animate-in fade-in duration-500">
        <div className="mb-7 flex flex-col items-center text-center">
          <DealiooLogo
            src={LOGO_SRC}
            variant="light"
            width={1389}
            height={334}
            className="mb-5 h-8 w-auto sm:h-9"
            priority
          />
          <span className="sr-only">Dealioo</span>
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
              <p className="brand-label mb-2.5">Rating</p>
              <div
                className="flex items-center justify-center gap-1 sm:gap-1.5"
                role="group"
                aria-label="Star rating"
              >
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  const active = value <= displayRating;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={rating === value}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className="cursor-pointer rounded-lg p-1.5 transition-transform duration-150 hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`size-9 transition-colors duration-150 ${
                          active
                            ? "fill-[var(--brand-yellow)] text-[var(--brand-yellow)]"
                            : "text-slate-300"
                        }`}
                        strokeWidth={1.75}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

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
