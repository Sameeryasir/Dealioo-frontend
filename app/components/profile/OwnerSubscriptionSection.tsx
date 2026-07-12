"use client";

import {
  getMyUserSubscription,
  type UserSubscription,
} from "@/app/services/subscription/user-subscription";
import { cancelUserSubscription } from "@/app/services/subscription/cancel-user-subscription";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OwnerSubscriptionSectionProps = {
  variant?: "light" | "dark";
  layout?: "page" | "compact";
};

function formatSubscriptionDate(value: string | null | undefined): string {
  if (!value?.trim()) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatBillingCycle(cycle: UserSubscription["billingCycle"]): string {
  return cycle === "annual" ? "Annual" : "Monthly";
}

function formatStatus(status: string): string {
  const trimmed = status.trim();
  if (!trimmed) return "Unknown";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function statusTone(
  status: string,
): "success" | "warning" | "neutral" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "cancelled" || normalized === "canceled") return "warning";
  return "neutral";
}

function SubscriptionStatusPill({
  label,
  tone,
  variant,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const tones = {
    success: isDark
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200",
    neutral: isDark
      ? "bg-zinc-800 text-zinc-300 ring-zinc-700"
      : "bg-zinc-100 text-zinc-700 ring-zinc-200",
    warning: isDark
      ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
      : "bg-amber-50 text-amber-800 ring-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ring-1 ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function SubscriptionDetailCell({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  icon: typeof CreditCard;
  variant: "light" | "dark";
}) {
  const isDark = variant === "dark";

  if (isDark) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-white">
              {value}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-details-board-cell">
      <span className="profile-details-board-icon">
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="profile-details-board-label">{label}</p>
        <p className="profile-details-board-value">{value}</p>
      </div>
    </div>
  );
}

export function OwnerSubscriptionSection({
  variant = "light",
  layout = "page",
}: OwnerSubscriptionSectionProps) {
  const [loading, setLoading] = useState(true);
  const [cancelStatus, setCancelStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );

  const isDark = variant === "dark";
  const isPage = layout === "page" && !isDark;

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const next = await getMyUserSubscription();
      setSubscription(next);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load your subscription.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Cancel your Dealioo subscription? Your plan will end immediately and you will need to choose a new plan to continue using paid features.",
    );
    if (!confirmed) return;

    setCancelStatus("loading");
    setErrorMessage(null);
    try {
      await cancelUserSubscription();
      setSubscription(null);
      setCancelStatus("idle");
    } catch (error) {
      setCancelStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not cancel your subscription.",
      );
    }
  };

  const canCancelSubscription =
    subscription != null &&
    (subscription.status === "active" || subscription.status === "trialing");

  const headingClass = isDark
    ? "text-base font-semibold text-white"
    : "profile-section-heading";
  const copyClass = isDark
    ? "mt-1 text-sm text-zinc-500"
    : "profile-section-copy";

  const body = loading ? (
    <div
      className={
        isDark
          ? "flex items-center gap-2 text-sm text-zinc-500"
          : "flex items-center gap-2 text-sm text-brand-muted"
      }
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Loading subscription…
    </div>
  ) : errorMessage ? (
    <div className="flex flex-col gap-3">
      <div
        role="alert"
        className={
          isDark
            ? "flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
            : "flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
        }
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{errorMessage}</span>
      </div>
      <button
        type="button"
        onClick={() => void loadSubscription()}
        className={
          isDark
            ? "inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
            : "inline-flex h-9 w-fit items-center gap-2 rounded-full border border-[#d8e3f2] bg-white px-4 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:border-[#c5d4ea] hover:bg-[#f8faff]"
        }
      >
        <RefreshCw className="size-3.5" strokeWidth={2.25} aria-hidden />
        Try again
      </button>
    </div>
  ) : !subscription ? (
    <div
      className={
        isDark
          ? "rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5"
          : "rounded-2xl border border-[#e8edf5] bg-[#f8faff] p-5"
      }
    >
      <p
        className={
          isDark
            ? "text-sm leading-relaxed text-zinc-400"
            : "text-sm leading-relaxed text-brand-muted"
        }
      >
        You do not have an active plan yet. Choose a plan to unlock Dealioo for
        all of your businesses.
      </p>
      <Link
        href="/auth/select-plan"
        className={
          isDark
            ? "mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
            : "mt-4 inline-flex h-10 items-center justify-center rounded-full bg-brand-primary px-6 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition-colors hover:bg-brand-primary-hover"
        }
      >
        Choose a plan
      </Link>
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SubscriptionStatusPill
          label={formatStatus(subscription.status)}
          tone={statusTone(subscription.status)}
          variant={variant}
        />
        <SubscriptionStatusPill
          label={formatBillingCycle(subscription.billingCycle)}
          tone="neutral"
          variant={variant}
        />
      </div>

      {isPage ? (
        <div className="profile-details-board">
          <SubscriptionDetailCell
            variant={variant}
            icon={Sparkles}
            label="Plan"
            value={subscription.planName}
          />
          <SubscriptionDetailCell
            variant={variant}
            icon={CreditCard}
            label="Billing"
            value={formatBillingCycle(subscription.billingCycle)}
          />
          <SubscriptionDetailCell
            variant={variant}
            icon={CalendarDays}
            label="Started"
            value={formatSubscriptionDate(subscription.startedAt)}
          />
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SubscriptionDetailCell
            variant={variant}
            icon={Sparkles}
            label="Plan"
            value={subscription.planName}
          />
          <SubscriptionDetailCell
            variant={variant}
            icon={CreditCard}
            label="Billing"
            value={formatBillingCycle(subscription.billingCycle)}
          />
          <SubscriptionDetailCell
            variant={variant}
            icon={CalendarDays}
            label="Started"
            value={formatSubscriptionDate(subscription.startedAt)}
          />
        </dl>
      )}

      <p
        className={
          isDark
            ? "text-xs leading-relaxed text-zinc-500"
            : "text-xs leading-relaxed text-brand-muted"
        }
      >
        This plan applies to your whole account and is shared across every
        business you own.
      </p>

      {canCancelSubscription ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void handleCancelSubscription()}
            disabled={cancelStatus === "loading"}
            className={
              isDark
                ? "inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 text-xs font-semibold text-red-200 transition-colors hover:border-red-500/45 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                : "inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
            }
          >
            {cancelStatus === "loading" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Cancelling…
              </>
            ) : (
              "Cancel subscription"
            )}
          </button>
          {cancelStatus === "error" && errorMessage ? (
            <p
              role="alert"
              className={
                isDark
                  ? "text-xs text-red-300"
                  : "text-xs text-red-700"
              }
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (isPage) {
    return (
      <div className="profile-subscription-section mt-8 border-t border-[#e8edf5] pt-8">
        <div className="flex items-start gap-3.5">
          <span className="profile-edit-card-icon">
            <CreditCard className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={headingClass}>Subscription</h3>
            <p className={copyClass}>
              Your Dealioo plan, billing cycle, and account-wide access.
            </p>
            <div className="mt-4">{body}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className={headingClass}>Subscription</h3>
        <p className={copyClass}>
          Your Dealioo plan applies to every business on this account.
        </p>
      </div>
      {body}
    </div>
  );
}
