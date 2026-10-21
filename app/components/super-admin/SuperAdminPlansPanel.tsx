"use client";

import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { initialsFromName } from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import {
  createAdminSubscriptionPlan,
  getAdminSubscriptionPlans,
  updateAdminSubscriptionPlan,
  type AdminSubscriptionPlan,
  type AdminSubscriptionPlanInput,
} from "@/app/services/admin/admin-subscription-plans";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleDot,
  CreditCard,
  Filter,
  Hash,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
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
  return parsed;
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
    monthlyPrice:
      plan.monthlyPrice == null ? "" : String(plan.monthlyPrice),
    yearlyPrice: plan.yearlyPrice == null ? "" : String(plan.yearlyPrice),
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

function draftToInput(draft: PlanDraft): AdminSubscriptionPlanInput | null {
  const name = draft.name.trim();
  const slug = slugify(draft.slug || draft.name);
  if (!name || !slug) return null;

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
    return null;
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
    currency: draft.currency.trim().toUpperCase() || "USD",
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

function PlanFormModal({
  mode,
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  mode: "create" | "edit";
  draft: PlanDraft;
  saving: boolean;
  onClose: () => void;
  onChange: (patch: Partial<PlanDraft>) => void;
  onSave: () => void;
}) {
  const [slugManual, setSlugManual] = useState(mode === "edit");

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
        className={`${styles.userControl} ${styles.userControlAdd}`}
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

        <div className={styles.userControlAddHead}>
          <span className={styles.userControlAddHeroIcon} aria-hidden>
            <CreditCard className="size-6" color="#1877f2" strokeWidth={2.25} />
          </span>
          <div>
            <h3 id="sa-plan-form-title" className={styles.userControlTitle}>
              {mode === "create" ? "Add plan" : "Manage plan"}
            </h3>
            <p className={styles.userControlSub}>
              {mode === "create"
                ? "Create a business plan. Monthly and yearly prices sync to Stripe with the platform key from the server env."
                : "Update pricing and plan details. Price changes sync to Stripe with the platform key from the server env."}
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

        <div className={styles.userControlAddBody}>
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
                <span>Active</span>
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
                <span>Highlighted</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.userControlActions}>
          <p className={styles.userControlAddFooterNote}>
            Required: plan name and slug. Priced plans create Stripe prices
            automatically.
          </p>
          <div className={styles.userControlAddFooterBtns}>
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState<"create" | "edit" | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(EMPTY_DRAFT);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onOverlayOpen = () => setFilterOpen(false);
    window.addEventListener("dealio:sa-overlay-open", onOverlayOpen);
    return () => {
      window.removeEventListener("dealio:sa-overlay-open", onOverlayOpen);
    };
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(`.${styles.usersDirFilterMenu}`)) return;
      if (target?.closest?.(`.${styles.usersDirFilterBtn}`)) return;
      setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterOpen]);

  const plansQuery = useQuery({
    queryKey: adminQueryKeys.subscriptionPlans(),
    queryFn: getAdminSubscriptionPlans,
    enabled: hasAuthSession(),
    staleTime: 20_000,
  });

  const items = plansQuery.data?.items ?? [];
  const counts = plansQuery.data?.counts ?? { all: 0, active: 0, inactive: 0 };

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
      if (!input) {
        throw new Error("Enter a valid plan name, slug, and prices.");
      }
      if (formOpen === "edit" && editingPlanId) {
        return updateAdminSubscriptionPlan(editingPlanId, input);
      }
      return createAdminSubscriptionPlan(input);
    },
    onSuccess: async () => {
      toast.success(formOpen === "edit" ? "Plan updated." : "Plan created.");
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

  const openCreate = () => {
    setEditingPlanId(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen("create");
  };

  const openEdit = (plan: AdminSubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setDraft(draftFromPlan(plan));
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
      className={`${styles.page} ${styles.usersDir} ${styles.usersDirBlackActions}`}
      aria-label="Plans"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Plans</h1>
            <p className={styles.subtitle}>
              Business subscription plans. Create new plans or update pricing
              and copy.
            </p>
          </div>
          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plans by name or slug..."
                className={styles.usersDirSearchInput}
                aria-label="Search plans"
              />
            </label>
            <div className="relative">
              <button
                type="button"
                className={styles.usersDirFilterBtn}
                aria-expanded={filterOpen}
                aria-haspopup="menu"
                onClick={() => setFilterOpen((open) => !open)}
              >
                <Filter className="size-4" strokeWidth={2.25} aria-hidden />
                Filter
                {tab !== "all" ? (
                  <span className="ml-1 text-[0.72rem] font-semibold text-slate-500">
                    · {TAB_OPTIONS.find((option) => option.id === tab)?.label}
                  </span>
                ) : null}
              </button>
              {filterOpen ? (
                <div className={styles.usersDirFilterMenu} role="menu">
                  {TAB_OPTIONS.map((option) => {
                    const selected = tab === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        className={`${styles.usersDirFilterMenuItem} ${
                          selected ? styles.usersDirFilterMenuItemSelected : ""
                        }`}
                        onClick={() => {
                          setTab(option.id);
                          setPage(1);
                          setFilterOpen(false);
                        }}
                      >
                        <span>
                          {option.label}{" "}
                          <span className={styles.usersDirFilterMenuCount}>
                            ({tabCounts[option.id]})
                          </span>
                        </span>
                        {selected ? (
                          <span className={styles.usersDirFilterMenuApplied}>
                            Applied
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.usersDirAddBtn}
              onClick={openCreate}
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Add Plan
            </button>
          </div>
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

        <div className={styles.usersDirToolbar}>
          <p className={styles.usersDirFooterMeta}>
            Showing{" "}
            {TAB_OPTIONS.find((option) => option.id === tab)?.label ?? "All"}{" "}
            plans
          </p>
        </div>

        <div className={styles.usersDirTableCard}>
          <div className={styles.usersDirTableWrap}>
            {loading && items.length === 0 ? (
              <div className={styles.loadingBox}>
                <Loader2
                  className="size-6 animate-spin"
                  style={{ color: "#1877f2" }}
                />
              </div>
            ) : pageItems.length === 0 ? (
              <p className={styles.empty}>No plans found.</p>
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
                            <span className={styles.userAvatar} aria-hidden>
                              {initialsFromName(plan.name || plan.slug || "?")}
                            </span>
                            <div className={styles.userCellText}>
                              <div className={styles.bizName}>
                                {plan.name || "—"}
                              </div>
                              <div className={styles.bizMeta}>{plan.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {formatMoney(plan.monthlyPrice)}
                          </span>
                        </td>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {formatMoney(plan.yearlyPrice)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.usersDirStatusPill} ${
                              plan.isActive
                                ? ""
                                : styles.usersDirStatusPillInactive
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
                          <button
                            type="button"
                            className={styles.userMenuBtn}
                            aria-label={`Edit ${plan.name || plan.slug}`}
                            disabled={saveMutation.isPending}
                            onClick={() => openEdit(plan)}
                          >
                            <Pencil
                              className="size-4"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </button>
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
          onClose={() => {
            if (saveMutation.isPending) return;
            setFormOpen(null);
            setEditingPlanId(null);
          }}
          onChange={(patch) =>
            setDraft((current) => ({ ...current, ...patch }))
          }
          onSave={() => saveMutation.mutate()}
        />
      ) : null}
    </section>
  );
}
