"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import type { BillingCycle } from "@/app/components/landing/pricing-plans";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { Skeleton } from "@/app/components/skeleton";
import { initialsFromName } from "@/app/components/super-admin/super-admin-list-helpers";
import planStyles from "@/app/components/super-admin/SuperAdminPlansPanel.module.css";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  createAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
  getAdminSubscriptionPlans,
  updateAdminSubscriptionPlan,
  type AdminSubscriptionPlan,
  type AdminSubscriptionPlanInput,
} from "@/app/services/admin/admin-subscription-plans";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CircleDot,
  CreditCard,
  Eye,
  Hash,
  Info,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

type PlanTab = "all" | "active" | "inactive";

type PlanDraft = {
  slug: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyOriginalPrice: string;
  yearlyOriginalPrice: string;
  promo: string;
  currency: string;
  isActive: boolean;
  sortOrder: string;
  badge: string;
  tagline: string;
  summary: string;
  cta: string;
  highlighted: boolean;
  color: string;
  features: string[];
};

const TAB_OPTIONS: Array<{ id: PlanTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

function PlansStatsSkeleton() {
  return (
    <div className={styles.usersDirStats} aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className={styles.usersDirStatCard}>
          <div className="w-full space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="size-9 shrink-0 rounded-full" />
        </article>
      ))}
    </div>
  );
}

function PlansTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table
      className={styles.usersDirTable}
      aria-busy="true"
      aria-label="Loading plans"
    >
      <thead>
        <tr>
          <th style={{ width: "3rem" }}>
            <Skeleton className="h-3 w-4" />
          </th>
          <th>
            <Skeleton className="h-3 w-16" />
          </th>
          <th>
            <Skeleton className="h-3 w-14" />
          </th>
          <th>
            <Skeleton className="h-3 w-20" />
          </th>
          <th>
            <Skeleton className="h-3 w-16" />
          </th>
          <th>
            <Skeleton className="h-3 w-14" />
          </th>
          <th style={{ width: "3rem" }}>
            <Skeleton className="h-3 w-4" />
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index}>
            <td>
              <Skeleton className="h-4 w-5" />
            </td>
            <td>
              <div className={styles.userCell}>
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className={styles.userCellText}>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </div>
              </div>
            </td>
            <td>
              <Skeleton className="h-4 w-16" />
            </td>
            <td>
              <Skeleton className="h-4 w-24" />
            </td>
            <td>
              <Skeleton className="h-6 w-16 rounded-full" />
            </td>
            <td>
              <Skeleton className="h-4 w-12" />
            </td>
            <td>
              <Skeleton className="size-8 rounded-lg" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const EMPTY_DRAFT: PlanDraft = {
  slug: "",
  name: "",
  monthlyPrice: "",
  yearlyPrice: "",
  monthlyOriginalPrice: "",
  yearlyOriginalPrice: "",
  promo: "",
  currency: "USD",
  isActive: true,
  sortOrder: "0",
  badge: "",
  tagline: "",
  summary: "",
  cta: "Continue",
  highlighted: false,
  color: "#1877F2",
  features: [""],
};

