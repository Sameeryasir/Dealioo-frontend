"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { OwnerBillingCardForm } from "@/app/components/profile/OwnerBillingCardForm";
import { cancelUserSubscription } from "@/app/services/subscription/cancel-user-subscription";
import {
  createBillingSetupIntent,
  downloadBillingInvoicePdf,
  getBillingOverview,
  resumeUserSubscription,
  updateBillingDetails,
  confirmBillingPaymentMethod,
  type BillingAddress,
  type BillingDetails,
  type BillingInvoice,
  type BillingOverview,
  type BillingPaymentMethod,
} from "@/app/services/subscription/billing";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Globe,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  RefreshCw,
  Shield,
  Sparkles,
  Tag,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

type OwnerSubscriptionSectionProps = {
  variant?: "light" | "dark";
  layout?: "page" | "compact";
  showHeading?: boolean;
};

const CANCEL_REASON_OPTIONS = [
  { value: "too_expensive", label: "It’s too expensive" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "not_using_enough", label: "I’m not using it enough" },
  { value: "switching_product", label: "Switching to another product" },
  { value: "temporary_pause", label: "Taking a break / temporary pause" },
  { value: "other", label: "Other" },
] as const;

type CancelReasonValue = (typeof CANCEL_REASON_OPTIONS)[number]["value"];

const emptyBillingDetails: BillingDetails = {
  name: null,
  email: null,
  address: null,
};

function formatShortDate(value: string | null | undefined): string {
  if (!value?.trim()) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeFromNow(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 60) return `In ${days} days`;
  if (days < -1 && days > -60) return `${Math.abs(days)} days ago`;
  return null;
}

function formatBillingCycle(cycle: "monthly" | "annual"): string {
  return cycle === "annual" ? "Annual" : "Monthly";
}

function formatStatus(status: string): string {
  const trimmed = status.trim().replace(/_/g, " ");
  if (!trimmed) return "Unknown";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatCardBrand(brand: string): string {
  const trimmed = brand.trim();
  if (!trimmed) return "Card";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatCardLabel(method: BillingPaymentMethod): string {
  return `${formatCardBrand(method.brand)} •••• ${method.last4}`;
}

function formatCardExpiry(method: BillingPaymentMethod): string {
  if (!method.expMonth || !method.expYear) return "";
  return `Expires ${String(method.expMonth).padStart(2, "0")}/${method.expYear}`;
}

function formatAddress(address: BillingAddress | null): string {
  if (!address) return "Not set";
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(", "),
    address.country,
  ].filter((part) => part?.trim());
  return parts.length ? parts.join("\n") : "Not set";
}

function isPastDueStatus(status: string): boolean {
  return status.trim().toLowerCase() === "past_due";
}

function formatInvoicePeriod(
  createdAt: string,
  billingCycle: "monthly" | "annual",
): string {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start);
  if (billingCycle === "annual") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  const startLabel = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `${startLabel} - ${formatShortDate(end.toISOString())}`;
}

function BillingCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof CreditCard;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="dealioo-billing-card">
      <header className="dealioo-billing-card-head">
        <h4 className="dealioo-billing-card-title">
          <span className="dealioo-billing-card-title-icon">
            <Icon className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          {title}
        </h4>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="dealioo-billing-card-body">{children}</div>
    </section>
  );
}

const inputClass =
  "brand-input h-11 w-full bg-white py-2 text-brand-navy";

