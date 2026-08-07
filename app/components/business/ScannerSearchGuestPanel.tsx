"use client";

import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gift,
  History,
  Loader2,
  Mail,
  Megaphone,
  Phone,
  ScanLine,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GuestNotInDatabasePanel } from "@/app/components/business/GuestNotInDatabasePanel";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { ScanCompleteOrderDialog } from "@/app/components/business/ScanCompleteOrderDialog";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { formatDollars } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  TABLE_HEAD_ICON_CLASS,
  TABLE_HEAD_LABEL_CLASS,
} from "@/app/lib/dashboard-brand-tones";
import {
  GUEST_SEARCH_PAGE_SIZE,
  searchCustomers,
  type CustomerSearchResult,
} from "@/app/services/customer/search-customers";
import { deleteCustomer } from "@/app/services/customer/delete-customer";
import {
  fetchFunnelsByRestaurant,
  type RestaurantFunnelDeal,
} from "@/app/services/funnel/get-funnels-by-business";
import {
  purchaseScannerDeals,
  type ScannerPurchasedDeal,
} from "@/app/services/funnel/purchase-scanner-deals";
import {
  getGuestProfile,
  getGuestPreviousRedemptions,
  GUEST_PREVIOUS_REDEMPTIONS_PAGE_SIZE,
  scanRedemptionQr,
  type GuestActiveDeal,
  type GuestPreviousRedemption,
  type GuestProfile,
  type RedeemableReward,
  type ScanRedemptionSuccess,
} from "@/app/services/redemption/scan-redemption";

const thClass =
  "whitespace-nowrap px-4 py-3 text-left align-middle first:pl-5 last:pr-5";
const tdClass =
  "px-4 py-3 text-left align-middle text-sm text-slate-800 first:pl-5 last:pr-5";

const SEARCH_STEPS = [
  {
    icon: Search,
    title: "Search guest",
    description: "Look up by name, email, or phone number.",
    iconWrap: "bg-[#e8f1ff] text-[#1877f2] ring-[#dbeafe]",
    stepWrap: "bg-[#1877f2] text-white",
  },
  {
    icon: UserRound,
    title: "Open profile",
    description: "Review contact details and active deals.",
    iconWrap: "bg-[#ecfdf5] text-[#059669] ring-[#a7f3d0]",
    stepWrap: "bg-[#10b981] text-white",
  },
  {
    icon: Gift,
    title: "Redeem offer",
    description: "Apply rewards and complete the order.",
    iconWrap: "bg-[#f3e8ff] text-[#7e22ce] ring-[#e9d5ff]",
    stepWrap: "bg-[#9333ea] text-white",
  },
] as const;

function SearchHeroCard({
  query,
  searching,
  onQueryChange,
  onSearch,
}: {
  query: string;
  searching: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: standardEase }}
        className="overflow-hidden rounded-[1.5rem] border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]"
      >
        <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
              Guest lookup
            </p>
          </div>
          <p className="m-0 hidden items-center gap-1.5 text-[0.7rem] font-medium text-white/55 sm:inline-flex">
            Counter search mode
            <ScanLine className="size-3.5 text-white/45" aria-hidden />
          </p>
        </div>

        <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-8 sm:px-7 sm:py-7">
          <div className="min-w-0">
            <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#059669] ring-1 ring-[#a7f3d0]">
              <ShieldCheck className="size-3.5" strokeWidth={2.25} aria-hidden />
              Ready to search
            </p>
            <h3 className="m-0 mt-3.5 text-[1.55rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.75rem]">
              Find a guest quickly
            </h3>
            <p className="m-0 mt-2 max-w-lg text-[0.88rem] font-medium leading-relaxed text-slate-500">
              Search your guest list by name, email, or phone number to view
              their profile and redeem active deals.
            </p>

            <div className="relative mt-5 min-w-0">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSearch();
                  }
                }}
                placeholder="Name, email, or phone..."
                className="w-full rounded-full border border-[#e2e8f0] bg-white py-3 pr-28 pl-11 text-[0.88rem] font-medium text-[#0e182b] shadow-[0_6px_18px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
              />
              <button
                type="button"
                disabled={!query.trim() || searching}
                onClick={onSearch}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-full bg-[#1877f2] px-4 py-2 text-[0.8rem] font-bold text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  "Search"
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-slate-500">
                <ShieldCheck className="size-3.5 text-slate-400" aria-hidden />
                Secure search · Your data is protected
              </p>
              <p className="m-0 text-[0.72rem] font-medium text-slate-400">
                Type at least 2 characters
              </p>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-[15rem] lg:block" aria-hidden>
            <div className="relative rounded-[1.35rem] border border-[#e8edf5] bg-[#f8fbff] p-5 shadow-[0_16px_36px_rgba(24,119,242,0.1)]">
              <div className="flex items-center gap-3 border-b border-[#eef2f7] pb-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.3)]">
                  <UserRound className="size-6" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <span className="block h-2.5 w-24 rounded-full bg-[#dbeafe]" />
                  <span className="block h-2 w-16 rounded-full bg-[#e2e8f0]" />
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <span className="block h-2 w-full rounded-full bg-[#eef2f7]" />
                <span className="block h-2 w-[85%] rounded-full bg-[#eef2f7]" />
                <span className="block h-2 w-[60%] rounded-full bg-[#eef2f7]" />
              </div>
              <span className="mt-4 inline-flex rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-[#059669] ring-1 ring-[#a7f3d0]">
                Active deals
              </span>
            </div>
            <span className="absolute -bottom-3 -right-2 flex size-16 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_12px_28px_rgba(24,119,242,0.35)] ring-4 ring-white">
              <Search className="size-7" strokeWidth={2.25} />
            </span>
          </div>
        </div>
      </motion.div>

      <div className="relative grid gap-3 sm:grid-cols-3 sm:gap-4">
        <span
          className="pointer-events-none absolute left-[16%] right-[16%] top-[1.65rem] hidden border-t border-dashed border-[#dbeafe] sm:block"
          aria-hidden
        />
        {SEARCH_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.08 + index * 0.06,
                ease: standardEase,
              }}
              className="relative rounded-[1.15rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)]"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ring-1 ${step.iconWrap}`}
                >
                  <Icon className="size-4" strokeWidth={2.15} aria-hidden />
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-[0.68rem] font-extrabold ${step.stepWrap}`}
                >
                  {index + 1}
                </span>
              </div>
              <p className="m-0 text-[0.88rem] font-extrabold text-[#0e182b]">
                {step.title}
              </p>
              <p className="m-0 mt-1 text-[0.74rem] leading-snug text-slate-500">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const GUEST_AVATAR_TONES = [
  "bg-[#1877f2] text-white",
  "bg-[#7c3aed] text-white",
  "bg-[#0d9488] text-white",
  "bg-[#db2777] text-white",
  "bg-[#d97706] text-white",
] as const;

function guestAvatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return GUEST_AVATAR_TONES[hash % GUEST_AVATAR_TONES.length];
}

function formatDealPrice(price: number | string | null): string | null {
  if (price == null || price === "") return null;
  const numeric = typeof price === "number" ? price : Number.parseFloat(price);
  if (!Number.isFinite(numeric)) return null;
  return formatDollars(numeric);
}

function DealPaymentBadge({
  label,
  badge,
}: {
  label: "PREPAID" | "UNPAID";
  badge?: "PAID_ONLINE" | "PAID_AT_COUNTER" | "PENDING";
}) {
  const display =
    badge === "PAID_ONLINE"
      ? "Paid Online"
      : badge === "PAID_AT_COUNTER"
        ? "Paid at Counter"
        : badge === "PENDING"
          ? "Not paid"
          : label === "PREPAID"
            ? "Paid"
            : "Not paid";
  const isPaid =
    badge === "PAID_ONLINE" ||
    badge === "PAID_AT_COUNTER" ||
    label === "PREPAID";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.04em] ${
        isPaid
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-[#eef1f5] text-[#4b5563] ring-1 ring-[#e5e7eb]"
      }`}
    >
      {display}
    </span>
  );
}

function BusinessDealCheckboxRow({
  deal,
  checked,
  disabled,
  alreadyOnGuest,
  onToggle,
}: {
  deal: RestaurantFunnelDeal;
  checked: boolean;
  disabled: boolean;
  alreadyOnGuest?: boolean;
  onToggle: () => void;
}) {
  const priceLabel = formatDealPrice(deal.price);
  const imageSrc = resolveUploadImageUrl(deal.imageUrl);

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition duration-150 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${
          checked
            ? "border-[#1877f2]/45 bg-[#f7faff] ring-1 ring-[#1877f2]/15"
            : "border-[#e8edf5] bg-white hover:border-[#dbe3ef] hover:bg-[#fafbfc]"
        }`}
      >
        <span
          className={`flex size-[1.15rem] shrink-0 items-center justify-center rounded-full border-2 transition ${
            checked
              ? "border-[#1877f2] bg-[#1877f2]"
              : "border-[#cbd5e1] bg-white"
          }`}
          aria-hidden
        >
          {checked ? (
            <span className="size-1.5 rounded-full bg-white" />
          ) : null}
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eef5ff] text-[#1877f2] ring-1 ring-[#dbeafe]">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Megaphone className="size-4" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.92rem] font-bold tracking-tight text-[#0f172a]">
            {deal.campaignName}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {alreadyOnGuest ? (
              <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.04em] text-[#1877f2] ring-1 ring-[#dbeafe]">
                On guest
              </span>
            ) : null}
            {priceLabel ? (
              <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.04em] text-emerald-700 ring-1 ring-emerald-100">
                {priceLabel}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

type NormalizedGuestActiveDeal = GuestActiveDeal & {
  canSelect: boolean;
  qrToken: string;
};

function normalizeDeal(deal: GuestActiveDeal): NormalizedGuestActiveDeal {
  return {
    ...deal,
    canSelect:
      deal.canSelect ??
      (deal.paymentLabel === "PREPAID" || deal.paymentStatus === "PENDING"),
    qrToken: deal.qrToken ?? "",
  };
}

function toRedeemableReward(deal: NormalizedGuestActiveDeal): RedeemableReward {
  return {
    couponId: deal.couponId,
    label: `${deal.offerName} [${deal.paymentLabel}]`,
    paymentLabel: deal.paymentLabel,
    campaignPrice: deal.campaignPrice ?? null,
    isScannedCoupon: false,
    canSelect: deal.canSelect,
  };
}

function sumCampaignPrices(
  deals: Array<{ campaignPrice?: number | null }>,
): number | null {
  if (deals.length === 0) return null;
  let total = 0;
  for (const deal of deals) {
    const price = deal.campaignPrice;
    if (price == null || !Number.isFinite(price) || price < 0) {
      return null;
    }
    total += price;
  }
  return Math.round(total * 100) / 100;
}

function DealSelectRow({
  deal,
  checked,
  disabled,
  onToggle,
  onRedeem,
}: {
  deal: NormalizedGuestActiveDeal;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  onRedeem: () => void;
}) {
  const imageSrc = resolveUploadImageUrl(deal.imageUrl);

  return (
    <li>
      <div
        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 transition duration-150 ${
          checked
            ? "border-[#1877f2]/45 bg-[#f7faff] ring-1 ring-[#1877f2]/15"
            : "border-[#e8edf5] bg-white"
        }`}
      >
        <button
          type="button"
          disabled={disabled || !deal.canSelect}
          onClick={onToggle}
          className={`flex size-[1.15rem] shrink-0 items-center justify-center rounded-full border-2 transition ${
            deal.canSelect
              ? "cursor-pointer"
              : "cursor-not-allowed opacity-50"
          } ${
            checked
              ? "border-[#1877f2] bg-[#1877f2]"
              : "border-[#cbd5e1] bg-white"
          }`}
          aria-label={`Select ${deal.campaignName}`}
        >
          {checked ? (
            <span className="size-1.5 rounded-full bg-white" aria-hidden />
          ) : null}
        </button>
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f1f5f9] text-[#64748b] ring-1 ring-[#e2e8f0]">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <FileText className="size-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[0.92rem] font-bold tracking-tight text-[#0f172a]">
            {deal.campaignName}
          </p>
          <div className="mt-1.5">
            <DealPaymentBadge
              label={deal.paymentLabel}
              badge={deal.paymentBadge}
            />
          </div>
          {deal.expiresAt ? (
            <p className="m-0 mt-1.5 text-[0.72rem] font-medium text-slate-400">
              Expires {formatDateTimeShort(deal.expiresAt)}
            </p>
          ) : null}
        </div>
        {deal.canSelect ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onRedeem}
            className="shrink-0 cursor-pointer rounded-lg border border-[#bfdbfe] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#1877f2] transition hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Redeem
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function ScannerSearchGuestPanel({
  businessId,
  onCreateGuest,
  onHideScannerTabsChange,
}: {
  businessId: number;
  onCreateGuest?: () => void;
  onHideScannerTabsChange?: (hide: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guestNotInDatabaseQuery, setGuestNotInDatabaseQuery] = useState<
    string | null
  >(null);
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<GuestProfile | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [previousRedemptions, setPreviousRedemptions] = useState<
    GuestPreviousRedemption[]
  >([]);
  const [previousRedemptionsMeta, setPreviousRedemptionsMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [previousRedemptionsPage, setPreviousRedemptionsPage] = useState(1);
  const [loadingPreviousRedemptions, setLoadingPreviousRedemptions] =
    useState(false);
  const [selectedDealIds, setSelectedDealIds] = useState<number[]>([]);
  const [redeemStep, setRedeemStep] = useState<
    null | "completeOrder" | "enterSubtotal" | "enterExtra"
  >(null);
  const [confirmingRedemption, setConfirmingRedemption] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<ScanRedemptionSuccess | null>(
    null,
  );
  const [pendingRedeemAmount, setPendingRedeemAmount] = useState<number | null>(
    null,
  );
  const [businessDeals, setBusinessDeals] = useState<RestaurantFunnelDeal[]>([]);
  const [loadingBusinessDeals, setLoadingBusinessDeals] = useState(false);
  const [selectedFunnelIds, setSelectedFunnelIds] = useState<number[]>([]);
  const [guestDealTab, setGuestDealTab] = useState<"all" | "paid" | "unpaid">(
    "all",
  );
  const [purchaseStep, setPurchaseStep] = useState<
    null | "confirm" | "enterPrice" | "enterExtra"
  >(null);
  const [pendingDealAmount, setPendingDealAmount] = useState<number | null>(
    null,
  );
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<
    ScannerPurchasedDeal[] | null
  >(null);
  const idempotencyKeyRef = useRef("");
  const purchaseIdempotencyKeyRef = useRef("");

  const runSearch = useCallback(
    async (searchQuery: string, searchPage: number) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setSearching(true);
      setErrorMessage(null);
      setGuestNotInDatabaseQuery(null);
      setSelectedProfile(null);
      try {
        const response = await searchCustomers(
          trimmed,
          searchPage,
          GUEST_SEARCH_PAGE_SIZE,
        );
        setResults(response.data);
        setMeta(response.meta);
        setActiveQuery(trimmed);
        setPage(response.meta.page);

        if (response.meta.total === 0) {
          setErrorMessage(null);
        }
      } catch (err) {
        setResults([]);
        setMeta(null);
        setErrorMessage(
          err instanceof Error ? err.message : "Search failed. Try again.",
        );
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  const handleSearch = useCallback(() => {
    void runSearch(query, 1);
  }, [query, runSearch]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!activeQuery) return;
      void runSearch(activeQuery, nextPage);
    },
    [activeQuery, runSearch],
  );

  const handleSelectGuest = useCallback(
    async (guest: CustomerSearchResult) => {
      setLoadingProfile(true);
      setErrorMessage(null);
      setGuestNotInDatabaseQuery(null);
      setSelectedDealIds([]);
      setRedeemStep(null);
      setRedeemSuccess(null);
      setSelectedFunnelIds([]);
      setGuestDealTab("all");
      setPurchaseStep(null);
      setPendingDealAmount(null);
      setPurchaseSuccess(null);
      setBusinessDeals([]);
      setPreviousRedemptions([]);
      setPreviousRedemptionsMeta(null);
      setPreviousRedemptionsPage(1);
      idempotencyKeyRef.current = "";

      try {
        const profile = await getGuestProfile(businessId, guest.id);
        if (!profile) {
          setSelectedProfile(null);
          setGuestNotInDatabaseQuery(
            guest.name?.trim() || guest.email?.trim() || activeQuery,
          );
          return;
        }
        setSelectedProfile(profile);
      } catch (err) {
        setSelectedProfile(null);
        setErrorMessage(
          err instanceof Error ? err.message : "Could not load guest profile.",
        );
      } finally {
        setLoadingProfile(false);
      }
    },
    [businessId, activeQuery],
  );

  useEffect(() => {
    if (!selectedProfile) {
      setPreviousRedemptions([]);
      setPreviousRedemptionsMeta(null);
      return;
    }

    let cancelled = false;
    const loadPreviousRedemptions = async () => {
      setLoadingPreviousRedemptions(true);
      try {
        const result = await getGuestPreviousRedemptions(
          businessId,
          selectedProfile.customerId,
          previousRedemptionsPage,
          GUEST_PREVIOUS_REDEMPTIONS_PAGE_SIZE,
        );
        if (!cancelled) {
          setPreviousRedemptions(result.data);
          setPreviousRedemptionsMeta(result.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviousRedemptions([]);
          setPreviousRedemptionsMeta(null);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Could not load previously redeemed rewards.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPreviousRedemptions(false);
        }
      }
    };

    void loadPreviousRedemptions();
    return () => {
      cancelled = true;
    };
  }, [businessId, selectedProfile, previousRedemptionsPage]);

  useEffect(() => {
    if (!selectedProfile) return;

    let cancelled = false;
    const loadBusinessDeals = async () => {
      setLoadingBusinessDeals(true);
      try {
        const rows = await fetchFunnelsByRestaurant(businessId);
        if (!cancelled) {
          setBusinessDeals(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setBusinessDeals([]);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Could not load business deals.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBusinessDeals(false);
        }
      }
    };

    void loadBusinessDeals();
    return () => {
      cancelled = true;
    };
  }, [businessId, selectedProfile?.customerId]);

  const handleDeleteGuest = useCallback(async () => {
    if (!selectedProfile) return;

    const confirmed = window.confirm(
      `Delete ${selectedProfile.customerName}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      await deleteCustomer(selectedProfile.customerId);
      setSelectedProfile(null);
      if (activeQuery) {
        await runSearch(activeQuery, page);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not delete this guest.",
      );
    } finally {
      setDeleting(false);
    }
  }, [activeQuery, page, runSearch, selectedProfile]);

  const activeDeals = useMemo(
    () => (selectedProfile?.activeDeals ?? []).map(normalizeDeal),
    [selectedProfile],
  );
  const prepaidDeals = useMemo(
    () => activeDeals.filter((deal) => deal.paymentLabel === "PREPAID"),
    [activeDeals],
  );
  const unpaidDeals = useMemo(
    () => activeDeals.filter((deal) => deal.paymentLabel === "UNPAID"),
    [activeDeals],
  );

  const filteredGuestDeals = useMemo(() => {
    if (guestDealTab === "paid") return prepaidDeals;
    if (guestDealTab === "unpaid") return unpaidDeals;
    return activeDeals;
  }, [activeDeals, guestDealTab, prepaidDeals, unpaidDeals]);

  const startRedeemDeal = useCallback(
    (deal: NormalizedGuestActiveDeal) => {
      if (!deal.canSelect || confirmingRedemption || purchasing) return;
      setSelectedFunnelIds([]);
      setSelectedDealIds([deal.couponId]);
      setRedeemStep("completeOrder");
    },
    [confirmingRedemption, purchasing],
  );

  const toggleDealSelection = useCallback((deal: NormalizedGuestActiveDeal) => {
    if (!deal.canSelect || confirmingRedemption || purchasing) return;

    setSelectedFunnelIds([]);
    setSelectedDealIds((current) =>
      current.includes(deal.couponId) ? [] : [deal.couponId],
    );
  }, [confirmingRedemption, purchasing]);

  const selectedDeals = useMemo(
    () => activeDeals.filter((deal) => selectedDealIds.includes(deal.couponId)),
    [activeDeals, selectedDealIds],
  );

  const guestFunnelIds = useMemo(() => {
    const ids = new Set<number>();
    for (const deal of activeDeals) {
      if (deal.funnelId != null && deal.funnelId > 0) {
        ids.add(deal.funnelId);
      }
    }
    return ids;
  }, [activeDeals]);

  const selectedBusinessDeals = useMemo(
    () =>
      businessDeals.filter((deal) => selectedFunnelIds.includes(deal.id)),
    [businessDeals, selectedFunnelIds],
  );

  const expectedPurchaseAmount = useMemo(() => {
    if (selectedBusinessDeals.length === 0) return null;
    let total = 0;
    for (const deal of selectedBusinessDeals) {
      if (deal.price == null || deal.price === "") return null;
      const price =
        typeof deal.price === "number"
          ? deal.price
          : Number.parseFloat(String(deal.price));
      if (!Number.isFinite(price) || price < 0) return null;
      total += price;
    }
    return Math.round(total * 100) / 100;
  }, [selectedBusinessDeals]);

  const toggleBusinessDealSelection = useCallback(
    (funnelId: number) => {
      if (purchasing || confirmingRedemption) return;
      setSelectedDealIds([]);
      setSelectedFunnelIds((current) =>
        current.includes(funnelId)
          ? current.filter((id) => id !== funnelId)
          : [...current, funnelId],
      );
    },
    [confirmingRedemption, purchasing],
  );

  const handlePurchaseDeals = useCallback(
    async (orderSubtotal: number, extraItemsAmount = 0) => {
      if (!selectedProfile || selectedFunnelIds.length === 0) return;

      setPurchasing(true);
      setErrorMessage(null);

      try {
        if (!purchaseIdempotencyKeyRef.current) {
          purchaseIdempotencyKeyRef.current =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        }
        const purchased = await purchaseScannerDeals({
          businessId,
          customerId: selectedProfile.customerId,
          funnelIds: selectedFunnelIds,
          // Attach-deals from guest search is always an in-person counter purchase.
          purchaseMeans: "IN_PERSON",
          orderSubtotal,
          extraItemsAmount,
          idempotencyKey: purchaseIdempotencyKeyRef.current,
        });
        purchaseIdempotencyKeyRef.current = "";
        setPurchaseStep(null);
        setPendingDealAmount(null);
        setSelectedFunnelIds([]);
        setPurchaseSuccess(purchased);

        const profile = await getGuestProfile(
          businessId,
          selectedProfile.customerId,
        );
        if (profile) {
          setSelectedProfile(profile);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Could not complete purchase.",
        );
        setPurchaseStep(null);
        setPendingDealAmount(null);
      } finally {
        setPurchasing(false);
      }
    },
    [businessId, selectedFunnelIds, selectedProfile],
  );

  const handleConfirmRedeem = useCallback(
    async (
      couponIds: number[],
      orderSubtotal?: number,
      extraItemsAmount = 0,
    ) => {
      if (!selectedProfile || couponIds.length === 0) return;

      const anchorDeal = activeDeals.find(
        (deal) => couponIds.includes(deal.couponId) && deal.qrToken,
      );
      if (!anchorDeal?.qrToken) {
        setErrorMessage("Could not redeem, missing coupon token.");
        return;
      }

      setConfirmingRedemption(true);
      setErrorMessage(null);

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `redeem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      }

      try {
        const result = await scanRedemptionQr(
          businessId,
          anchorDeal.qrToken,
          couponIds,
          orderSubtotal,
          idempotencyKeyRef.current,
          "staff_lookup",
          extraItemsAmount,
        );

        if (result.success) {
          idempotencyKeyRef.current = "";
          setRedeemStep(null);
          setPendingRedeemAmount(null);
          setSelectedDealIds([]);
          setRedeemSuccess(result);

          const profile = await getGuestProfile(
            businessId,
            selectedProfile.customerId,
          );
          if (profile) {
            setSelectedProfile(profile);
          }
        } else {
          setErrorMessage(result.message);
          setRedeemStep(null);
          setPendingRedeemAmount(null);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Redemption failed. Try again.",
        );
        setRedeemStep(null);
        setPendingRedeemAmount(null);
      } finally {
        setConfirmingRedemption(false);
      }
    },
    [activeDeals, businessId, selectedProfile],
  );

  const showGuestNotFound =
    !selectedProfile &&
    !loadingProfile &&
    !searching &&
    (guestNotInDatabaseQuery != null ||
      (activeQuery.length > 0 && (meta?.total ?? 0) === 0));

  const guestNotFoundQuery =
    guestNotInDatabaseQuery ?? (showGuestNotFound ? activeQuery : undefined);

  const showTable =
    !selectedProfile &&
    !loadingProfile &&
    activeQuery.length > 0 &&
    (meta?.total ?? 0) > 0;
  const rowOffset = useMemo(
    () => ((meta?.page ?? page) - 1) * (meta?.limit ?? GUEST_SEARCH_PAGE_SIZE),
    [meta, page],
  );

  const hideScannerTabs =
    showTable || selectedProfile != null || loadingProfile;
  useEffect(() => {
    onHideScannerTabsChange?.(hideScannerTabs);
    return () => onHideScannerTabsChange?.(false);
  }, [hideScannerTabs, onHideScannerTabsChange]);

  return (
    <>
      {selectedProfile && purchaseStep === "confirm" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => setPurchaseStep(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-attach-deals-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="confirm-attach-deals-title"
              className="text-2xl font-semibold tracking-tight text-zinc-900"
            >
              Are you sure you want to proceed?
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-600">
              You are about to charge this guest for the selected deal
              {selectedBusinessDeals.length === 1 ? "" : "s"}. No payment is
              created until you continue and complete the amount steps.
            </p>
            <div className="mt-5 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-4">
              <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-500">
                Total amount to charge
              </p>
              <p className="m-0 mt-1 text-[1.5rem] font-extrabold text-[#0e182b]">
                {expectedPurchaseAmount != null
                  ? formatDollars(expectedPurchaseAmount)
                  : "—"}
              </p>
              <ul className="mt-3 space-y-1.5">
                {selectedBusinessDeals.map((deal) => {
                  const priceLabel = formatDealPrice(deal.price);
                  return (
                    <li
                      key={deal.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-semibold text-[#0e182b]">
                        {deal.campaignName}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {priceLabel ?? "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPurchaseStep(null)}
                className="min-w-24 rounded-lg border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={expectedPurchaseAmount == null}
                onClick={() => setPurchaseStep("enterPrice")}
                className="min-w-24 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedProfile && purchaseStep === "enterPrice" ? (
        <ScanOrderSubtotalDialog
          confirming={purchasing}
          requirePositiveAmount
          expectedAmount={expectedPurchaseAmount}
          onBack={() => {
            setPurchaseStep("confirm");
            setPendingDealAmount(null);
          }}
          onDone={(orderSubtotal) => {
            setPendingDealAmount(orderSubtotal);
            setPurchaseStep("enterExtra");
          }}
          onDismiss={() => {
            setPurchaseStep(null);
            setPendingDealAmount(null);
          }}
        />
      ) : null}

      {selectedProfile &&
      purchaseStep === "enterExtra" &&
      pendingDealAmount != null ? (
        <ScanOrderSubtotalDialog
          confirming={purchasing}
          extraPurchaseMode
          onBack={() => setPurchaseStep("enterPrice")}
          onDone={(extraItemsAmount) =>
            void handlePurchaseDeals(pendingDealAmount, extraItemsAmount)
          }
          onDismiss={() => {
            setPurchaseStep(null);
            setPendingDealAmount(null);
          }}
        />
      ) : null}

      {selectedProfile && redeemStep === "completeOrder" ? (
        <ScanCompleteOrderDialog
          customerName={selectedProfile.customerName}
          selectedRewards={selectedDeals.map(toRedeemableReward)}
          confirming={confirmingRedemption}
          onBack={() => setRedeemStep(null)}
          onContinue={() => {
            setRedeemStep("enterSubtotal");
          }}
          onDismiss={() => setRedeemStep(null)}
        />
      ) : null}

      {selectedProfile && redeemStep === "enterSubtotal" ? (
        <ScanOrderSubtotalDialog
          confirming={confirmingRedemption}
          requirePositiveAmount={
            !(
              selectedDeals.length > 0 &&
              selectedDeals.every((deal) => deal.paymentLabel === "PREPAID")
            )
          }
          extraPurchaseMode={
            selectedDeals.length > 0 &&
            selectedDeals.every((deal) => deal.paymentLabel === "PREPAID")
          }
          expectedAmount={
            selectedDeals.length > 0 &&
            selectedDeals.every((deal) => deal.paymentLabel === "PREPAID")
              ? null
              : sumCampaignPrices(selectedDeals)
          }
          onBack={() => {
            setRedeemStep("completeOrder");
            setPendingRedeemAmount(null);
          }}
          onDone={(orderSubtotal) => {
            const allPrepaid =
              selectedDeals.length > 0 &&
              selectedDeals.every((deal) => deal.paymentLabel === "PREPAID");
            if (allPrepaid) {
              void handleConfirmRedeem(selectedDealIds, orderSubtotal);
              return;
            }
            setPendingRedeemAmount(orderSubtotal);
            setRedeemStep("enterExtra");
          }}
          onDismiss={() => {
            setRedeemStep(null);
            setPendingRedeemAmount(null);
          }}
        />
      ) : null}

      {selectedProfile &&
      redeemStep === "enterExtra" &&
      pendingRedeemAmount != null ? (
        <ScanOrderSubtotalDialog
          confirming={confirmingRedemption}
          extraPurchaseMode
          onBack={() => setRedeemStep("enterSubtotal")}
          onDone={(extraItemsAmount) =>
            void handleConfirmRedeem(
              selectedDealIds,
              pendingRedeemAmount,
              extraItemsAmount,
            )
          }
          onDismiss={() => {
            setRedeemStep(null);
            setPendingRedeemAmount(null);
          }}
        />
      ) : null}

    <div className="flex min-h-0 w-full flex-1 flex-col">
      {showTable ? (
        <article className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8fafc]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e8edf5] bg-white px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe]">
                <Users className="size-5" strokeWidth={2.15} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="m-0 text-[1.1rem] font-extrabold tracking-tight text-[#07111f]">
                  Search results
                </h3>
                <p className="m-0 mt-0.5 text-[0.78rem] font-medium text-slate-500">
                  {meta?.total ?? 0} guest
                  {(meta?.total ?? 0) === 1 ? "" : "s"} found · Tap a row to open
                  profile
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e8f1ff] px-3 py-1 text-[0.74rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#dbeafe]">
                {meta?.total ?? 0} found
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveQuery("");
                  setResults([]);
                  setMeta(null);
                  setQuery("");
                  setErrorMessage(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-[0.74rem] font-bold text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff]"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Search again
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-5">
            <div className="overflow-hidden rounded-[1.25rem] border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <table className="w-full min-w-[42rem] border-collapse">
                <thead>
                  <tr className="border-b border-[#eef2f7] bg-[#fbfcfe]">
                    <th className={`${thClass} w-14`}>
                      <TableColumnHeader
                        label="#"
                        iconClassName={TABLE_HEAD_ICON_CLASS}
                        labelClassName={TABLE_HEAD_LABEL_CLASS}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={UserRound}
                        label="Guest"
                        iconClassName={TABLE_HEAD_ICON_CLASS}
                        labelClassName={TABLE_HEAD_LABEL_CLASS}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={Mail}
                        label="Email"
                        iconClassName={TABLE_HEAD_ICON_CLASS}
                        labelClassName={TABLE_HEAD_LABEL_CLASS}
                      />
                    </th>
                    <th className={thClass}>
                      <TableColumnHeader
                        icon={Phone}
                        label="Phone"
                        iconClassName={TABLE_HEAD_ICON_CLASS}
                        labelClassName={TABLE_HEAD_LABEL_CLASS}
                      />
                    </th>
                    <th className={`${thClass} w-28 text-right`}>
                      <span className={TABLE_HEAD_LABEL_CLASS}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searching && results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center">
                        <Loader2
                          className="mx-auto size-6 animate-spin text-[#1877f2]"
                          aria-hidden
                        />
                        <p className="mt-3 text-sm font-medium text-slate-600">
                          Searching guests…
                        </p>
                      </td>
                    </tr>
                  ) : null}

                  {!searching || results.length > 0
                    ? results.map((guest, index) => {
                        const rowNumber = rowOffset + index + 1;
                        const displayName = guest.name?.trim() || "Guest";
                        const initials = guestInitials(displayName);
                        const phone = guest.phone?.trim();

                        return (
                          <tr
                            key={guest.id}
                            className="group cursor-pointer border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#f7faff]"
                            onClick={() => void handleSelectGuest(guest)}
                          >
                            <td className={tdClass}>
                              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#e8f1ff] text-[0.72rem] font-bold tabular-nums text-[#1877f2]">
                                {rowNumber}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-bold ${guestAvatarTone(displayName)}`}
                                >
                                  {initials}
                                </span>
                                <div className="min-w-0">
                                  <p className="m-0 truncate font-bold text-[#07111f]">
                                    {displayName}
                                  </p>
                                  <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-400">
                                    Guest
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className={`${tdClass} max-w-[16rem]`}>
                              <span
                                className="inline-flex max-w-full items-center gap-2 text-slate-600"
                                title={guest.email}
                              >
                                <span
                                  className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                                  aria-hidden
                                />
                                <span className="truncate">{guest.email}</span>
                              </span>
                            </td>
                            <td className={tdClass}>
                              {phone ? (
                                <span className="inline-flex items-center gap-2 text-slate-600">
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#059669] ring-1 ring-[#a7f3d0]">
                                    <Phone
                                      className="size-3.5"
                                      strokeWidth={2.15}
                                      aria-hidden
                                    />
                                  </span>
                                  {phone}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-3 py-1.5 text-[0.75rem] font-bold text-[#1877f2] ring-1 ring-[#dbeafe] transition group-hover:bg-[#1877f2] group-hover:text-white group-hover:ring-[#1877f2]">
                                Open
                                <ChevronRight className="size-3.5" aria-hidden />
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    : null}
                </tbody>
              </table>
            </div>
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="shrink-0 border-t border-[#e8edf5] bg-white px-4 py-3 sm:px-6">
              <OffsetPagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                loading={searching}
                onPageChange={handlePageChange}
                itemLabel="guests"
              />
            </div>
          ) : null}
        </article>
      ) : selectedProfile || loadingProfile ? (
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          {loadingProfile ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <Loader2
                className="size-10 animate-spin text-[#1877f2]"
                aria-hidden
              />
              <div>
                <p className="m-0 text-[0.95rem] font-extrabold text-[#0e182b]">
                  Loading guest
                </p>
                <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
                  Fetching profile and active deals…
                </p>
              </div>
            </div>
          ) : null}

          {selectedProfile ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.32, ease: standardEase }}
              className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
            >
              <div className="relative shrink-0 overflow-hidden border-b border-[#e8edf5] bg-white px-5 py-4 sm:px-7">
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                    </span>
                    <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Guest profile
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(null);
                        setSelectedDealIds([]);
                        setRedeemStep(null);
                        setRedeemSuccess(null);
                        setPendingRedeemAmount(null);
                        setSelectedFunnelIds([]);
                        setPurchaseStep(null);
                        setPendingDealAmount(null);
                        setPurchaseSuccess(null);
                        setBusinessDeals([]);
                        setPreviousRedemptions([]);
                        setPreviousRedemptionsMeta(null);
                        setPreviousRedemptionsPage(1);
                        idempotencyKeyRef.current = "";
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2 text-[0.72rem] font-bold text-[#0e182b] transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] hover:text-[#1877f2]"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden />
                      Back to results
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void handleDeleteGuest()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-[0.72rem] font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: standardEase }}
                  className="relative overflow-hidden border-b border-[#e8edf5] bg-white px-5 py-7 sm:px-7 sm:py-8"
                >
                  <div className="relative flex min-w-0 flex-wrap items-start gap-5 sm:gap-6">
                    <span className="flex size-[4.75rem] shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[1.45rem] font-bold text-white shadow-[0_12px_28px_rgba(24,119,242,0.28)] sm:size-[5.25rem] sm:text-[1.6rem]">
                      {guestInitials(selectedProfile.customerName)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#1877f2] px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)]">
                        <UserCheck className="size-3.5" aria-hidden />
                        Ready to redeem
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h2 className="m-0 text-[1.65rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.9rem]">
                          {selectedProfile.customerName}
                        </h2>
                        <span className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[0.78rem] font-medium text-slate-600 ring-1 ring-[#e2e8f0] sm:max-w-[20rem]">
                          <Mail
                            className="size-3.5 shrink-0 text-[#1877f2]"
                            aria-hidden
                          />
                          <span className="truncate">
                            {selectedProfile.email}
                          </span>
                        </span>
                        {selectedProfile.phone ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[0.78rem] font-medium text-slate-600 ring-1 ring-[#e2e8f0]">
                            <Phone
                              className="size-3.5 shrink-0 text-[#1877f2]"
                              aria-hidden
                            />
                            {selectedProfile.phone}
                          </span>
                        ) : null}
                        <span
                          className="hidden h-5 w-px shrink-0 bg-[#e2e8f0] sm:block"
                          aria-hidden
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[0.78rem] font-semibold text-[#0e182b] ring-1 ring-[#e2e8f0]">
                          <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Guest deals
                          </span>
                          <span className="tabular-nums font-extrabold">
                            {activeDeals.length}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.78rem] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                          <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-emerald-600">
                            Paid
                          </span>
                          <span className="tabular-nums font-extrabold">
                            {prepaidDeals.length}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-2.5 py-1 text-[0.78rem] font-semibold text-[#0e3a8a] ring-1 ring-[#dbeafe]">
                          <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#1877f2]">
                            Redeemed
                          </span>
                          <span className="tabular-nums font-extrabold">
                            {previousRedemptionsMeta?.total ??
                              selectedProfile.previouslyRedeemedCount}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                  {redeemSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-[1.2rem] border border-[#86efac] bg-[#ecfdf5] px-4 py-4 shadow-[0_10px_28px_rgba(16,185,129,0.12)]"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-5 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-extrabold text-emerald-900">
                          Redeemed successfully
                        </p>
                        <p className="m-0 mt-0.5 text-sm text-emerald-800">
                          {redeemSuccess.campaignName} ·{" "}
                          {formatDateTimeShort(redeemSuccess.redeemedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRedeemSuccess(null)}
                        className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  ) : null}

                  {purchaseSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-[1.2rem] border border-[#86efac] bg-[#ecfdf5] px-4 py-4 shadow-[0_10px_28px_rgba(16,185,129,0.12)]"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-5 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-extrabold text-emerald-900">
                          Deals attached
                        </p>
                        <p className="m-0 mt-0.5 text-sm text-emerald-800">
                          {purchaseSuccess.length === 1
                            ? purchaseSuccess[0].campaignName
                            : `${purchaseSuccess.length} deals`}{" "}
                          added for this guest.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPurchaseSuccess(null)}
                        className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  ) : null}

                  <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
                    <motion.section
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.38,
                        delay: 0.06,
                        ease: standardEase,
                      }}
                      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
                    >
                      <div className="shrink-0 border-b border-[#eef2f7] px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#1877f2]">
                              <Gift className="size-[1.05rem]" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <h3 className="m-0 text-[1.02rem] font-extrabold tracking-tight text-[#0f172a]">
                                Guest deals
                              </h3>
                              <p className="m-0 mt-0.5 text-[0.74rem] font-medium text-slate-500">
                                Redeem deals already on this guest.
                              </p>
                            </div>
                          </div>
                          <p className="m-0 shrink-0 text-[0.74rem] font-semibold text-[#1877f2]">
                            Redeem one guest deal at a time →
                          </p>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-5">
                        {activeDeals.length === 0 ? (
                          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#dbe3ef] bg-[#f8fafc] px-4 py-8 text-center">
                            <Wallet
                              className="mx-auto size-6 text-slate-300"
                              aria-hidden
                            />
                            <p className="m-0 mt-2.5 text-[0.84rem] font-semibold text-slate-600">
                              No active deals on this guest yet
                            </p>
                            <p className="m-0 mt-1 text-[0.72rem] font-medium text-slate-400">
                              Attach a business deal to get started.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div
                              className="mt-1 flex gap-5 border-b border-[#eef2f7]"
                              role="tablist"
                              aria-label="Guest deal filters"
                            >
                              {(
                                [
                                  {
                                    id: "all" as const,
                                    label: "All",
                                    count: activeDeals.length,
                                  },
                                  {
                                    id: "paid" as const,
                                    label: "Paid",
                                    count: prepaidDeals.length,
                                  },
                                  {
                                    id: "unpaid" as const,
                                    label: "Not Paid Yet",
                                    count: unpaidDeals.length,
                                  },
                                ] as const
                              ).map((tab) => {
                                const active = guestDealTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setGuestDealTab(tab.id)}
                                    className={`relative cursor-pointer pb-2.5 pt-3 text-[0.8rem] font-semibold transition ${
                                      active
                                        ? "text-[#1877f2]"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                                  >
                                    {tab.label} ({tab.count})
                                    {active ? (
                                      <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#1877f2]" />
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="mt-3 flex min-h-0 flex-1 flex-col">
                              {filteredGuestDeals.length > 0 ? (
                                <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]">
                                  {filteredGuestDeals.map((deal) => (
                                    <DealSelectRow
                                      key={deal.couponId}
                                      deal={deal}
                                      checked={selectedDealIds.includes(
                                        deal.couponId,
                                      )}
                                      disabled={
                                        confirmingRedemption || purchasing
                                      }
                                      onToggle={() => toggleDealSelection(deal)}
                                      onRedeem={() => startRedeemDeal(deal)}
                                    />
                                  ))}
                                </ul>
                              ) : (
                                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#dbe3ef] bg-[#f8fafc] px-4 py-8 text-center">
                                  <p className="m-0 text-[0.8rem] font-medium text-slate-500">
                                    No deals in this filter.
                                  </p>
                                </div>
                              )}

                              <p className="m-0 mt-3 text-center text-[0.72rem] font-medium text-slate-400">
                                Showing {filteredGuestDeals.length} of{" "}
                                {activeDeals.length} deals
                              </p>

                              {selectedDealIds.length > 0 ? (
                                <div className="mt-3 flex justify-end border-t border-[#f1f5f9] pt-3">
                                  <button
                                    type="button"
                                    disabled={
                                      confirmingRedemption || purchasing
                                    }
                                    onClick={() =>
                                      setRedeemStep("completeOrder")
                                    }
                                    className="cursor-pointer rounded-lg bg-[#1877f2] px-4 py-2 text-[0.8rem] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
                                  >
                                    {confirmingRedemption
                                      ? "Redeeming…"
                                      : "Redeem selected"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.section>

                    <motion.section
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.38,
                        delay: 0.12,
                        ease: standardEase,
                      }}
                      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
                    >
                      <div className="shrink-0 border-b border-[#eef2f7] px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#1877f2]">
                              <Briefcase
                                className="size-[1.05rem]"
                                aria-hidden
                              />
                            </span>
                            <div className="min-w-0">
                              <h3 className="m-0 text-[1.02rem] font-extrabold tracking-tight text-[#0f172a]">
                                Business deals
                              </h3>
                              <p className="m-0 mt-0.5 text-[0.74rem] font-medium text-slate-500">
                                Active campaigns you can attach to this guest.
                              </p>
                            </div>
                          </div>
                          <p className="m-0 shrink-0 text-[0.74rem] font-semibold text-[#1877f2]">
                            Attach new deal →
                          </p>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">
                        {loadingBusinessDeals ? (
                          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-4 text-sm font-medium text-slate-600">
                            <Loader2
                              className="size-4 animate-spin text-[#1877f2]"
                              aria-hidden
                            />
                            Loading business deals…
                          </div>
                        ) : null}

                        {!loadingBusinessDeals && businessDeals.length > 0 ? (
                          <div className="flex min-h-0 flex-1 flex-col">
                            <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]">
                              {businessDeals.map((deal) => (
                                <BusinessDealCheckboxRow
                                  key={deal.id}
                                  deal={deal}
                                  checked={selectedFunnelIds.includes(deal.id)}
                                  alreadyOnGuest={guestFunnelIds.has(deal.id)}
                                  disabled={purchasing || confirmingRedemption}
                                  onToggle={() =>
                                    toggleBusinessDealSelection(deal.id)
                                  }
                                />
                              ))}
                            </ul>

                            <p className="m-0 mt-3 text-center text-[0.72rem] font-medium text-slate-400">
                              Showing {businessDeals.length} of{" "}
                              {businessDeals.length} deals
                            </p>

                            {selectedFunnelIds.length > 0 ? (
                              <div className="mt-3 flex justify-end border-t border-[#f1f5f9] pt-3">
                                <button
                                  type="button"
                                  disabled={
                                    purchasing ||
                                    confirmingRedemption ||
                                    expectedPurchaseAmount == null
                                  }
                                  onClick={() => setPurchaseStep("confirm")}
                                  className="cursor-pointer rounded-lg bg-[#1877f2] px-4 py-2 text-[0.8rem] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
                                >
                                  Confirm ({selectedFunnelIds.length})
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {!loadingBusinessDeals && businessDeals.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#dbe3ef] bg-[#f8fafc] px-4 py-8 text-center">
                            <p className="m-0 text-[0.84rem] font-semibold text-slate-600">
                              No active deals for this business.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </motion.section>
                  </div>

                  {(previousRedemptionsMeta?.total ??
                    selectedProfile.previouslyRedeemedCount) > 0 ||
                  loadingPreviousRedemptions ? (
                    <motion.section
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.38,
                        delay: 0.16,
                        ease: standardEase,
                      }}
                      className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f7] px-5 py-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#1877f2]">
                            <History className="size-[1.05rem]" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <h3 className="m-0 text-[1.02rem] font-extrabold tracking-tight text-[#0f172a]">
                              Previously redeemed
                            </h3>
                            <p className="m-0 mt-0.5 text-[0.74rem] font-medium text-slate-500">
                              Past rewards this guest has already used.
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#1877f2] px-3 py-1.5 text-[0.72rem] font-bold tabular-nums text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)]">
                          {previousRedemptionsMeta?.total ??
                            selectedProfile.previouslyRedeemedCount}{" "}
                          redeemed
                        </span>
                      </div>

                      <div className="overflow-x-auto overscroll-x-contain">
                        <table className="w-full min-w-[32rem] border-collapse">
                          <thead>
                            <tr className="border-b border-[#e8edf5] bg-[#f8fafc]">
                              <th className={`${thClass} w-12`}>
                                <TableColumnHeader
                                  label="#"
                                  iconClassName={TABLE_HEAD_ICON_CLASS}
                                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                                />
                              </th>
                              <th className={thClass}>
                                <TableColumnHeader
                                  icon={Gift}
                                  label="Campaign"
                                  iconClassName={TABLE_HEAD_ICON_CLASS}
                                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                                />
                              </th>
                              <th className={thClass}>
                                <TableColumnHeader
                                  icon={History}
                                  label="Redeemed at"
                                  iconClassName={TABLE_HEAD_ICON_CLASS}
                                  labelClassName={TABLE_HEAD_LABEL_CLASS}
                                />
                              </th>
                              <th className={`${thClass} w-28 text-right`}>
                                <span className={TABLE_HEAD_LABEL_CLASS}>
                                  Status
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingPreviousRedemptions &&
                            previousRedemptions.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-10 text-center">
                                  <Loader2
                                    className="mx-auto size-5 animate-spin text-[#1877f2]"
                                    aria-hidden
                                  />
                                  <p className="mt-2 text-sm font-medium text-slate-500">
                                    Loading redeemed rewards…
                                  </p>
                                </td>
                              </tr>
                            ) : null}

                            {!loadingPreviousRedemptions &&
                            previousRedemptions.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-8 text-center text-sm font-medium text-slate-500"
                                >
                                  No previously redeemed rewards.
                                </td>
                              </tr>
                            ) : null}

                            {previousRedemptions.map((item, index) => {
                              const rowNumber =
                                ((previousRedemptionsMeta?.page ??
                                  previousRedemptionsPage) -
                                  1) *
                                  (previousRedemptionsMeta?.limit ??
                                    GUEST_PREVIOUS_REDEMPTIONS_PAGE_SIZE) +
                                index +
                                1;
                              return (
                                <tr
                                  key={`${item.campaignName}-${item.redeemedAt}-${rowNumber}`}
                                  className="border-b border-[#f1f5f9] transition-colors last:border-0 hover:bg-[#f8fafc]"
                                >
                                  <td className={tdClass}>
                                    <span className="text-xs font-semibold tabular-nums text-slate-400">
                                      {rowNumber}
                                    </span>
                                  </td>
                                  <td className={tdClass}>
                                    <span className="inline-flex items-center gap-2 font-extrabold text-[#07111f]">
                                      <span className="flex size-8 items-center justify-center rounded-lg bg-[#eef5ff] text-[#1877f2]">
                                        <Gift className="size-3.5" aria-hidden />
                                      </span>
                                      {item.campaignName}
                                    </span>
                                  </td>
                                  <td className={tdClass}>
                                    {item.redeemedAt ? (
                                      <span className="font-medium text-slate-600">
                                        {formatDateTimeShort(item.redeemedAt)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className={`${tdClass} text-right`}>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-100">
                                      <CheckCircle2
                                        className="size-3"
                                        aria-hidden
                                      />
                                      Used
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {previousRedemptionsMeta &&
                      previousRedemptionsMeta.totalPages > 1 ? (
                        <div className="border-t border-[#e8edf5] px-5 py-3 sm:px-7">
                          <OffsetPagination
                            page={previousRedemptionsMeta.page}
                            totalPages={previousRedemptionsMeta.totalPages}
                            total={previousRedemptionsMeta.total}
                            limit={previousRedemptionsMeta.limit}
                            loading={loadingPreviousRedemptions}
                            onPageChange={setPreviousRedemptionsPage}
                            itemLabel="rewards"
                          />
                        </div>
                      ) : null}
                    </motion.section>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      ) : (
        <div className="w-full overflow-y-auto overscroll-contain px-4 py-4 pb-6 sm:px-5 sm:py-5">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {!selectedProfile &&
            !loadingProfile &&
            activeQuery.length === 0 &&
            !searching &&
            !showGuestNotFound ? (
              <SearchHeroCard
                query={query}
                searching={searching}
                onQueryChange={setQuery}
                onSearch={handleSearch}
              />
            ) : null}

            {!selectedProfile && searching && !showTable ? (
              <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-[1.1rem] border border-[#e8edf5] bg-white px-4 py-10 text-sm font-medium text-slate-600">
                <Loader2
                  className="size-4 animate-spin text-[#1877f2]"
                  aria-hidden
                />
                Searching guests…
              </div>
            ) : null}

            {errorMessage && !showGuestNotFound ? (
              <div className="mx-auto w-full max-w-2xl rounded-[1.1rem] border border-[#fecaca] bg-white px-4 py-3 text-sm text-[#dc2626]">
                {errorMessage}
              </div>
            ) : null}

            {showGuestNotFound ? (
              <GuestNotInDatabasePanel
                searchQuery={guestNotFoundQuery}
                onCreateGuest={onCreateGuest}
                onSearchAgain={() => {
                  setActiveQuery("");
                  setResults([]);
                  setMeta(null);
                  setQuery("");
                  setGuestNotInDatabaseQuery(null);
                  setErrorMessage(null);
                }}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