function planFeatureLines(plan: AdminSubscriptionPlan): string[] {
  const fromFeatures = plan.description?.features ?? [];
  const fromGroups = (plan.description?.featureGroups ?? []).flatMap(
    (group) => group.items ?? [],
  );
  const source = fromFeatures.length > 0 ? fromFeatures : fromGroups;
  const lines = source
    .flatMap((item) => String(item).split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [""];
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatMoney(value: number | null): string {
  if (value == null) return "Custom";
  if (Number.isInteger(value)) return `$${value}`;
  return `$${value.toFixed(2)}`;
}

function parseOptionalPrice(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  // $0 is Custom (no Stripe price) — same rule as backend.
  if (parsed === 0) return null;
  return Math.round(parsed * 100) / 100;
}

function priceInputFromPlan(value: number | null): string {
  return value == null ? "" : String(value);
}

function draftPricesChanged(
  draft: PlanDraft,
  original: AdminSubscriptionPlan | null,
): boolean {
  if (!original) return false;
  const next = draftToInput(draft);
  if (!isPlanInput(next)) return false;
  return (
    next.monthlyPrice !== original.monthlyPrice ||
    next.yearlyPrice !== original.yearlyPrice ||
    (next.currency || "USD").toUpperCase() !==
      (original.currency || "USD").toUpperCase()
  );
}

function displayPriceToInput(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[^0-9.]/g, "");
  return cleaned;
}

function draftFromPlan(plan: AdminSubscriptionPlan): PlanDraft {
  return {
    slug: plan.slug,
    name: plan.name,
    monthlyPrice: priceInputFromPlan(plan.monthlyPrice),
    yearlyPrice: priceInputFromPlan(plan.yearlyPrice),
    monthlyOriginalPrice: displayPriceToInput(
      plan.description?.monthly?.originalPrice,
    ),
    yearlyOriginalPrice: displayPriceToInput(
      plan.description?.annual?.originalPrice,
    ),
    promo:
      plan.description?.monthly?.promo ??
      plan.description?.annual?.promo ??
      "",
    currency: plan.currency || "USD",
    isActive: plan.isActive,
    sortOrder: String(plan.sortOrder ?? 0),
    badge: plan.description?.badge ?? "",
    tagline: plan.description?.tagline ?? "",
    summary: plan.description?.summary ?? "",
    cta: plan.description?.cta ?? "Continue",
    highlighted: Boolean(plan.description?.highlighted),
    color: plan.description?.color ?? "#1877F2",
    features: planFeatureLines(plan),
  };
}

function draftToInput(
  draft: PlanDraft,
): AdminSubscriptionPlanInput | { error: string } {
  const name = draft.name.trim();
  const slug = slugify(draft.slug || draft.name);
  if (!name) return { error: "Enter a plan name." };
  if (!slug) return { error: "Enter a valid slug (letters, numbers, hyphens)." };

  const monthlyPrice = parseOptionalPrice(draft.monthlyPrice);
  const yearlyPrice = parseOptionalPrice(draft.yearlyPrice);
  const monthlyOriginalPrice = parseOptionalPrice(draft.monthlyOriginalPrice);
  const yearlyOriginalPrice = parseOptionalPrice(draft.yearlyOriginalPrice);
  if (
    monthlyPrice === undefined ||
    yearlyPrice === undefined ||
    monthlyOriginalPrice === undefined ||
    yearlyOriginalPrice === undefined
  ) {
    return {
      error: "Prices must be blank (Custom) or a number greater than zero.",
    };
  }

  const currency = draft.currency.trim().toUpperCase() || "USD";
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { error: "Currency must be a 3-letter code (e.g. USD)." };
  }

  const sortOrder = Number(draft.sortOrder);
  return {
    slug,
    name,
    monthlyPrice,
    yearlyPrice,
    monthlyOriginalPrice,
    yearlyOriginalPrice,
    promo: draft.promo.trim() || null,
    currency,
    isActive: draft.isActive,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    badge: draft.badge.trim() || null,
    tagline: draft.tagline.trim(),
    summary: draft.summary.trim(),
    cta: draft.cta.trim() || "Continue",
    highlighted: draft.highlighted,
    color: draft.color.trim() || "#1877F2",
    features: draft.features.map((line) => line.trim()).filter(Boolean),
  };
}

function isPlanInput(
  value: AdminSubscriptionPlanInput | { error: string },
): value is AdminSubscriptionPlanInput {
  return !("error" in value);
}

function formatPlanDisplayPrice(value: string): string {
  const parsed = parseOptionalPrice(value);
  if (parsed === undefined) return "—";
  if (parsed == null) return "Custom";
  if (Number.isInteger(parsed)) return `$${parsed}`;
  return `$${parsed.toFixed(2)}`;
}

type PlanPreviewModel = {
  name: string;
  badge: string | null;
  tagline: string;
  summary: string;
  price: string;
  period: string;
  originalPrice: string | null;
  promo: string | null;
  subline: string | null;
  features: string[];
  cta: string;
  highlighted: boolean;
  color: string;
  isActive: boolean;
};

/** Live customer-facing card model from the admin form draft. */
function draftToPreviewModel(
  draft: PlanDraft,
  billing: BillingCycle,
): PlanPreviewModel {
  const monthly = parseOptionalPrice(draft.monthlyPrice);
  const yearly = parseOptionalPrice(draft.yearlyPrice);
  const monthlyOriginal = parseOptionalPrice(draft.monthlyOriginalPrice);
  const yearlyOriginal = parseOptionalPrice(draft.yearlyOriginalPrice);
  const promo = draft.promo.trim() || null;
  const annualPerMonth =
    yearly == null
      ? null
      : Math.round((yearly / 12) * 100) / 100;

  const isAnnual = billing === "annual";
  const price = isAnnual
    ? annualPerMonth == null
      ? "Custom"
      : Number.isInteger(annualPerMonth)
        ? `$${annualPerMonth}`
        : `$${annualPerMonth.toFixed(2)}`
    : formatPlanDisplayPrice(draft.monthlyPrice);
  const originalPrice = isAnnual
    ? yearlyOriginal == null
      ? null
      : formatPlanDisplayPrice(draft.yearlyOriginalPrice)
    : monthlyOriginal == null
      ? null
      : formatPlanDisplayPrice(draft.monthlyOriginalPrice);

  return {
    name: draft.name.trim() || "Plan name",
    badge: draft.badge.trim() || null,
    tagline: draft.tagline.trim() || "Plan tagline appears here",
    summary: draft.summary.trim() || "Plan summary appears here",
    price,
    period: isAnnual
      ? annualPerMonth == null
        ? ""
        : "/ mo"
      : monthly == null
        ? ""
        : "/ month",
    originalPrice,
    promo,
    subline: isAnnual
      ? yearly == null
        ? null
        : `Billed annually ($${yearly}/year)`
      : monthly == null
        ? null
        : "Billed monthly",
    features: draft.features.map((line) => line.trim()).filter(Boolean),
    cta: draft.cta.trim() || "Continue",
    highlighted: draft.highlighted,
    color: draft.color.trim() || "#1877F2",
    isActive: draft.isActive,
  };
}

