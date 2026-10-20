"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { BusinessOptionSelect } from "@/app/components/business/BusinessOptionSelect";
import { AsyncErrorRetry } from "@/app/components/shared/AsyncErrorRetry";
import {
  formatAbsoluteDate,
  initialsFromName,
} from "@/app/components/super-admin/super-admin-list-helpers";
import styles from "@/app/components/SuperAdminDashboard.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import {
  BUSINESS_CURRENCY_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
} from "@/app/lib/business-type-currency";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import { createAdminBusiness } from "@/app/services/admin/create-admin-business";
import { getAdminBusinesses } from "@/app/services/admin/get-admin-businesses";
import type { PlatformAdminBusiness } from "@/app/services/admin/get-platform-overview";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Filter,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Share2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BusinessTab = "all" | "onboarded" | "not_onboarded";

type CreateBusinessDraft = {
  name: string;
  ownerEmail: string;
  phoneNumber: string;
  businessType: string;
  currency: string;
  email: string;
  description: string;
  websiteUrl: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

const PAGE_SIZE = 10;

const TAB_OPTIONS: Array<{ id: BusinessTab; label: string }> = [
  { id: "all", label: "All Businesses" },
  { id: "onboarded", label: "Completed" },
  { id: "not_onboarded", label: "In Progress" },
];

function BusinessLogo({
  business,
  size = "sm",
}: {
  business: PlatformAdminBusiness;
  size?: "sm" | "lg";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUrl = business.logoUrl?.trim()
    ? resolveUploadImageUrl(business.logoUrl.trim())
    : null;
  const initials = initialsFromName(business.name || "?");
  const className = size === "lg" ? styles.userAvatarLg : styles.userAvatar;

  if (logoUrl && !imageFailed) {
    return (
      <span className={className} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote business logos */}
        <img
          src={logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden>
      {initials}
    </span>
  );
}

function BusinessDetailsModal({
  business,
  onClose,
}: {
  business: PlatformAdminBusiness;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const location =
    [business.city, business.state, business.country]
      .filter(Boolean)
      .join(", ") || "Not set";

  const statusLabel = business.setupComplete ? "Completed" : "In Progress";

  const detailRows: Array<{
    label: string;
    value: string;
    icon: typeof Mail;
    tone: "blue" | "green" | "purple";
  }> = [
    {
      label: "Email",
      value: business.email?.trim() || "Not set",
      icon: Mail,
      tone: "blue",
    },
    {
      label: "Phone",
      value: business.phoneNumber?.trim() || "Not set",
      icon: Phone,
      tone: "blue",
    },
    {
      label: "Location",
      value: location,
      icon: MapPin,
      tone: "green",
    },
    {
      label: "Created on",
      value: formatAbsoluteDate(business.createdAt),
      icon: CalendarDays,
      tone: "purple",
    },
  ];

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`${styles.usersDirDetailSheet} ${styles.usersDirDetailSheetFlat}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-business-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.usersDirDetailClose}
          onClick={onClose}
          aria-label="Close business details"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <div className={styles.usersDirDetailBody}>
          <div className={styles.usersDirDetailIdentity}>
            <div className={styles.usersDirDetailAvatarRing}>
              <BusinessLogo business={business} size="lg" />
            </div>
            <div className={styles.usersDirDetailIdentityText}>
              <p className={styles.usersDirDetailEyebrow}>Business profile</p>
              <h3
                id="sa-business-details-title"
                className={styles.usersDirDetailName}
              >
                {business.name || "Business details"}
              </h3>
              <p className={styles.usersDirDetailEmail}>
                {business.slug || "—"}
              </p>
              <div className={styles.usersDirDetailChips}>
                <span
                  className={`${styles.usersDirDetailChip} ${
                    business.setupComplete
                      ? styles.usersDirDetailChipActive
                      : styles.usersDirDetailChipMuted
                  }`}
                >
                  <span className={styles.usersDirStatusDot} aria-hidden />
                  {statusLabel}
                </span>
                <span className={styles.usersDirDetailChipRole}>
                  <User className="size-3" strokeWidth={2.5} aria-hidden />
                  {business.ownerName?.trim() ||
                    business.ownerEmail?.trim() ||
                    "No owner"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>
              Contact & location
            </h4>
            <div className={styles.usersDirDetailInfoGrid}>
              {detailRows.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className={styles.usersDirDetailInfoRow}>
                  <span
                    className={`${styles.usersDirDetailInfoIcon} ${
                      tone === "green"
                        ? styles.usersDirDetailToneGreen
                        : tone === "purple"
                          ? styles.usersDirDetailTonePurple
                          : styles.usersDirDetailToneBlue
                    }`}
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <div className={styles.usersDirDetailInfoCopy}>
                    <span className={styles.usersDirDetailInfoLabel}>
                      {label}
                    </span>
                    <span className={styles.usersDirDetailInfoValue}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>Integrations</h4>
            <div className={styles.usersDirDetailInfoGrid}>
              {(
                [
                  {
                    label: "Stripe",
                    value: business.stripeConnected
                      ? "Connected"
                      : "Not connected",
                    icon: CreditCard,
                  },
                  {
                    label: "Meta Ads",
                    value: business.metaConnected
                      ? "Connected"
                      : "Not connected",
                    icon: Share2,
                  },
                  {
                    label: "Google Ads",
                    value: business.googleAdsConnected
                      ? "Connected"
                      : "Not connected",
                    icon: Share2,
                  },
                  {
                    label: "Twilio",
                    value: business.twilioConnected
                      ? "Connected"
                      : "Not connected",
                    icon: Phone,
                  },
                ] as const
              ).map(({ label, value, icon: Icon }) => (
                <div key={label} className={styles.usersDirDetailInfoRow}>
                  <span
                    className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <div className={styles.usersDirDetailInfoCopy}>
                    <span className={styles.usersDirDetailInfoLabel}>
                      {label}
                    </span>
                    <span className={styles.usersDirDetailInfoValue}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.usersDirDetailSection}>
            <h4 className={styles.usersDirDetailSectionTitle}>Owner</h4>
            <div className={styles.usersDirDetailInfoGrid}>
              <div className={styles.usersDirDetailInfoRow}>
                <span
                  className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                  aria-hidden
                >
                  <User className="size-3.5" strokeWidth={2.25} />
                </span>
                <div className={styles.usersDirDetailInfoCopy}>
                  <span className={styles.usersDirDetailInfoLabel}>Name</span>
                  <span className={styles.usersDirDetailInfoValue}>
                    {business.ownerName?.trim() || "Not set"}
                  </span>
                </div>
              </div>
              <div className={styles.usersDirDetailInfoRow}>
                <span
                  className={`${styles.usersDirDetailInfoIcon} ${styles.usersDirDetailToneBlue}`}
                  aria-hidden
                >
                  <Mail className="size-3.5" strokeWidth={2.25} />
                </span>
                <div className={styles.usersDirDetailInfoCopy}>
                  <span className={styles.usersDirDetailInfoLabel}>Email</span>
                  <span className={styles.usersDirDetailInfoValue}>
                    {business.ownerEmail?.trim() || "Not set"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.usersDirDetailFooter}>
          <button
            type="button"
            className={styles.userControlSecondary}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function AddBusinessModal({
  saving,
  onClose,
  onSave,
}: {
  saving: boolean;
  onClose: () => void;
  onSave: (draft: CreateBusinessDraft) => void;
}) {
  const [draft, setDraft] = useState<CreateBusinessDraft>({
    name: "",
    ownerEmail: "",
    phoneNumber: "",
    businessType: "",
    currency: "USD",
    email: "",
    description: "",
    websiteUrl: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const patchDraft = (patch: Partial<CreateBusinessDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        className={`${styles.userControl} ${styles.userControlWide}`}
        role="dialog"
        aria-modal="true"
        aria-label="Add business"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.userControlHead}>
          <div>
            <h3 className={styles.userControlTitle}>Add business</h3>
            <p className={styles.userControlSub}>
              Same details as normal business creation, assigned to an existing
              owner account.
            </p>
          </div>
          <button
            type="button"
            className={styles.userControlClose}
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
        </div>

        <div className={styles.userControlGrid}>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-name">
              <Building2 className="size-3.5" strokeWidth={2.25} aria-hidden />
              Business name *
            </label>
            <input
              id="sa-add-biz-name"
              value={draft.name}
              onChange={(event) => patchDraft({ name: event.target.value })}
              disabled={saving}
              placeholder="Enter your business name"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-owner">
              <User className="size-3.5" strokeWidth={2.25} aria-hidden />
              Owner email *
            </label>
            <input
              id="sa-add-biz-owner"
              type="email"
              value={draft.ownerEmail}
              onChange={(event) =>
                patchDraft({ ownerEmail: event.target.value })
              }
              disabled={saving}
              placeholder="owner@email.com"
            />
          </div>
          <div className={styles.userControlField}>
            <label>
              <Phone className="size-3.5" strokeWidth={2.25} aria-hidden />
              Contact number *
            </label>
            <BookMeetingPhoneInput
              value={draft.phoneNumber}
              onChange={(phone) => patchDraft({ phoneNumber: phone })}
            />
          </div>
          <div className={styles.userControlField}>
            <label>
              <Building2 className="size-3.5" strokeWidth={2.25} aria-hidden />
              Business type *
            </label>
            <BusinessOptionSelect
              value={draft.businessType}
              options={[...BUSINESS_TYPE_OPTIONS]}
              placeholder="Select business type"
              ariaLabel="Business type"
              menuZIndex={200}
              disabled={saving}
              onChange={(nextValue) =>
                patchDraft({ businessType: nextValue })
              }
            />
          </div>
          <div className={styles.userControlField}>
            <label>
              Currency *
            </label>
            <BusinessOptionSelect
              value={draft.currency}
              options={[...BUSINESS_CURRENCY_OPTIONS]}
              placeholder="Select currency"
              ariaLabel="Currency"
              menuZIndex={200}
              disabled={saving}
              onChange={(nextValue) =>
                patchDraft({ currency: nextValue.toUpperCase() })
              }
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-email">
              <Mail className="size-3.5" strokeWidth={2.25} aria-hidden />
              Business email
            </label>
            <input
              id="sa-add-biz-email"
              type="email"
              value={draft.email}
              onChange={(event) => patchDraft({ email: event.target.value })}
              disabled={saving}
              placeholder="you@business.com"
            />
          </div>
          <div
            className={styles.userControlField}
            style={{ gridColumn: "1 / -1" }}
          >
            <label htmlFor="sa-add-biz-description">Description</label>
            <textarea
              id="sa-add-biz-description"
              value={draft.description}
              onChange={(event) =>
                patchDraft({ description: event.target.value })
              }
              disabled={saving}
              rows={3}
              maxLength={500}
              placeholder="Tell customers what you do"
              style={{
                width: "100%",
                border: "1px solid var(--sa-line, #e5eaf5)",
                borderRadius: "0.7rem",
                padding: "0.55rem 0.7rem",
                fontSize: "0.88rem",
                fontWeight: 400,
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-website">
              <Globe className="size-3.5" strokeWidth={2.25} aria-hidden />
              Website
            </label>
            <input
              id="sa-add-biz-website"
              value={draft.websiteUrl}
              onChange={(event) =>
                patchDraft({ websiteUrl: event.target.value })
              }
              disabled={saving}
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-city">
              <MapPin className="size-3.5" strokeWidth={2.25} aria-hidden />
              City
            </label>
            <input
              id="sa-add-biz-city"
              value={draft.city}
              onChange={(event) => patchDraft({ city: event.target.value })}
              disabled={saving}
              placeholder="City"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-state">State</label>
            <input
              id="sa-add-biz-state"
              value={draft.state}
              onChange={(event) => patchDraft({ state: event.target.value })}
              disabled={saving}
              placeholder="State / province"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-country">Country</label>
            <input
              id="sa-add-biz-country"
              value={draft.country}
              onChange={(event) => patchDraft({ country: event.target.value })}
              disabled={saving}
              placeholder="Country"
            />
          </div>
          <div className={styles.userControlField}>
            <label htmlFor="sa-add-biz-postal">Postal code</label>
            <input
              id="sa-add-biz-postal"
              value={draft.postalCode}
              onChange={(event) =>
                patchDraft({ postalCode: event.target.value })
              }
              disabled={saving}
              placeholder="Postal code"
            />
          </div>
        </div>

        <div className={styles.userControlActions}>
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
            onClick={() => onSave(draft)}
          >
            {saving ? "Creating…" : "Create business"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function SuperAdminBusinessesPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<BusinessTab>("all");
  const [filterHintOpen, setFilterHintOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailsBusinessId, setDetailsBusinessId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const businessesQuery = useQuery({
    queryKey: adminQueryKeys.businesses(
      page,
      debouncedSearch,
      PAGE_SIZE,
      tab,
    ),
    queryFn: () =>
      getAdminBusinesses({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        onboarding: tab,
      }),
    enabled: hasAuthSession(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createAdminBusiness,
    onSuccess: async () => {
      toast.success("Business created.");
      setAddOpen(false);
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.businessesRoot(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create business."));
    },
  });

  const items = businessesQuery.data?.items ?? [];
  const meta = businessesQuery.data?.meta;
  const counts = businessesQuery.data?.counts;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const loading = businessesQuery.isLoading || businessesQuery.isFetching;
  const errorMessage = businessesQuery.error
    ? getApiErrorMessage(businessesQuery.error, "Could not load businesses.")
    : null;

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1));
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  const showingStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(page * PAGE_SIZE, total);
  const detailsBusiness =
    items.find((business) => business.id === detailsBusinessId) ?? null;

  const stats = [
    {
      label: "Total Businesses",
      value: counts?.all ?? 0,
      hint: "All registered businesses",
      hintMuted: true,
      icon: Building2,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Completed",
      value: counts?.onboarded ?? 0,
      hint: "Setup completed",
      hintMuted: false,
      icon: CheckCircle2,
      iconBg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "In Progress",
      value: counts?.notOnboarded ?? 0,
      hint: "Still finishing setup",
      hintMuted: true,
      icon: XCircle,
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
    {
      label: "Showing now",
      value: total,
      hint: debouncedSearch ? "Filtered results" : "Current tab results",
      hintMuted: true,
      icon: Search,
      iconBg: "#f5f3ff",
      iconColor: "#7c3aed",
    },
  ];

  const tabCounts: Record<BusinessTab, number> = {
    all: counts?.all ?? 0,
    onboarded: counts?.onboarded ?? 0,
    not_onboarded: counts?.notOnboarded ?? 0,
  };

  return (
    <section
      className={`${styles.page} ${styles.usersDir}`}
      aria-label="Businesses"
    >
      <div className={styles.inner}>
        <div className={styles.usersDirHero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Businesses</h1>
            <p className={styles.subtitle}>
              Customer businesses registered on Dealioo. Search, filter, or add a
              new one.
            </p>
          </div>

          <div className={styles.usersDirHeroActions}>
            <label className={styles.usersDirSearch}>
              <Search className={styles.usersDirSearchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search businesses by name, slug or owner..."
                className={styles.usersDirSearchInput}
                aria-label="Search businesses"
              />
            </label>
            <div className="relative">
              <button
                type="button"
                className={styles.usersDirFilterBtn}
                aria-expanded={filterHintOpen}
                onClick={() => setFilterHintOpen((open) => !open)}
              >
                <Filter className="size-4" strokeWidth={2.25} aria-hidden />
                Filter
              </button>
              {filterHintOpen ? (
                <div className={styles.userMenuDropdown} role="menu">
                  <p className="m-0 px-2.5 py-2 text-[0.75rem] font-medium leading-snug text-slate-500">
                    Use the tabs below to filter by Completed or In Progress.
                    Search also matches business name, slug, and owner.
                  </p>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.usersDirAddBtn}
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Add Business
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <AsyncErrorRetry
              layout="inline"
              title="Something went wrong"
              message={errorMessage}
              onRetry={() => void businessesQuery.refetch()}
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
          <div
            className={styles.usersDirTabs}
            role="tablist"
            aria-label="Business filters"
          >
            {TAB_OPTIONS.map((option) => {
              const count = tabCounts[option.id];
              const active = tab === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.usersDirTab} ${
                    active ? styles.usersDirTabActive : ""
                  }`}
                  onClick={() => {
                    setTab(option.id);
                    setPage(1);
                  }}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>
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
            ) : items.length === 0 ? (
              <p className={styles.empty}>No businesses found.</p>
            ) : (
              <table className={styles.usersDirTable}>
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>#</th>
                    <th>Business</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((business, index) => {
                    const location =
                      [business.city, business.state, business.country]
                        .filter(Boolean)
                        .join(", ") || "—";
                    const rowNumber = showingStart + index;
                    return (
                      <tr
                        key={business.id}
                        className={styles.usersDirRowClickable}
                        onClick={() => setDetailsBusinessId(business.id)}
                      >
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {rowNumber}.
                          </span>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <BusinessLogo business={business} />
                            <div className={styles.userCellText}>
                              <div className={styles.bizName}>
                                {business.name || "—"}
                              </div>
                              <div className={styles.bizMeta}>
                                {business.slug || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.usersDirStatusPill} ${
                              business.setupComplete
                                ? ""
                                : styles.usersDirStatusPillInactive
                            }`}
                          >
                            <span
                              className={styles.usersDirStatusDot}
                              aria-hidden
                            />
                            {business.setupComplete
                              ? "Completed"
                              : "In Progress"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {location}
                          </span>
                        </td>
                        <td>
                          <span className={styles.usersDirDateMain}>
                            {formatAbsoluteDate(business.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.usersDirFooter}>
            <p className={styles.usersDirFooterMeta}>
              Showing {showingStart}-{showingEnd} of {total} businesses
            </p>
            <div className={styles.usersDirPager}>
              <button
                type="button"
                className={styles.usersDirPageBtn}
                disabled={loading || page <= 1}
                aria-label="Previous page"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`${styles.usersDirPageBtn} ${
                    pageNumber === page ? styles.usersDirPageBtnActive : ""
                  }`}
                  disabled={loading}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className={styles.usersDirPageBtn}
                disabled={loading || page >= totalPages}
                aria-label="Next page"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      {detailsBusiness ? (
        <BusinessDetailsModal
          business={detailsBusiness}
          onClose={() => setDetailsBusinessId(null)}
        />
      ) : null}

      {addOpen ? (
        <AddBusinessModal
          saving={createMutation.isPending}
          onClose={() => setAddOpen(false)}
          onSave={(draft) => {
            if (!draft.name.trim()) {
              toast.error("Please enter the business name.");
              return;
            }
            if (!draft.ownerEmail.trim()) {
              toast.error("Owner email is required.");
              return;
            }
            if (
              !draft.phoneNumber.trim() ||
              !isValidPhoneNumber(draft.phoneNumber)
            ) {
              toast.error("Please enter a valid contact number.");
              return;
            }
            if (!draft.businessType.trim()) {
              toast.error("Please select a business type.");
              return;
            }
            if (!draft.currency.trim()) {
              toast.error("Please select a currency.");
              return;
            }
            if (
              draft.websiteUrl.trim() &&
              !isValidOptionalHttpsWebsiteUrl(draft.websiteUrl.trim())
            ) {
              toast.error("Website must be a valid https URL.");
              return;
            }
            createMutation.mutate({
              name: draft.name.trim(),
              ownerEmail: draft.ownerEmail.trim(),
              phoneNumber: draft.phoneNumber.trim(),
              businessType: draft.businessType.trim(),
              currency: draft.currency.trim().toUpperCase(),
              email: draft.email.trim() || undefined,
              description: draft.description.trim() || undefined,
              websiteUrl: draft.websiteUrl.trim() || undefined,
              city: draft.city.trim() || undefined,
              state: draft.state.trim() || undefined,
              country: draft.country.trim() || undefined,
              postalCode: draft.postalCode.trim() || undefined,
            });
          }}
        />
      ) : null}
    </section>
  );
}