export function OwnerSubscriptionSection({
  variant = "light",
  layout = "page",
  showHeading = true,
}: OwnerSubscriptionSectionProps) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<BillingOverview | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<CancelReasonValue | "">("");
  const [cancelComment, setCancelComment] = useState("");
  const [resuming, setResuming] = useState(false);

  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const [billingEditOpen, setBillingEditOpen] = useState(false);
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingEditError, setBillingEditError] = useState<string | null>(null);
  const [billingForm, setBillingForm] = useState({
    name: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const isDark = variant === "dark";
  const isPage = layout === "page" && !isDark;
  const subscription = overview?.subscription ?? null;
  const paymentMethod = overview?.paymentMethod ?? null;
  const billingDetails = overview?.billingDetails ?? emptyBillingDetails;
  const invoices = overview?.invoices ?? [];
  const processedCardReturnRef = useRef(false);

  const resetCancelForm = useCallback(() => {
    setCancelReason("");
    setCancelComment("");
    setCancelError(null);
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const next = await getBillingOverview();
      setOverview(next);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load your billing details.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const closeCardModal = useCallback(() => {
    if (cardLoading) return;
    setCardModalOpen(false);
    setCardClientSecret(null);
    setCardError(null);
  }, [cardLoading]);

  useEffect(() => {
    if (!cardModalOpen || cardLoading) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCardModal();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [cardModalOpen, cardLoading, closeCardModal]);

  useEffect(() => {
    if (processedCardReturnRef.current || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const setupIntentId = params.get("setup_intent")?.trim() || "";
    if (!setupIntentId.startsWith("seti_")) {
      return;
    }

    processedCardReturnRef.current = true;
    const redirectStatus = params.get("redirect_status")?.trim() || "";
    params.delete("setup_intent");
    params.delete("setup_intent_client_secret");
    params.delete("redirect_status");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );

    if (redirectStatus && redirectStatus !== "succeeded") {
      setCardError("Card verification was not completed. Please try again.");
      setCardModalOpen(true);
      return;
    }

    void (async () => {
      try {
        await confirmBillingPaymentMethod(setupIntentId);
        toast.success("Payment method updated.");
        await loadOverview();
      } catch (error) {
        setCardError(
          error instanceof Error
            ? error.message
            : "Could not save your card. Please try again.",
        );
        setCardModalOpen(true);
      }
    })();
  }, [loadOverview]);

  const handleCancelSubscription = useCallback(async () => {
    if (!cancelReason) {
      setCancelError("Please tell us why you’re cancelling.");
      return;
    }
    if (cancelReason === "other" && !cancelComment.trim()) {
      setCancelError("Please add a short note for “Other”.");
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      await cancelUserSubscription({
        reason: cancelReason,
        ...(cancelComment.trim() ? { comment: cancelComment.trim() } : {}),
      });
      setCancelOpen(false);
      resetCancelForm();
      toast.success("Cancellation scheduled for the end of this billing period.");
      await loadOverview();
    } catch (error) {
      setCancelError(
        error instanceof Error
          ? error.message
          : "Could not cancel your subscription.",
      );
    } finally {
      setCancelling(false);
    }
  }, [cancelComment, cancelReason, loadOverview, resetCancelForm]);

  const handleResumeSubscription = useCallback(async () => {
    setResuming(true);
    setErrorMessage(null);
    try {
      await resumeUserSubscription();
      toast.success("Your subscription will continue.");
      await loadOverview();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not resume your subscription.",
      );
    } finally {
      setResuming(false);
    }
  }, [loadOverview]);

  const handleOpenCardModal = useCallback(async () => {
    setCardModalOpen(true);
    setCardClientSecret(null);
    setCardError(null);
    setCardLoading(true);
    try {
      const { clientSecret } = await createBillingSetupIntent();
      setCardClientSecret(clientSecret);
    } catch (error) {
      setCardError(
        error instanceof Error
          ? error.message
          : "Could not start card update.",
      );
    } finally {
      setCardLoading(false);
    }
  }, []);

  const handleCardSaved = useCallback(async () => {
    setCardModalOpen(false);
    setCardClientSecret(null);
    toast.success("Payment method updated.");
    await loadOverview();
  }, [loadOverview]);

  const openBillingEditor = useCallback(() => {
    setBillingEditError(null);
    setBillingForm({
      name: billingDetails.name ?? "",
      email: billingDetails.email ?? "",
      line1: billingDetails.address?.line1 ?? "",
      line2: billingDetails.address?.line2 ?? "",
      city: billingDetails.address?.city ?? "",
      state: billingDetails.address?.state ?? "",
      postalCode: billingDetails.address?.postalCode ?? "",
      country: billingDetails.address?.country ?? "",
    });
    setBillingEditOpen(true);
  }, [billingDetails]);

  const handleSaveBillingDetails = useCallback(async () => {
    setBillingSaving(true);
    setBillingEditError(null);
    try {
      const next = await updateBillingDetails({
        name: billingForm.name.trim(),
        address: {
          line1: billingForm.line1.trim(),
          line2: billingForm.line2.trim(),
          city: billingForm.city.trim(),
          state: billingForm.state.trim(),
          postalCode: billingForm.postalCode.trim(),
          country: billingForm.country.trim().toUpperCase(),
        },
      });
      setOverview((current) =>
        current ? { ...current, billingDetails: next } : current,
      );
      setBillingEditOpen(false);
      toast.success("Billing information updated.");
    } catch (error) {
      setBillingEditError(
        error instanceof Error
          ? error.message
          : "Could not update billing information.",
      );
    } finally {
      setBillingSaving(false);
    }
  }, [billingForm]);

  const headingClass = isDark
    ? "text-base font-semibold text-white"
    : "profile-section-heading";
  const copyClass = isDark
    ? "mt-1 text-sm text-zinc-500"
    : "profile-section-copy";
  const mutedClass = isDark
    ? "text-sm text-zinc-400"
    : "text-sm text-brand-muted";
  const valueClass = isDark
    ? "text-sm font-medium text-white"
    : "text-sm font-medium text-brand-navy";
  const secondaryBtnClass = isDark
    ? "inline-flex h-10 w-fit items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-60"
    : "inline-flex h-10 w-fit items-center justify-center rounded-full border border-[#d8e3f2] bg-white px-6 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:border-[#c5d4ea] hover:bg-[#f8faff] disabled:opacity-60";
  const primaryBtnClass = isDark
    ? "inline-flex h-10 w-fit items-center justify-center rounded-lg bg-sky-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-60"
    : "inline-flex h-10 w-fit items-center justify-center rounded-full bg-brand-primary px-6 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition-colors hover:bg-brand-primary-hover disabled:opacity-60";
  const dangerBtnClass = isDark
    ? "inline-flex h-10 w-fit items-center justify-center rounded-lg border border-red-500/40 bg-transparent px-5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
    : "inline-flex h-10 w-fit items-center justify-center rounded-full border border-red-200 bg-white px-6 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-60";

  const body = loading ? (
    <div
      className={
        isDark
          ? "flex items-center gap-2 text-sm text-zinc-500"
          : "flex items-center gap-2 text-sm text-brand-muted"
      }
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Loading billing…
    </div>
  ) : errorMessage && !overview ? (
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
        onClick={() => void loadOverview()}
        className={secondaryBtnClass}
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
      <p className={mutedClass}>
        You do not have an active plan yet. Choose a plan to unlock Dealioo for
        all of your businesses.
      </p>
      <Link href="/dashboard/upgrade-plan" className={`${primaryBtnClass} mt-4`}>
        Choose a plan
      </Link>
    </div>
  ) : (
    <div className="dealioo-billing">
      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {isPastDueStatus(subscription.status) ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-900"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Your last payment failed or needs bank confirmation. Update your
              payment method to keep this plan. Do not start a new checkout.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleOpenCardModal()}
            disabled={cardLoading}
            className={primaryBtnClass}
          >
            {cardLoading ? "Opening…" : "Update payment method"}
          </button>
        </div>
      ) : null}

      <BillingCard
        title="Current plan"
        icon={Sparkles}
        action={
          !subscription.cancelAtPeriodEnd &&
          !isPastDueStatus(subscription.status) ? (
            <span className="dealioo-billing-renew-chip">
              <Sparkles className="size-3.5" aria-hidden />
              Your plan is active and will renew automatically
            </span>
          ) : subscription.cancelAtPeriodEnd ? (
            <span className="dealioo-billing-pill dealioo-billing-pill--warn">
              Cancels at period end
            </span>
          ) : null
        }
      >
        <div className="dealioo-billing-plan-grid">
          <div className="dealioo-billing-metric">
            <span className="dealioo-billing-metric-icon dealioo-billing-metric-icon--plan">
              <TrendingUp className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="dealioo-billing-kicker">Plan</p>
              <p className="dealioo-billing-value">{subscription.planName}</p>
              <div className="dealioo-billing-pills">
                <span className="dealioo-billing-pill dealioo-billing-pill--success">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                  {formatStatus(subscription.status)}
                </span>
                <span className="dealioo-billing-pill dealioo-billing-pill--cycle">
                  {formatBillingCycle(subscription.billingCycle)}
                </span>
              </div>
            </div>
          </div>
          <div className="dealioo-billing-metric">
            <span className="dealioo-billing-metric-icon dealioo-billing-metric-icon--price">
              <Tag className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="dealioo-billing-kicker">Price</p>
              <p className="dealioo-billing-value">
                {subscription.priceFormatted
                  ? `${subscription.priceFormatted}/${subscription.billingCycle === "annual" ? "year" : "month"}`
                  : formatBillingCycle(subscription.billingCycle)}
              </p>
              <p className="dealioo-billing-hint">
                Billed {subscription.billingCycle === "annual" ? "annually" : "monthly"}
              </p>
            </div>
          </div>
          <div className="dealioo-billing-metric">
            <span className="dealioo-billing-metric-icon dealioo-billing-metric-icon--date">
              <CalendarDays className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="dealioo-billing-kicker">
                {subscription.cancelAtPeriodEnd ? "Access until" : "Next billing"}
              </p>
              <p className="dealioo-billing-value">
                {formatShortDate(
                  subscription.cancelAtPeriodEnd
                    ? subscription.cancellationDate ?? subscription.nextBillingDate
                    : subscription.nextBillingDate,
                )}
              </p>
              {formatRelativeFromNow(
                subscription.cancelAtPeriodEnd
                  ? subscription.cancellationDate ?? subscription.nextBillingDate
                  : subscription.nextBillingDate,
              ) ? (
                <p className="dealioo-billing-hint dealioo-billing-hint--accent">
                  {formatRelativeFromNow(
                    subscription.cancelAtPeriodEnd
                      ? subscription.cancellationDate ??
                        subscription.nextBillingDate
                      : subscription.nextBillingDate,
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <p className="dealioo-billing-footer">
          <Globe className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {subscription.cancelAtPeriodEnd
            ? `Cancellation is scheduled${
                subscription.cancellationDate
                  ? ` for ${formatShortDate(subscription.cancellationDate)}`
                  : ""
              }. You keep full access until then.`
            : "This plan applies to your whole account and is shared across every business you own."}
        </p>
      </BillingCard>

      <div className="dealioo-billing-split">
        <BillingCard
          title="Payment method"
          icon={Shield}
          action={
            <button
              type="button"
              onClick={() => void handleOpenCardModal()}
              disabled={cardLoading}
              className="dealioo-billing-ghost-btn"
            >
              Manage payment methods
              <ChevronRight className="size-3.5" aria-hidden />
            </button>
          }
        >
          {paymentMethod ? (
            <>
              <div className="flex items-center gap-4">
                <div className="dealioo-billing-card-mini" aria-hidden>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/85">
                    {formatCardBrand(paymentMethod.brand)}
                  </p>
                  <p className="font-mono text-sm tracking-wide">
                    •••• {paymentMethod.last4}
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="dealioo-billing-value" style={{ margin: 0 }}>
                      {formatCardLabel(paymentMethod)}
                    </p>
                    <span className="dealioo-billing-pill dealioo-billing-pill--success">
                      Default
                    </span>
                  </div>
                  {formatCardExpiry(paymentMethod) ? (
                    <p className="dealioo-billing-hint">
                      {formatCardExpiry(paymentMethod)}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="dealioo-billing-ok">
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                Your payment method is up to date.
              </p>
            </>
          ) : (
            <p className="dealioo-billing-hint">No card on file yet.</p>
          )}
        </BillingCard>

        <BillingCard
          title="Billing information"
          icon={UserRound}
          action={
            <button
              type="button"
              onClick={openBillingEditor}
              className="dealioo-billing-ghost-btn"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit billing info
            </button>
          }
        >
          <dl className="dealioo-billing-info-grid">
            <div>
              <dt className="dealioo-billing-kicker">Name</dt>
              <dd className="dealioo-billing-value">
                {billingDetails.name || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="dealioo-billing-kicker">Email</dt>
              <dd className="dealioo-billing-value break-all">
                {billingDetails.email || "Not set"}
              </dd>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <dt className="dealioo-billing-kicker">Address</dt>
              <dd className="dealioo-billing-value whitespace-pre-line">
                {formatAddress(billingDetails.address)}
              </dd>
            </div>
          </dl>
        </BillingCard>
      </div>

      <BillingCard title="Invoice history" icon={FileText}>
        {invoices.length === 0 ? (
          <p className="dealioo-billing-hint">No invoices yet.</p>
        ) : (
          <div className="dealioo-billing-table-wrap">
            <table className="dealioo-billing-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    planName={subscription.planName}
                    billingCycle={subscription.billingCycle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BillingCard>

      <BillingCard title="Subscription" icon={CreditCard}>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/upgrade-plan" className={primaryBtnClass}>
            Change plan
          </Link>
          {subscription.cancelAtPeriodEnd ? (
            <button
              type="button"
              onClick={() => void handleResumeSubscription()}
              disabled={resuming}
              className={secondaryBtnClass}
            >
              {resuming ? "Resuming…" : "Resume subscription"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                resetCancelForm();
                setCancelOpen(true);
              }}
              disabled={cancelling}
              className={dangerBtnClass}
            >
              Cancel subscription
            </button>
          )}
        </div>
      </BillingCard>
    </div>
  );

  const section = isPage ? (
    <div className={`profile-subscription-panel ${showHeading ? "mt-8" : ""}`}>
      {showHeading ? (
        <>
          <div className="profile-details-panel-head">
            <span className="profile-details-panel-badge" aria-hidden>
              <CreditCard className="size-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className={headingClass}>Subscription & Billing</h3>
              <p className={copyClass}>
                Your Dealioo plan, payment method, invoices, and billing details.
              </p>
            </div>
          </div>
          <div className="profile-subscription-panel-body">{body}</div>
        </>
      ) : (
        body
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      {showHeading ? (
        <div>
          <h3 className={headingClass}>Subscription & Billing</h3>
          <p className={copyClass}>
            Your Dealioo plan applies to every business on this account.
          </p>
        </div>
      ) : null}
      {body}
    </div>
  );

  return (
    <>
      {section}

      {cardModalOpen ? (
        <div className="dealioo-billing-modal" role="presentation">
          <button
            type="button"
            className="dealioo-billing-modal-backdrop"
            aria-label="Close update card dialog"
            disabled={cardLoading}
            onClick={closeCardModal}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-card-title"
            className="dealioo-billing-modal-panel"
          >
            <span className="dealioo-billing-modal-accent" aria-hidden />

            <header className="dealioo-billing-modal-head">
              <span className="dealioo-billing-modal-icon" aria-hidden>
                <CreditCard className="size-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="dealioo-billing-modal-eyebrow">Subscription billing</p>
                <h3 id="update-card-title" className="dealioo-billing-modal-title">
                  {paymentMethod ? "Update payment card" : "Add payment card"}
                </h3>
              </div>
              <button
                type="button"
                className="dealioo-billing-modal-close"
                aria-label="Close"
                disabled={cardLoading}
                onClick={closeCardModal}
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            </header>

            <div className="dealioo-billing-modal-body">
              <p className="dealioo-billing-modal-lead">
                This card is used for your Dealioo plan renewals. Enter your details
                below to {paymentMethod ? "replace" : "save"} the card on file.
              </p>

              <div className="dealioo-billing-modal-trust" aria-label="Security notes">
                <span className="dealioo-billing-modal-trust-chip">
                  <Shield className="size-3.5" strokeWidth={2.25} aria-hidden />
                  Secured by Stripe
                </span>
                <span className="dealioo-billing-modal-trust-chip">
                  <Lock className="size-3.5" strokeWidth={2.25} aria-hidden />
                  Dealioo never stores full card numbers
                </span>
              </div>

              <div className="dealioo-billing-modal-stripe-shell">
                {cardLoading ? (
                  <div className="dealioo-billing-modal-loading" aria-busy="true">
                    <div className="dealioo-billing-modal-loading-row">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Preparing secure card form…
                    </div>
                    <div className="dealioo-billing-modal-skeleton" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="dealioo-billing-modal-skeleton" />
                      <div className="dealioo-billing-modal-skeleton" />
                    </div>
                    <div className="dealioo-billing-modal-skeleton dealioo-billing-modal-skeleton--tall" />
                  </div>
                ) : cardError ? (
                  <>
                    <div className="dealioo-billing-modal-error" role="alert">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>{cardError}</span>
                    </div>
                    <div className="dealioo-billing-modal-actions !mt-0 !border-t-0 !pt-0">
                      <button
                        type="button"
                        onClick={closeCardModal}
                        className="dealioo-billing-modal-btn dealioo-billing-modal-btn--ghost"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleOpenCardModal()}
                        className="dealioo-billing-modal-btn dealioo-billing-modal-btn--primary"
                      >
                        Try again
                      </button>
                    </div>
                  </>
                ) : cardClientSecret ? (
                  <OwnerBillingCardForm
                    clientSecret={cardClientSecret}
                    onSuccess={() => void handleCardSaved()}
                    onCancel={closeCardModal}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {billingEditOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-billing-title"
            className="w-full max-w-lg rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-2">
              <MapPin className="mt-1 size-4 text-brand-primary" aria-hidden />
              <div>
                <h3
                  id="edit-billing-title"
                  className="text-lg font-semibold text-brand-navy"
                >
                  Edit billing information
                </h3>
                <p className="mt-1 text-sm text-brand-muted">
                  This updates the name and address Stripe uses on invoices.
                  Invoice email stays on your Dealioo account email.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-semibold text-brand-navy">Name</span>
                <input
                  value={billingForm.name}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-semibold text-brand-navy">Email</span>
                <input
                  type="email"
                  value={billingForm.email}
                  readOnly
                  disabled
                  className={`${inputClass} cursor-not-allowed bg-slate-50`}
                />
                <span className="text-xs text-brand-muted">
                  Invoices are sent here. Change it in Account settings.
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-semibold text-brand-navy">Address</span>
                <input
                  value={billingForm.line1}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      line1: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-semibold text-brand-navy">
                  Apartment, suite (optional)
                </span>
                <input
                  value={billingForm.line2}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      line2: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-brand-navy">City</span>
                <input
                  value={billingForm.city}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-brand-navy">State</span>
                <input
                  value={billingForm.state}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      state: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-brand-navy">Postal code</span>
                <input
                  value={billingForm.postalCode}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      postalCode: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-brand-navy">
                  Country (US, CA, GB…)
                </span>
                <input
                  value={billingForm.country}
                  maxLength={2}
                  onChange={(event) =>
                    setBillingForm((current) => ({
                      ...current,
                      country: event.target.value.toUpperCase(),
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>
            {billingEditError ? (
              <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                {billingEditError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={billingSaving}
                onClick={() => setBillingEditOpen(false)}
                className={secondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={billingSaving}
                onClick={() => void handleSaveBillingDetails()}
                className={primaryBtnClass}
              >
                {billingSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        onCancel={() => {
          if (cancelling) return;
          setCancelOpen(false);
          resetCancelForm();
        }}
        title="Cancel subscription?"
        description={
          <div className="flex flex-col gap-4">
            <p>
              Your plan stays active until the end of the current billing
              period. After that, it ends automatically and you can subscribe
              again later.
            </p>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-2 text-sm font-semibold text-inherit">
                Why are you cancelling?
              </legend>
              <div className="flex flex-col gap-2">
                {CANCEL_REASON_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-2.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={option.value}
                      checked={cancelReason === option.value}
                      disabled={cancelling}
                      onChange={() => {
                        setCancelReason(option.value);
                        setCancelError(null);
                      }}
                      className="mt-1"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {cancelReason === "other" ? (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold">Please tell us more</span>
                <textarea
                  value={cancelComment}
                  disabled={cancelling}
                  onChange={(e) => {
                    setCancelComment(e.target.value);
                    setCancelError(null);
                  }}
                  rows={3}
                  maxLength={1000}
                  placeholder="What made you decide to cancel?"
                  className="w-full resize-y rounded-xl border border-[#d8e3f2] bg-white px-3 py-2 text-sm text-brand-navy outline-none focus:border-brand-primary"
                />
              </label>
            ) : null}
            {cancelError ? (
              <p className="text-sm font-medium text-red-700" role="alert">
                {cancelError}
              </p>
            ) : null}
          </div>
        }
        confirmLabel="Cancel at period end"
        loadingLabel="Scheduling…"
        cancelLabel="Keep plan"
        tone="danger"
        isLoading={cancelling}
        confirmDisabled={
          !cancelReason ||
          (cancelReason === "other" && !cancelComment.trim())
        }
        onConfirm={() => {
          void handleCancelSubscription();
        }}
      />
    </>
  );
}

function InvoiceRow({
  invoice,
  planName,
  billingCycle,
}: {
  invoice: BillingInvoice;
  planName: string;
  billingCycle: "monthly" | "annual";
}) {
  const [opening, setOpening] = useState<"invoice" | "pdf" | null>(null);
  const invoiceId = invoice.number ? `#${invoice.number}` : invoice.id.slice(-6);

  const openInvoice = async (kind: "invoice" | "pdf") => {
    if (opening) return;
    setOpening(kind);
    try {
      await downloadBillingInvoicePdf(
        invoice.id,
        invoice.number,
        kind === "invoice" ? "preview" : "download",
      );
      if (kind === "pdf") {
        toast.success("Invoice PDF downloaded.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invoice is not available.",
      );
    } finally {
      setOpening(null);
    }
  };

  return (
    <tr>
      <td>
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
          <div>
            <p className="font-semibold">{formatShortDate(invoice.createdAt)}</p>
            <p className="dealioo-billing-hint">Invoice {invoiceId}</p>
          </div>
        </div>
      </td>
      <td>
        <p className="font-semibold">
          {planName} - {formatBillingCycle(billingCycle)}
        </p>
        <p className="dealioo-billing-hint">
          {formatInvoicePeriod(invoice.createdAt, billingCycle)}
        </p>
      </td>
      <td>
        <span className="font-semibold">{invoice.amountFormatted}</span>
      </td>
      <td>
        <span className="dealioo-billing-pill dealioo-billing-pill--success">
          <Check className="size-3" strokeWidth={2.5} aria-hidden />
          {formatStatus(invoice.status)}
        </span>
      </td>
      <td>
        <div className="dealioo-billing-actions">
          <button
            type="button"
            disabled={opening != null}
            onClick={() => void openInvoice("invoice")}
            className="dealioo-billing-ghost-btn"
          >
            {opening === "invoice" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <FileText className="size-3.5" aria-hidden />
            )}
            Invoice
          </button>
          <button
            type="button"
            disabled={opening != null}
            onClick={() => void openInvoice("pdf")}
            className="dealioo-billing-ghost-btn"
          >
            {opening === "pdf" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="size-3.5" aria-hidden />
            )}
            PDF
          </button>
        </div>
      </td>
    </tr>
  );
}