function AdminPlanPreviewCard({ model }: { model: PlanPreviewModel }) {
  return (
    <div
      className={`${planStyles.previewCard} ${
        model.highlighted ? planStyles.previewCardFeatured : ""
      }`}
      style={
        model.highlighted
          ? { borderColor: model.color, boxShadow: `0 0 0 2px ${model.color}33` }
          : undefined
      }
    >
      <div className={planStyles.previewCardTop}>
        {model.badge ? (
          <span
            className={`${planStyles.previewBadge} ${
              model.highlighted ? planStyles.previewBadgeFeatured : ""
            }`}
            style={
              model.highlighted
                ? { backgroundColor: model.color, color: "#fff" }
                : undefined
            }
          >
            {model.badge}
          </span>
        ) : (
          <span />
        )}
        {model.promo ? (
          <span className={planStyles.previewPromo}>{model.promo}</span>
        ) : null}
      </div>

      <h3 className={planStyles.previewName}>{model.name}</h3>
      <p className={planStyles.previewTagline}>{model.tagline}</p>

      <div className={planStyles.previewPriceRow}>
        {model.originalPrice ? (
          <span className={planStyles.previewOriginal}>{model.originalPrice}</span>
        ) : null}
        <span className={planStyles.previewPrice}>{model.price}</span>
        {model.period ? (
          <span className={planStyles.previewPeriod}>{model.period}</span>
        ) : null}
      </div>
      {model.subline ? (
        <p className={planStyles.previewSubline}>{model.subline}</p>
      ) : null}

      <p className={planStyles.previewSummary}>{model.summary}</p>

      {model.features.length > 0 ? (
        <ul className={planStyles.previewFeatures}>
          {model.features.map((feature) => (
            <li key={feature}>
              <Check className={planStyles.previewCheck} strokeWidth={3} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={planStyles.previewEmptyFeatures}>
          Add feature lines to show them on the card.
        </p>
      )}

      <div className={planStyles.previewCta}>{model.cta}</div>
    </div>
  );
}

function PlanFormModal({
  mode,
  draft,
  saving,
  editingPlan,
  onClose,
  onChange,
  onSave,
}: {
  mode: "create" | "edit";
  draft: PlanDraft;
  saving: boolean;
  editingPlan: AdminSubscriptionPlan | null;
  onClose: () => void;
  onChange: (patch: Partial<PlanDraft>) => void;
  onSave: () => void;
}) {
  const [slugManual, setSlugManual] = useState(mode === "edit");
  const [previewBilling, setPreviewBilling] =
    useState<BillingCycle>("monthly");
  const previewModel = useMemo(
    () => draftToPreviewModel(draft, previewBilling),
    [draft, previewBilling],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        className={`${styles.userControl} ${styles.userControlAdd} ${planStyles.planFormModal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-plan-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.userControlClose}
          onClick={onClose}
          disabled={saving}
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <div className={`${styles.userControlAddHead} ${planStyles.planFormHead}`}>
          <span className={styles.userControlAddHeroIcon} aria-hidden>
            <CreditCard className="size-6" color="#000000" strokeWidth={2.25} />
          </span>
          <div>
            <h3 id="sa-plan-form-title" className={styles.userControlTitle}>
              {mode === "create" ? "Add plan" : "Manage plan"}
            </h3>
            <p className={styles.userControlSub}>
              {mode === "create"
                ? "Create a business plan customers can choose at signup. Leave prices blank for Custom / sales-assisted plans."
                : "Update pricing and plan details. Changing price creates a new Stripe price for future checkouts."}
            </p>
            <div className={styles.userControlAddMeta}>
              <span className={styles.userControlAddMetaChip}>
                <Tag className="size-3" strokeWidth={2.25} aria-hidden />
                {draft.slug || "new-plan"}
              </span>
              <span className={styles.userControlAddMetaChip}>
                <Sparkles className="size-3" strokeWidth={2.25} aria-hidden />
                {draft.highlighted ? "Highlighted" : "Standard"}
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.userControlAddBody} ${planStyles.planFormBody}`}>
          <div className={planStyles.planFormFields}>
          <p className={planStyles.modalCallout}>
            <strong>Stripe:</strong> priced plans sync automatically.{" "}
            <strong>Existing subscribers</strong> keep their current Stripe
            price until they change plan — only new checkouts use the updated
            amount. Leave a price blank for Custom (no Stripe price).
          </p>
          <div className={styles.userControlAddCard}>
            <p className={styles.userControlAddSectionLabel}>Basics</p>
            <div className={styles.userControlAddNameRow}>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-name">
                  <CreditCard
                    className={`size-3.5 ${styles.userControlFieldIcon}`}
                    color="#000000"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  Plan name
                </label>
                <input
                  id="sa-plan-name"
                  value={draft.name}
                  disabled={saving}
                  onChange={(event) => {
                    const name = event.target.value;
                    onChange({
                      name,
                      ...(mode === "create" && !slugManual
                        ? { slug: slugify(name) }
                        : {}),
                    });
                  }}
                  placeholder="Starter"
                />
              </div>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-slug">
                  <Hash
                    className={`size-3.5 ${styles.userControlFieldIcon}`}
                    color="#000000"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  Slug
                </label>
                <input
                  id="sa-plan-slug"
                  value={draft.slug}
                  disabled={saving}
                  onChange={(event) => {
                    setSlugManual(true);
                    onChange({ slug: slugify(event.target.value) });
                  }}
                  placeholder="starter"
                />
              </div>
            </div>
            <div className={styles.userControlAddNameRow}>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-monthly">Monthly price</label>
                <input
                  id="sa-plan-monthly"
                  value={draft.monthlyPrice}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ monthlyPrice: event.target.value })
                  }
                  placeholder="29"
                />
              </div>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-yearly">Yearly price</label>
                <input
                  id="sa-plan-yearly"
                  value={draft.yearlyPrice}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ yearlyPrice: event.target.value })
                  }
                  placeholder="290"
                />
              </div>
            </div>
            <div className={styles.userControlAddNameRow}>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-monthly-original">
                  Monthly original price
                </label>
                <input
                  id="sa-plan-monthly-original"
                  value={draft.monthlyOriginalPrice}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ monthlyOriginalPrice: event.target.value })
                  }
                  placeholder="997"
                />
              </div>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-yearly-original">
                  Yearly original price
                </label>
                <input
                  id="sa-plan-yearly-original"
                  value={draft.yearlyOriginalPrice}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ yearlyOriginalPrice: event.target.value })
                  }
                  placeholder="997"
                />
              </div>
            </div>
            <div className={styles.userControlField}>
              <label htmlFor="sa-plan-promo">Discount label</label>
              <input
                id="sa-plan-promo"
                value={draft.promo}
                disabled={saving}
                onChange={(event) => onChange({ promo: event.target.value })}
                placeholder="70% OFF"
              />
            </div>
            <div className={styles.userControlAddNameRow}>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-currency">Currency</label>
                <input
                  id="sa-plan-currency"
                  value={draft.currency}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ currency: event.target.value.toUpperCase() })
                  }
                  placeholder="USD"
                />
              </div>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-sort">Sort order</label>
                <input
                  id="sa-plan-sort"
                  value={draft.sortOrder}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ sortOrder: event.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className={styles.userControlAddCard}>
            <p className={styles.userControlAddSectionLabel}>Card copy</p>
            <div className={styles.userControlField}>
              <label htmlFor="sa-plan-badge">Badge</label>
              <input
                id="sa-plan-badge"
                value={draft.badge}
                disabled={saving}
                onChange={(event) => onChange({ badge: event.target.value })}
                placeholder="Most Popular"
              />
            </div>
            <div className={styles.userControlField}>
              <label htmlFor="sa-plan-tagline">Tagline</label>
              <input
                id="sa-plan-tagline"
                value={draft.tagline}
                disabled={saving}
                onChange={(event) => onChange({ tagline: event.target.value })}
              />
            </div>
            <div className={styles.userControlField}>
              <label htmlFor="sa-plan-summary">Summary</label>
              <textarea
                id="sa-plan-summary"
                rows={3}
                value={draft.summary}
                disabled={saving}
                onChange={(event) => onChange({ summary: event.target.value })}
              />
            </div>
            <div className={styles.userControlField}>
              <label htmlFor="sa-plan-features">Features</label>
              <div className={styles.userControlFeatureList}>
                {draft.features.map((feature, index) => (
                  <div key={index} className={styles.userControlFeatureRow}>
                    <input
                      id={index === 0 ? "sa-plan-features" : undefined}
                      value={feature}
                      disabled={saving}
                      placeholder={`Feature ${index + 1}`}
                      onChange={(event) => {
                        const next = [...draft.features];
                        next[index] = event.target.value;
                        onChange({ features: next });
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        const next = [...draft.features];
                        next.splice(index + 1, 0, "");
                        onChange({ features: next });
                      }}
                    />
                    <button
                      type="button"
                      className={styles.userMenuBtn}
                      aria-label={`Remove feature ${index + 1}`}
                      disabled={saving || draft.features.length <= 1}
                      onClick={() => {
                        const next = draft.features.filter((_, i) => i !== index);
                        onChange({
                          features: next.length > 0 ? next : [""],
                        });
                      }}
                    >
                      <X className="size-3.5" strokeWidth={2.25} aria-hidden />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.usersDirActionLink}
                  disabled={saving}
                  onClick={() =>
                    onChange({ features: [...draft.features, ""] })
                  }
                >
                  <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
                  Add feature line
                </button>
              </div>
            </div>
            <div className={styles.userControlAddNameRow}>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-cta">CTA</label>
                <input
                  id="sa-plan-cta"
                  value={draft.cta}
                  disabled={saving}
                  onChange={(event) => onChange({ cta: event.target.value })}
                />
              </div>
              <div className={styles.userControlField}>
                <label htmlFor="sa-plan-color">Accent color</label>
                <input
                  id="sa-plan-color"
                  value={draft.color}
                  disabled={saving}
                  onChange={(event) => onChange({ color: event.target.value })}
                  placeholder="#1877F2"
                />
              </div>
            </div>
            <div className={styles.userControlCheckRow}>
              <label className={styles.userControlCheck}>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ isActive: event.target.checked })
                  }
                />
                <span>
                  Active on signup
                  <span className={planStyles.toggleHint}>
                    Inactive plans stay in admin but are hidden from customers
                  </span>
                </span>
              </label>
              <label className={styles.userControlCheck}>
                <input
                  type="checkbox"
                  checked={draft.highlighted}
                  disabled={saving}
                  onChange={(event) =>
                    onChange({ highlighted: event.target.checked })
                  }
                />
                <span>
                  Highlighted
                  <span className={planStyles.toggleHint}>
                    Featured styling on the pricing card
                  </span>
                </span>
              </label>
            </div>
          </div>
          </div>

          <aside className={planStyles.planPreviewPane} aria-label="Plan card preview">
            <div className={planStyles.planPreviewHead}>
              <div className={planStyles.planPreviewTitleRow}>
                <Eye className="size-3.5" strokeWidth={2.25} aria-hidden />
                <p className={planStyles.planPreviewTitle}>Customer preview</p>
              </div>
              <p className={planStyles.planPreviewHint}>
                Live look of the pricing card from the fields on the left
              </p>
              <div
                className={planStyles.previewBillingToggle}
                role="radiogroup"
                aria-label="Preview billing cycle"
              >
                {(
                  [
                    { id: "monthly" as const, label: "Monthly" },
                    { id: "annual" as const, label: "Yearly" },
                  ] as const
                ).map((option) => {
                  const selected = previewBilling === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`${planStyles.previewBillingBtn} ${
                        selected ? planStyles.previewBillingBtnActive : ""
                      }`}
                      onClick={() => setPreviewBilling(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={planStyles.planPreviewCardWrap}>
              <AdminPlanPreviewCard model={previewModel} />
            </div>
            {mode === "edit" && editingPlan ? (
              <div className={planStyles.stripeStatusBox}>
                <p className={planStyles.stripeStatusTitle}>Stripe billing</p>
                <div className={planStyles.stripeStatusRow}>
                  <span
                    className={`${planStyles.stripeChip} ${
                      editingPlan.stripe.monthlySynced ||
                      editingPlan.monthlyPrice == null
                        ? planStyles.stripeChipOk
                        : planStyles.stripeChipWarn
                    }`}
                  >
                    Monthly{" "}
                    {editingPlan.monthlyPrice == null
                      ? "Custom"
                      : editingPlan.stripe.monthlySynced
                        ? "synced"
                        : "missing"}
                  </span>
                  <span
                    className={`${planStyles.stripeChip} ${
                      editingPlan.stripe.yearlySynced ||
                      editingPlan.yearlyPrice == null
                        ? planStyles.stripeChipOk
                        : planStyles.stripeChipWarn
                    }`}
                  >
                    Yearly{" "}
                    {editingPlan.yearlyPrice == null
                      ? "Custom"
                      : editingPlan.stripe.yearlySynced
                        ? "synced"
                        : "missing"}
                  </span>
                </div>
                <p className={planStyles.stripeStatusHint}>
                  {editingPlan.activeSubscriberCount > 0
                    ? `${editingPlan.activeSubscriberCount} active subscriber${editingPlan.activeSubscriberCount === 1 ? "" : "s"} on this plan`
                    : "No active subscribers on this plan"}
                </p>
              </div>
            ) : null}
            {!previewModel.isActive ? (
              <p className={planStyles.previewInactiveNote}>
                This plan is inactive — customers will not see it on signup.
              </p>
            ) : null}
          </aside>
        </div>

        <div className={`${styles.userControlActions} ${planStyles.planFormActions}`}>
          <p className={`${styles.userControlAddFooterNote} ${planStyles.planFormFooterNote}`}>
            Required: plan name and slug. Use blank prices for Custom plans.
          </p>
          <div className={`${styles.userControlAddFooterBtns} ${planStyles.planFormFooterBtns}`}>
            <button
              type="button"
              className={styles.userControlSecondary}
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.userControlPrimary}
              disabled={saving}
              onClick={onSave}
            >
              {mode === "create" ? (
                <Plus className="size-4" strokeWidth={2.4} aria-hidden />
              ) : (
                <Pencil className="size-4" strokeWidth={2.4} aria-hidden />
              )}
              {saving
                ? mode === "create"
                  ? "Creating…"
                  : "Saving…"
                : mode === "create"
                  ? "Create plan"
                  : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SuperAdminPlansPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<PlanTab>("all");
  const [formOpen, setFormOpen] = useState<"create" | "edit" | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT);
  const [priceConfirmOpen, setPriceConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminSubscriptionPlan | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const plansQuery = useQuery({
    queryKey: adminQueryKeys.subscriptionPlans(),
    queryFn: getAdminSubscriptionPlans,
    enabled: hasAuthSession(),
    staleTime: 20_000,
  });

  const items = useMemo(
    () => plansQuery.data?.items ?? [],
    [plansQuery.data?.items],
  );
  const counts = plansQuery.data?.counts ?? { all: 0, active: 0, inactive: 0 };
  const editingPlan = useMemo(
    () => items.find((plan) => plan.id === editingPlanId) ?? null,
    [items, editingPlanId],
  );

  const filteredItems = useMemo(() => {
    const search = debouncedSearch.toLowerCase();
    return items.filter((plan) => {
      if (tab === "active" && !plan.isActive) return false;
      if (tab === "inactive" && plan.isActive) return false;
      if (!search) return true;
      const haystack = [
        plan.name,
        plan.slug,
        plan.description?.badge,
        plan.description?.tagline,
        plan.description?.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [items, tab, debouncedSearch]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const showingStart = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageItems = filteredItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const loading = plansQuery.isLoading || plansQuery.isFetching;
  const errorMessage = plansQuery.error
    ? getApiErrorMessage(plansQuery.error, "Could not load plans.")
    : null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = draftToInput(draft);
      if (!isPlanInput(input)) {
        throw new Error(input.error);
      }
      if (formOpen === "edit" && editingPlanId) {
        return updateAdminSubscriptionPlan(editingPlanId, input);
      }
      return createAdminSubscriptionPlan(input);
    },
    onSuccess: async () => {
      toast.success(formOpen === "edit" ? "Plan updated." : "Plan created.");
      setPriceConfirmOpen(false);
      setDeactivateConfirmOpen(false);
      setFormOpen(null);
      setEditingPlanId(null);
      setDraft(EMPTY_DRAFT);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.subscriptionPlansRoot(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not save plan."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => deleteAdminSubscriptionPlan(planId),
    onSuccess: async () => {
      toast.success("Plan deleted.");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.subscriptionPlansRoot(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not delete plan."));
    },
  });

  const requestSave = () => {
    const input = draftToInput(draft);
    if (!isPlanInput(input)) {
      toast.error(input.error);
      return;
    }
    if (
      formOpen === "edit" &&
      editingPlan?.isActive &&
      !draft.isActive &&
      (editingPlan.activeSubscriberCount ?? 0) > 0
    ) {
      setDeactivateConfirmOpen(true);
      return;
    }
    if (formOpen === "edit" && draftPricesChanged(draft, editingPlan)) {
      setPriceConfirmOpen(true);
      return;
    }
    saveMutation.mutate();
  };

  const openCreate = () => {
    setEditingPlanId(null);
    setDraft(EMPTY_DRAFT);
    setPriceConfirmOpen(false);
    setDeactivateConfirmOpen(false);
    setFormOpen("create");
  };

  const openEdit = (plan: AdminSubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setDraft(draftFromPlan(plan));
    setPriceConfirmOpen(false);
    setDeactivateConfirmOpen(false);
    setFormOpen("edit");
  };

  const tabCounts: Record<PlanTab, number> = {
    all: counts.all,
    active: counts.active,
    inactive: counts.inactive,
  };

  const stats = [
    {
      label: "Total Plans",
      value: counts.all,
      hint: "All subscription plans",
      hintMuted: true,
      icon: CreditCard,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Active",
      value: counts.active,
      hint: "Shown on signup",
      hintMuted: true,
      icon: CircleDot,
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "Inactive",
      value: counts.inactive,
      hint: "Hidden from signup",
      hintMuted: true,
      icon: Tag,
      iconBg: "#f1f5f9",
      iconColor: "#64748b",
    },
    {
      label: "Showing now",
      value: filteredItems.length,
      hint: debouncedSearch ? "Filtered results" : "Current filter",
      hintMuted: true,
      icon: Search,
      iconBg: "#f5f3ff",
      iconColor: "#7c3aed",
    },
  ];

  return (
    <section
      className={`${styles.page} ${styles.usersDir} ${styles.usersDirBlackActions} ${planStyles.plansShell}`}
      aria-label="Plans"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Plans</h1>
            <p className={styles.subtitle}>
              Catalog of Dealioo subscription packages — pricing, copy, and
              signup visibility. Customer purchases live under Subscriptions.
            </p>
          </div>
          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, slug, or badge…"
                className={styles.usersDirSearchInput}
                aria-label="Search plans"
              />
            </label>
            <button
              type="button"
              className={styles.usersDirAddBtn}
              onClick={openCreate}
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Add plan
            </button>
          </div>
        </div>

        <div className={planStyles.notice} role="note">
          <span className={planStyles.noticeIcon} aria-hidden>
            <Info className="size-3.5" strokeWidth={2.25} />
          </span>
          <p className="m-0">
            Active plans appear on signup. Changing a price updates Stripe for
            new checkouts only — existing subscribers keep their current price
            until they change plan.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void plansQuery.refetch()}
            />
          </div>
        ) : null}

        {loading && items.length === 0 ? (
          <PlansStatsSkeleton />
        ) : (
          <div className={styles.usersDirStats}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className={styles.usersDirStatCard}>
                  <div>
                    <p className={styles.usersDirStatLabel}>{stat.label}</p>
                    <p className={styles.usersDirStatValue}>
                      {stat.value.toLocaleString()}
                    </p>
                    <p
                      className={`${styles.usersDirStatHint} ${
                        stat.hintMuted ? styles.usersDirStatHintMuted : ""
                      }`}
                    >
                      {stat.hint}
                    </p>
                  </div>
                  <span
                    className={styles.usersDirStatIcon}
                    style={{ background: stat.iconBg, color: stat.iconColor }}
                    aria-hidden
                  >
                    <Icon className="size-4" strokeWidth={2.25} />
                  </span>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.usersDirToolbar}>
          <div
            className={planStyles.segmentTabs}
            role="tablist"
            aria-label="Plan status"
          >
            {TAB_OPTIONS.map((option) => {
              const selected = tab === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`${planStyles.segmentTab} ${
                    selected ? planStyles.segmentTabActive : ""
                  }`}
                  onClick={() => {
                    setTab(option.id);
                    setPage(1);
                  }}
                >
                  {option.label}
                  <span className={planStyles.segmentCount}>
                    {tabCounts[option.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className={planStyles.tableHint}>
            {total === 0
              ? "No plans in this view"
              : `Showing ${showingStart}–${Math.min(showingStart + pageItems.length - 1, total)} of ${total}`}
          </p>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading && items.length === 0 ? (
              <PlansTableSkeleton />
            ) : pageItems.length === 0 ? (
              <div className={planStyles.emptyState}>
                <p className={planStyles.emptyTitle}>
                  {debouncedSearch || tab !== "all"
                    ? "No plans match this view"
                    : "No plans yet"}
                </p>
                <p className={planStyles.emptyCopy}>
                  {debouncedSearch || tab !== "all"
                    ? "Try another search or status filter, or create a new plan."
                    : "Create your first subscription plan to show on signup and bill through Stripe."}
                </p>
                {!debouncedSearch && tab === "all" ? (
                  <button
                    type="button"
                    className={styles.usersDirAddBtn}
                    onClick={openCreate}
                  >
                    <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                    Add plan
                  </button>
                ) : null}
              </div>
            ) : (
              <table className={styles.usersDirTable}>
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>
                      <span className={styles.meetingsThWithIcon}>
                        <Hash
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span className="sr-only">Row number</span>
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CreditCard
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Plan
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Tag
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Monthly
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Tag
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Yearly
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <Users
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Subscribers
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>
                        <CircleDot
                          className="size-3.5"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        Status
                      </span>
                    </th>
                    <th>
                      <span className={styles.meetingsThWithIcon}>Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((plan, index) => {
                    const rowNumber = showingStart + index;
                    const featureCount = planFeatureLines(plan).filter(Boolean)
                      .length;
                    return (
                      <tr
                        key={plan.id}
                        className={styles.usersDirRowClickable}
                        onClick={() => openEdit(plan)}
                      >
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {rowNumber}.
                          </span>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <span
                              className={planStyles.initialsAvatar}
                              style={{
                                background:
                                  plan.description?.color || undefined,
                                color: plan.description?.color
                                  ? "#fff"
                                  : undefined,
                                borderColor: plan.description?.color
                                  ? "transparent"
                                  : undefined,
                              }}
                              aria-hidden
                            >
                              {initialsFromName(plan.name || plan.slug || "?")}
                            </span>
                            <div className={styles.userCellText}>
                              <div className={planStyles.planNameRow}>
                                <span className={styles.bizName}>
                                  {plan.name || "—"}
                                </span>
                                {plan.description?.badge ? (
                                  <span className={planStyles.planBadge}>
                                    {plan.description.badge}
                                  </span>
                                ) : null}
                                {plan.description?.highlighted ? (
                                  <span className={planStyles.planHighlight}>
                                    Featured
                                  </span>
                                ) : null}
                              </div>
                              <div className={styles.bizMeta}>
                                {plan.slug}
                                {featureCount > 0
                                  ? ` · ${featureCount} feature${featureCount === 1 ? "" : "s"}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={planStyles.priceCell}>
                            <span className={planStyles.priceMain}>
                              {formatMoney(plan.monthlyPrice)}
                            </span>
                            <span className={planStyles.priceSub}>
                              {(plan.currency || "USD").toUpperCase()}
                              {plan.monthlyPrice == null ? " · Custom" : "/mo"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={planStyles.priceCell}>
                            <span className={planStyles.priceMain}>
                              {formatMoney(plan.yearlyPrice)}
                            </span>
                            <span className={planStyles.priceSub}>
                              {(plan.currency || "USD").toUpperCase()}
                              {plan.yearlyPrice == null ? " · Custom" : "/yr"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={planStyles.priceCell}>
                            <span className={planStyles.priceMain}>
                              {plan.activeSubscriberCount.toLocaleString()}
                            </span>
                            <span className={planStyles.priceSub}>
                              active
                              {plan.totalSubscriberCount >
                              plan.activeSubscriberCount
                                ? ` · ${plan.totalSubscriberCount} total`
                                : ""}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.usersDirStatusPill} ${
                              plan.isActive
                                ? planStyles.statusActive
                                : planStyles.statusInactive
                            }`}
                          >
                            <span
                              className={styles.usersDirStatusDot}
                              aria-hidden
                            />
                            {plan.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td
                          className={styles.userMenuCell}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className={planStyles.rowActions}>
                            <button
                              type="button"
                              className={planStyles.editAction}
                              aria-label={`Edit ${plan.name || plan.slug}`}
                              disabled={
                                saveMutation.isPending ||
                                deleteMutation.isPending
                              }
                              onClick={() => openEdit(plan)}
                            >
                              <Pencil
                                className="size-3.5"
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              Edit
                            </button>
                            {plan.canDelete ? (
                              <button
                                type="button"
                                className={planStyles.deleteAction}
                                aria-label={`Delete ${plan.name || plan.slug}`}
                                disabled={
                                  saveMutation.isPending ||
                                  deleteMutation.isPending
                                }
                                onClick={() => setDeleteTarget(plan)}
                              >
                                <Trash2
                                  className="size-3.5"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <OffsetPagination
            page={safePage}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            loading={loading}
            onPageChange={setPage}
            itemLabel="plans"
          />
        </div>
      </div>

      {formOpen ? (
        <PlanFormModal
          mode={formOpen}
          draft={draft}
          saving={saveMutation.isPending}
          editingPlan={editingPlan}
          onClose={() => {
            if (saveMutation.isPending) return;
            setPriceConfirmOpen(false);
            setDeactivateConfirmOpen(false);
            setFormOpen(null);
            setEditingPlanId(null);
          }}
          onChange={(patch) =>
            setDraft((current) => ({ ...current, ...patch }))
          }
          onSave={requestSave}
        />
      ) : null}

      <ConfirmDialog
        open={priceConfirmOpen}
        tone="warning"
        title="Update plan pricing?"
        description={
          (editingPlan?.activeSubscriberCount ?? 0) > 0
            ? `This creates a new Stripe price for future checkouts. ${editingPlan!.activeSubscriberCount} active subscriber${editingPlan!.activeSubscriberCount === 1 ? "" : "s"} keep their current price until they change plan.`
            : "This creates a new Stripe price for future checkouts. There are no active subscribers on this plan right now."
        }
        confirmLabel="Update pricing"
        cancelLabel="Cancel"
        isLoading={saveMutation.isPending}
        loadingLabel="Saving…"
        onCancel={() => {
          if (!saveMutation.isPending) setPriceConfirmOpen(false);
        }}
        onConfirm={() => saveMutation.mutate()}
      />

      <ConfirmDialog
        open={deactivateConfirmOpen}
        tone="warning"
        title="Deactivate this plan?"
        description={
          editingPlan
            ? `"${editingPlan.name}" has ${editingPlan.activeSubscriberCount} active subscriber${editingPlan.activeSubscriberCount === 1 ? "" : "s"}. They keep access; new customers will not see this plan on signup.`
            : "New customers will not see this plan on signup."
        }
        confirmLabel="Deactivate plan"
        cancelLabel="Cancel"
        isLoading={saveMutation.isPending}
        loadingLabel="Saving…"
        onCancel={() => {
          if (!saveMutation.isPending) setDeactivateConfirmOpen(false);
        }}
        onConfirm={() => {
          setDeactivateConfirmOpen(false);
          if (draftPricesChanged(draft, editingPlan)) {
            setPriceConfirmOpen(true);
            return;
          }
          saveMutation.mutate();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        tone="danger"
        title="Delete this plan?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" has no subscribers and will be removed permanently. This cannot be undone.`
            : "This plan will be removed permanently."
        }
        confirmLabel="Delete plan"
        cancelLabel="Cancel"
        isLoading={deleteMutation.isPending}
        loadingLabel="Deleting…"
        onCancel={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </section>
  );
}
