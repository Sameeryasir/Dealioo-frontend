"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Gift,
  History,
  Loader2,
  Mail,
  Phone,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserRound,
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
  scanRedemptionQr,
  type GuestActiveDeal,
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
  },
  {
    icon: UserCheck,
    title: "Open profile",
    description: "Review contact details and active deals.",
  },
  {
    icon: Wallet,
    title: "Redeem offer",
    description: "Apply rewards and complete the order.",
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3.5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: standardEase }}
        className="overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]"
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
          <p className="m-0 hidden text-[0.7rem] font-medium text-white/50 sm:block">
            Counter search mode
          </p>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
            <Sparkles className="size-3" aria-hidden />
            Ready to search
          </p>
          <h3 className="m-0 mt-2 text-[1.15rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.25rem]">
            Find a guest quickly
          </h3>
          <p className="m-0 mt-1 max-w-md text-[0.78rem] font-medium leading-relaxed text-slate-500">
            Search your guest list, open their profile, and redeem active deals.
          </p>

          <div className="relative mt-4 min-w-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#1877f2]/70"
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
              className="w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pr-28 pl-11 text-[0.84rem] font-medium text-[#0e182b] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
            />
            <button
              type="button"
              disabled={!query.trim() || searching}
              onClick={onSearch}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-full bg-[#1877f2] px-4 py-2 text-[0.78rem] font-bold text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                "Search"
              )}
            </button>
          </div>
          <p className="m-0 mt-2.5 text-[0.7rem] font-medium text-slate-500">
            Type at least 2 characters, then search.
          </p>
        </div>
      </motion.div>

      <div className="grid gap-2.5 sm:grid-cols-3">
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
              className="rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1877f2] text-[0.7rem] font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className="size-3.5 shrink-0 text-[#1877f2]"
                      aria-hidden
                    />
                    <p className="m-0 text-[0.8rem] font-bold text-[#0e182b]">
                      {step.title}
                    </p>
                  </div>
                  <p className="m-0 mt-1 text-[0.7rem] leading-snug text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
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

function formatDealPrice(price: number | string | null): string | null {
  if (price == null || price === "") return null;
  const numeric = typeof price === "number" ? price : Number.parseFloat(price);
  if (!Number.isFinite(numeric)) return null;
  return formatDollars(numeric);
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

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex w-full items-start gap-3 rounded-[1rem] border px-4 py-3.5 text-left transition ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-sm"
        } ${
          checked
            ? "border-[#1877f2]/35 bg-[#f4f8ff] shadow-[0_6px_16px_rgba(24,119,242,0.1)] ring-1 ring-[#1877f2]/20"
            : "border-[#e8edf5] bg-white hover:border-[#dbeafe] hover:bg-[#f8fafc]"
        }`}
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
            checked
              ? "border-[#1877f2] bg-[#1877f2] text-xs text-white"
              : "border-zinc-300 bg-white"
          }`}
          aria-hidden
        >
          {checked ? "✓" : ""}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#0e182b]">{deal.campaignName}</span>
            {alreadyOnGuest ? (
              <span className="rounded-full bg-[#f4f8ff] px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                On guest
              </span>
            ) : null}
          </span>
          {priceLabel ? (
            <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-700 ring-1 ring-emerald-100">
              {priceLabel}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
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
          : label;
  const isPaid = badge === "PAID_ONLINE" || badge === "PAID_AT_COUNTER" || label === "PREPAID";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${
        badge === "PAID_AT_COUNTER"
          ? "bg-sky-700"
          : isPaid
            ? "bg-emerald-600"
            : "bg-zinc-500"
      }`}
    >
      {display}
    </span>
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
  tone,
  onToggle,
}: {
  deal: NormalizedGuestActiveDeal;
  checked: boolean;
  disabled: boolean;
  tone: "prepaid" | "unpaid";
  onToggle: () => void;
}) {
  const cardClass =
    tone === "prepaid"
      ? checked
        ? "border-emerald-300 bg-white ring-1 ring-emerald-200"
        : "border-[#e8edf5] bg-white"
      : checked
        ? "border-zinc-400 bg-white ring-1 ring-zinc-300"
        : "border-[#e8edf5] bg-white";

  return (
    <li>
      <button
        type="button"
        disabled={disabled || !deal.canSelect}
        onClick={onToggle}
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
          deal.canSelect ? "cursor-pointer hover:bg-[#f8fafc]" : "cursor-not-allowed opacity-60"
        } ${cardClass}`}
      >
        {deal.canSelect ? (
          <span
            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
              checked
                ? "border-zinc-900 bg-zinc-900 text-xs text-white"
                : "border-zinc-300 bg-white"
            }`}
            aria-hidden
          >
            {checked ? "✓" : ""}
          </span>
        ) : (
          <span className="mt-0.5 size-5 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-800">{deal.offerName}</span>
            <DealPaymentBadge label={deal.paymentLabel} badge={deal.paymentBadge} />
          </span>
          <span className="mt-1 block text-xs text-slate-700">
            {deal.campaignName}
            {deal.expiresAt ? (
              <>, Expires {formatDateTimeShort(deal.expiresAt)}</>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

export function ScannerSearchGuestPanel({
  businessId,
  onCreateGuest,
}: {
  businessId: number;
  onCreateGuest?: () => void;
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
  const [showPreviousRedemptions, setShowPreviousRedemptions] = useState(true);
  const [deleting, setDeleting] = useState(false);
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
      setShowPreviousRedemptions(false);

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
      setShowPreviousRedemptions(false);
      setSelectedDealIds([]);
      setRedeemStep(null);
      setRedeemSuccess(null);
      setSelectedFunnelIds([]);
      setPurchaseStep(null);
      setPendingDealAmount(null);
      setPurchaseSuccess(null);
      setBusinessDeals([]);
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
      setShowPreviousRedemptions(false);

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

  const toggleDealSelection = useCallback((deal: NormalizedGuestActiveDeal) => {
    if (!deal.canSelect || confirmingRedemption || purchasing) return;

    setSelectedFunnelIds([]);
    setSelectedDealIds((current) => {
      if (current.includes(deal.couponId)) {
        return current.filter((id) => id !== deal.couponId);
      }

      const selectedType = activeDeals.find((item) =>
        current.includes(item.couponId),
      )?.paymentLabel;

      if (selectedType && selectedType !== deal.paymentLabel) {
        return current;
      }

      return [...current, deal.couponId];
    });
  }, [activeDeals, confirmingRedemption, purchasing]);

  const selectedDeals = useMemo(
    () => activeDeals.filter((deal) => selectedDealIds.includes(deal.couponId)),
    [activeDeals, selectedDealIds],
  );

  const selectedPaymentLabel = selectedDeals[0]?.paymentLabel ?? null;

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

    <div className="w-full pb-6">
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
          <Loader2 className="size-4 animate-spin text-[#1877f2]" aria-hidden />
          Searching guests…
        </div>
      ) : null}

      {errorMessage && !showGuestNotFound ? (
        <div className="mx-auto w-full max-w-2xl rounded-[1.1rem] border border-[#fecaca] bg-white px-4 py-3 text-sm text-[#dc2626]">
          {errorMessage}
        </div>
      ) : null}

      {loadingProfile ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-[1.5rem] border border-[#e2e8f0] bg-white px-6 py-14 text-center shadow-[0_14px_40px_rgba(14,24,43,0.08)]">
          <Loader2 className="size-10 animate-spin text-[#1877f2]" aria-hidden />
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
          transition={{ duration: 0.28, ease: standardEase }}
          className="w-full overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
                Guest profile
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedProfile(null);
                  setShowPreviousRedemptions(false);
                  setSelectedDealIds([]);
                  setRedeemStep(null);
                  setRedeemSuccess(null);
                  setPendingRedeemAmount(null);
                  setSelectedFunnelIds([]);
                  setPurchaseStep(null);
                  setPendingDealAmount(null);
                  setPurchaseSuccess(null);
                  setBusinessDeals([]);
                  idempotencyKeyRef.current = "";
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back to results
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteGuest()}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1.5 text-[0.72rem] font-bold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>

          <div className="border-b border-[#e8edf5] bg-white px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[1.1rem] font-bold text-white">
                {guestInitials(selectedProfile.customerName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                  <UserCheck className="size-3" aria-hidden />
                  Ready to redeem
                </p>
                <h2 className="m-0 mt-2 text-[1.25rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.35rem]">
                  {selectedProfile.customerName}
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3 py-1.5 text-[0.76rem] font-medium text-slate-600">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f4f8ff] text-[#1877f2]">
                      <Mail className="size-3.5" aria-hidden />
                    </span>
                    <span className="truncate">{selectedProfile.email}</span>
                  </span>
                  {selectedProfile.phone ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3 py-1.5 text-[0.76rem] font-medium text-slate-600">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f4f8ff] text-[#1877f2]">
                        <Phone className="size-3.5" aria-hidden />
                      </span>
                      {selectedProfile.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 pb-6 sm:p-6 sm:pb-7">
            {redeemSuccess ? (
              <div className="flex items-start gap-3 rounded-[1.1rem] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4">
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
              </div>
            ) : null}

            {purchaseSuccess ? (
              <div className="flex items-start gap-3 rounded-[1.1rem] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4">
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
              </div>
            ) : null}

            <section className="rounded-[1.15rem] border border-[#e8edf5] bg-[#f8fafc]/70 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0e182b] text-white shadow-[0_6px_14px_rgba(14,24,43,0.18)]">
                    <Gift className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="m-0 text-[0.92rem] font-extrabold text-[#0e182b]">
                      Guest deals
                    </h3>
                    <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                      Redeem deals already on this guest
                    </p>
                  </div>
                </div>
                {activeDeals.some((deal) => deal.canSelect) ? (
                  <p className="max-w-[14rem] text-right text-[0.7rem] font-medium text-slate-500">
                    Select paid or unpaid deals — not both together.
                  </p>
                ) : null}
              </div>

              {activeDeals.length === 0 ? (
                <div className="mt-3 rounded-[1rem] border border-dashed border-[#dbe3ef] bg-white px-4 py-5 text-center">
                  <Wallet className="mx-auto size-5 text-slate-300" aria-hidden />
                  <p className="m-0 mt-2 text-[0.8rem] font-semibold text-slate-600">
                    No active deals on this guest yet
                  </p>
                  <p className="m-0 mt-1 text-[0.72rem] font-medium text-slate-400">
                    Attach a business deal below to get started.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
                      Paid ({prepaidDeals.length})
                    </p>
                    {prepaidDeals.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {prepaidDeals.map((deal) => (
                          <DealSelectRow
                            key={deal.couponId}
                            deal={deal}
                            checked={selectedDealIds.includes(deal.couponId)}
                            disabled={
                              confirmingRedemption ||
                              purchasing ||
                              (selectedPaymentLabel === "UNPAID" &&
                                !selectedDealIds.includes(deal.couponId))
                            }
                            tone="prepaid"
                            onToggle={() => toggleDealSelection(deal)}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 mt-2 text-[0.78rem] font-medium text-slate-500">
                        No paid deals.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-slate-600 ring-1 ring-slate-200">
                      Not paid yet ({unpaidDeals.length})
                    </p>
                    {unpaidDeals.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {unpaidDeals.map((deal) => (
                          <DealSelectRow
                            key={deal.couponId}
                            deal={deal}
                            checked={selectedDealIds.includes(deal.couponId)}
                            disabled={
                              confirmingRedemption ||
                              purchasing ||
                              (selectedPaymentLabel === "PREPAID" &&
                                !selectedDealIds.includes(deal.couponId))
                            }
                            tone="unpaid"
                            onToggle={() => toggleDealSelection(deal)}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 mt-2 text-[0.78rem] font-medium text-slate-500">
                        No unpaid deals.
                      </p>
                    )}
                  </div>

                  {selectedDealIds.length > 0 ? (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={confirmingRedemption || purchasing}
                        onClick={() => setRedeemStep("completeOrder")}
                        className="cursor-pointer rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:opacity-50"
                      >
                        {confirmingRedemption
                          ? "Redeeming…"
                          : `Redeem selected (${selectedDealIds.length})`}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-[1.15rem] border border-[#e8edf5] bg-white p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]">
                  <Gift className="size-4" aria-hidden />
                </span>
                <div>
                  <h3 className="m-0 text-[0.92rem] font-extrabold text-[#0e182b]">
                    Business deals
                  </h3>
                  <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                    Active campaigns you can attach to this guest
                  </p>
                </div>
              </div>

              {loadingBusinessDeals ? (
                <div className="mt-3 flex items-center gap-2 rounded-[1rem] border border-[#e8edf5] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-600">
                  <Loader2
                    className="size-4 animate-spin text-[#1877f2]"
                    aria-hidden
                  />
                  Loading business deals…
                </div>
              ) : null}

              {!loadingBusinessDeals && businessDeals.length > 0 ? (
                <>
                  <ul className="mt-3 space-y-2">
                    {businessDeals.map((deal) => (
                      <BusinessDealCheckboxRow
                        key={deal.id}
                        deal={deal}
                        checked={selectedFunnelIds.includes(deal.id)}
                        alreadyOnGuest={guestFunnelIds.has(deal.id)}
                        disabled={purchasing || confirmingRedemption}
                        onToggle={() => toggleBusinessDealSelection(deal.id)}
                      />
                    ))}
                  </ul>
                  {selectedFunnelIds.length > 0 ? (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        disabled={
                          purchasing ||
                          confirmingRedemption ||
                          expectedPurchaseAmount == null
                        }
                        onClick={() => setPurchaseStep("confirm")}
                        className="cursor-pointer rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:opacity-50"
                      >
                        Confirm ({selectedFunnelIds.length})
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}

              {!loadingBusinessDeals && businessDeals.length === 0 ? (
                <div className="mt-3 rounded-[1rem] border border-dashed border-[#dbe3ef] bg-[#f8fafc] px-4 py-5 text-center">
                  <p className="m-0 text-[0.8rem] font-semibold text-slate-600">
                    No active deals for this business.
                  </p>
                </div>
              ) : null}
            </section>

            {selectedProfile.previouslyRedeemedCount > 0 ? (
              <section className="rounded-[1.15rem] border border-[#e8edf5] bg-white p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowPreviousRedemptions((current) => !current)
                  }
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0e182b] text-white">
                      <History className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="m-0 text-[0.92rem] font-extrabold text-[#0e182b]">
                        Previously redeemed
                      </h3>
                      <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                        Past rewards this guest has already used
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1877f2] px-3 py-1.5 text-[0.72rem] font-bold tabular-nums text-white">
                    {selectedProfile.previouslyRedeemedCount}
                    <ChevronRight
                      className={`size-3.5 transition ${
                        showPreviousRedemptions ? "rotate-90" : ""
                      }`}
                      aria-hidden
                    />
                  </span>
                </button>

                {showPreviousRedemptions ? (
                  <ul className="mt-3 space-y-2">
                    {selectedProfile.previousRedemptions.map((item, index) => (
                      <li
                        key={`${item.campaignName}-${item.redeemedAt}-${index}`}
                        className="flex items-start gap-3 rounded-[1rem] border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-3"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                          <CheckCircle2 className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[0.84rem] font-bold text-[#0e182b]">
                            {item.campaignName}
                          </p>
                          {item.redeemedAt ? (
                            <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                              Redeemed {formatDateTimeShort(item.redeemedAt)}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[0.66rem] font-bold tabular-nums text-slate-500 ring-1 ring-[#e8edf5]">
                          #{index + 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </div>
        </motion.div>
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

      {showTable ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: standardEase }}
          className="mx-auto w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]"
        >
          <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
                Search results
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveQuery("");
                setResults([]);
                setMeta(null);
                setQuery("");
                setErrorMessage(null);
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-white/15"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Search again
            </button>
          </div>

          <div className="relative overflow-hidden border-b border-[#e8edf5] px-5 py-4 sm:px-6">
            <span
              className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-[#1877f2]/10 blur-2xl"
              aria-hidden
            />
            <div className="relative flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                  <Sparkles className="size-3" aria-hidden />
                  Matches ready
                </p>
                <h3 className="m-0 mt-2 text-[1.15rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.25rem]">
                  {meta?.total ?? 0} guest
                  {(meta?.total ?? 0) === 1 ? "" : "s"} found
                </h3>
                <p className="m-0 mt-1 text-[0.78rem] font-medium text-slate-500">
                  Tap a guest to open their profile and redeem deals.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1877f2] px-3.5 py-1.5 text-[0.72rem] font-bold tabular-nums text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)]">
                <UserRound className="size-3.5" aria-hidden />
                {meta?.total ?? 0} found
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3">
            <div className="overflow-x-auto overscroll-x-contain rounded-[1.1rem] ring-1 ring-[#e8edf5]">
              <table className="w-full min-w-[36rem] border-collapse">
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
                    <th className={`${thClass} w-20 text-right`}>
                      <span className="sr-only">View</span>
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

                        return (
                          <motion.tr
                            key={guest.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.28,
                              delay: Math.min(index * 0.04, 0.24),
                              ease: standardEase,
                            }}
                            className="group cursor-pointer border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/80"
                            onClick={() => void handleSelectGuest(guest)}
                          >
                            <td className={tdClass}>
                              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#f1f5f9] text-[0.7rem] font-bold tabular-nums text-slate-500 transition group-hover:bg-[#1877f2]/10 group-hover:text-[#1877f2]">
                                {rowNumber}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[0.75rem] font-bold text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)] ring-2 ring-white">
                                  {initials}
                                </span>
                                <span className="truncate text-[0.9rem] font-bold text-[#0e182b]">
                                  {displayName}
                                </span>
                              </div>
                            </td>
                            <td className={`${tdClass} max-w-[12rem] sm:max-w-xs`}>
                              <span className="inline-flex min-w-0 items-center gap-2 text-slate-600">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f4f8ff] text-[#1877f2]/70">
                                  <Mail className="size-3.5" aria-hidden />
                                </span>
                                <span className="truncate" title={guest.email}>
                                  {guest.email}
                                </span>
                              </span>
                            </td>
                            <td className={tdClass}>
                              {guest.phone?.trim() ? (
                                <span className="inline-flex items-center gap-2 text-slate-600">
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f4f8ff] text-[#1877f2]/70">
                                    <Phone className="size-3.5" aria-hidden />
                                  </span>
                                  {guest.phone}
                                </span>
                              ) : (
                                <span className="text-zinc-300">N/A</span>
                              )}
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <span className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[0.72rem] font-bold text-slate-400 transition group-hover:border-[#dbeafe] group-hover:bg-white group-hover:text-[#1877f2] group-hover:shadow-sm">
                                Open
                                <ChevronRight className="size-3.5" aria-hidden />
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })
                    : null}
                </tbody>
              </table>
            </div>
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="border-t border-[#e8edf5] px-5 py-3 sm:px-6">
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
        </motion.div>
      ) : null}
      </div>
    </div>
    </>
  );
}
