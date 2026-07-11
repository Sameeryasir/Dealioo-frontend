"use client";

import {
  CheckCircle2,
  ChevronRight,
  Gift,
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
import { useCallback, useMemo, useRef, useState } from "react";
import { GuestNotInDatabasePanel } from "@/app/components/business/GuestNotInDatabasePanel";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { ScanCompleteOrderDialog } from "@/app/components/business/ScanCompleteOrderDialog";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { formatDateTimeShort } from "@/app/lib/datetime";
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] p-6 shadow-[0_12px_32px_rgba(24,119,242,0.08)] ring-1 ring-black/[0.02] sm:p-8">
        <span
          className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-[#1877f2]/10 blur-2xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-12 -left-10 size-32 rounded-full bg-[#6366f1]/8 blur-2xl"
          aria-hidden
        />

        <div className="relative">
          <p className="m-0 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
            <Sparkles className="size-3" aria-hidden />
            Guest lookup
          </p>
          <h3 className="m-0 mt-2 text-[1.15rem] font-extrabold tracking-tight text-[#07111f]">
            Find a guest quickly
          </h3>
          <p className="m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
            Search your guest list, open their profile, and redeem active deals
            without scanning a QR code.
          </p>

          <div className="relative mt-6 min-w-0">
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
              className="w-full rounded-full border border-[#dbeafe] bg-white py-3 pr-32 pl-11 text-[0.85rem] font-medium text-black shadow-[0_4px_14px_rgba(24,119,242,0.08)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
            />
            <button
              type="button"
              disabled={!query.trim() || searching}
              onClick={onSearch}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full bg-[#1877f2] px-4 py-2 text-[0.78rem] font-bold text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                "Search"
              )}
            </button>
          </div>
          <p className="m-0 mt-3 text-[0.72rem] font-medium text-slate-500">
            Type at least 2 characters, then search.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SEARCH_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-[1.1rem] border border-[#e8edf5] bg-white px-4 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02]"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dbeafe] bg-[#f4f8ff] text-[0.72rem] font-bold text-[#1877f2]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5 text-[#1877f2]" aria-hidden />
                    <p className="m-0 text-[0.82rem] font-bold text-[#07111f]">
                      {step.title}
                    </p>
                  </div>
                  <p className="m-0 mt-1 text-[0.72rem] leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
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

function DealPaymentBadge({ label }: { label: "PREPAID" | "UNPAID" }) {
  const isPrepaid = label === "PREPAID";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${
        isPrepaid ? "bg-emerald-600" : "bg-zinc-500"
      }`}
    >
      {label}
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
    isScannedCoupon: false,
    canSelect: deal.canSelect,
  };
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
        ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
        : "border-emerald-100 bg-emerald-50/50"
      : checked
        ? "border-zinc-400 bg-zinc-100 ring-1 ring-zinc-300"
        : "border-zinc-200 bg-zinc-50";

  return (
    <li>
      <button
        type="button"
        disabled={disabled || !deal.canSelect}
        onClick={onToggle}
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
          deal.canSelect ? "cursor-pointer hover:shadow-sm" : "cursor-not-allowed opacity-60"
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
            <DealPaymentBadge label={deal.paymentLabel} />
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
  const [showPreviousRedemptions, setShowPreviousRedemptions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDealIds, setSelectedDealIds] = useState<number[]>([]);
  const [redeemStep, setRedeemStep] = useState<
    null | "completeOrder" | "enterSubtotal"
  >(null);
  const [confirmingRedemption, setConfirmingRedemption] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<ScanRedemptionSuccess | null>(
    null,
  );
  const idempotencyKeyRef = useRef("");

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
    if (!deal.canSelect || confirmingRedemption) return;

    setSelectedDealIds((current) =>
      current.includes(deal.couponId)
        ? current.filter((id) => id !== deal.couponId)
        : [...current, deal.couponId],
    );
  }, [confirmingRedemption]);

  const selectedDeals = useMemo(
    () => activeDeals.filter((deal) => selectedDealIds.includes(deal.couponId)),
    [activeDeals, selectedDealIds],
  );

  const handleConfirmRedeem = useCallback(
    async (couponIds: number[], orderSubtotal?: number) => {
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
        );

        if (result.success) {
          idempotencyKeyRef.current = "";
          setRedeemStep(null);
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
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Redemption failed. Try again.",
        );
        setRedeemStep(null);
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
    !selectedProfile && activeQuery.length > 0 && (meta?.total ?? 0) > 0;
  const rowOffset = useMemo(
    () => ((meta?.page ?? page) - 1) * (meta?.limit ?? GUEST_SEARCH_PAGE_SIZE),
    [meta, page],
  );

  return (
    <>
      {selectedProfile && redeemStep === "completeOrder" ? (
        <ScanCompleteOrderDialog
          customerName={selectedProfile.customerName}
          selectedRewards={selectedDeals.map(toRedeemableReward)}
          confirming={false}
          onBack={() => setRedeemStep(null)}
          onContinue={() => {
            const hasUnpaid = selectedDeals.some(
              (deal) => deal.paymentLabel === "UNPAID",
            );
            if (hasUnpaid) {
              setRedeemStep("enterSubtotal");
              return;
            }
            void handleConfirmRedeem(selectedDealIds, 0);
          }}
          onDismiss={() => setRedeemStep(null)}
        />
      ) : null}

      {selectedProfile && redeemStep === "enterSubtotal" ? (
        <ScanOrderSubtotalDialog
          confirming={confirmingRedemption}
          requirePositiveAmount={selectedDeals.some(
            (deal) => deal.paymentLabel === "UNPAID",
          )}
          onBack={() => setRedeemStep("completeOrder")}
          onDone={(orderSubtotal) =>
            void handleConfirmRedeem(selectedDealIds, orderSubtotal)
          }
          onDismiss={() => setRedeemStep(null)}
        />
      ) : null}

    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {!selectedProfile && !loadingProfile ? (
        activeQuery.length === 0 && !searching ? (
          <SearchHeroCard
            query={query}
            searching={searching}
            onQueryChange={setQuery}
            onSearch={handleSearch}
          />
        ) : (
          <div className="mx-auto w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] p-5 shadow-[0_10px_28px_rgba(24,119,242,0.08)] ring-1 ring-black/[0.02]">
              <span
                className="pointer-events-none absolute -top-8 -right-6 size-28 rounded-full bg-[#1877f2]/10 blur-2xl"
                aria-hidden
              />
              <div className="relative min-w-0">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#1877f2]/70"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Name, email, or phone..."
                  className="w-full rounded-full border border-[#dbeafe] bg-white py-3 pr-32 pl-11 text-[0.85rem] font-medium text-black shadow-[0_4px_14px_rgba(24,119,242,0.08)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
                />
                <button
                  type="button"
                  disabled={!query.trim() || searching}
                  onClick={handleSearch}
                  className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full bg-[#1877f2] px-4 py-2 text-[0.78rem] font-bold text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      ) : null}

      {errorMessage && !showGuestNotFound ? (
        <div className="mx-auto w-full max-w-2xl rounded-[1.1rem] border border-[#fecaca] bg-gradient-to-b from-[#fef2f2] to-white px-4 py-3 text-sm text-[#dc2626] shadow-[0_6px_18px_rgba(239,68,68,0.08)]">
          {errorMessage}
        </div>
      ) : null}

      {loadingProfile ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-[1.35rem] border border-[#e8edf5] bg-white px-6 py-14 text-center shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <Loader2 className="size-10 animate-spin text-[#1877f2]" aria-hidden />
          <div>
            <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
              Loading guest
            </p>
            <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
              Fetching profile and active deals…
            </p>
          </div>
        </div>
      ) : null}

      {selectedProfile ? (
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02]">
          <div className="relative overflow-hidden border-b border-[#e8edf5] bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] px-5 py-5 sm:px-6">
            <span
              className="pointer-events-none absolute -top-8 -right-6 size-28 rounded-full bg-[#1877f2]/10 blur-2xl"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[1rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)]">
                  {guestInitials(selectedProfile.customerName)}
                </span>
                <div className="min-w-0">
                  <p className="m-0 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
                    <UserCheck className="size-3" aria-hidden />
                    Guest profile
                  </p>
                  <h2 className="m-0 mt-1 text-[1.2rem] font-extrabold tracking-tight text-[#07111f]">
                    {selectedProfile.customerName}
                  </h2>
                  <p className="m-0 mt-1 inline-flex items-center gap-2 text-[0.8rem] font-medium text-slate-600">
                    <Mail className="size-3.5 text-[#1877f2]/70" aria-hidden />
                    {selectedProfile.email}
                  </p>
                  {selectedProfile.phone ? (
                    <p className="m-0 mt-1 inline-flex items-center gap-2 text-[0.8rem] font-medium text-slate-600">
                      <Phone className="size-3.5 text-[#1877f2]/70" aria-hidden />
                      {selectedProfile.phone}
                    </p>
                  ) : null}
                </div>
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
                    idempotencyKeyRef.current = "";
                  }}
                  className="rounded-full border border-[#e8edf5] bg-white px-3.5 py-1.5 text-[0.78rem] font-bold text-slate-700 transition hover:border-[#dbeafe] hover:bg-[#f4f8ff] hover:text-[#1877f2]"
                >
                  Back to results
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDeleteGuest()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-[0.78rem] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  {deleting ? "Deleting…" : "Delete guest"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
          {redeemSuccess ? (
            <div className="mb-5 flex items-start gap-3 rounded-[1.1rem] border border-[#bbf7d0] bg-gradient-to-b from-[#f0fdf4] to-white px-4 py-4 shadow-[0_6px_18px_rgba(34,197,94,0.08)]">
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-emerald-900">
                  Redeemed successfully
                </p>
                <p className="mt-0.5 text-sm text-emerald-800">
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

          <div className="border-t border-[#f1f5f9] pt-5 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-slate-700" aria-hidden />
                <h3 className="text-sm font-semibold text-slate-800">Deals</h3>
              </div>
              {activeDeals.some((deal) => deal.canSelect) ? (
                <p className="text-xs text-slate-700">
                  Select deals to redeem, then continue.
                </p>
              ) : null}
            </div>

            {activeDeals.length === 0 ? (
              <p className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-slate-700">
                No active deals for this guest at this restaurant.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Paid ({prepaidDeals.length})
                  </p>
                  {prepaidDeals.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {prepaidDeals.map((deal) => (
                        <DealSelectRow
                          key={deal.couponId}
                          deal={deal}
                          checked={selectedDealIds.includes(deal.couponId)}
                          disabled={confirmingRedemption}
                          tone="prepaid"
                          onToggle={() => toggleDealSelection(deal)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">No paid deals.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Not paid yet ({unpaidDeals.length})
                  </p>
                  {unpaidDeals.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {unpaidDeals.map((deal) => (
                        <DealSelectRow
                          key={deal.couponId}
                          deal={deal}
                          checked={selectedDealIds.includes(deal.couponId)}
                          disabled={confirmingRedemption}
                          tone="unpaid"
                          onToggle={() => toggleDealSelection(deal)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">
                      No unpaid deals.
                    </p>
                  )}
                </div>

                {selectedDealIds.length > 0 ? (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={confirmingRedemption}
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
          </div>

          {selectedProfile.previouslyRedeemedCount > 0 ? (
            <div className="mt-5 border-t border-[#f1f5f9] pt-5">
              <button
                type="button"
                onClick={() =>
                  setShowPreviousRedemptions((current) => !current)
                }
                className="rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.78rem] font-bold text-slate-700 transition hover:border-[#dbeafe] hover:bg-[#f4f8ff] hover:text-[#1877f2]"
              >
                Show {selectedProfile.previouslyRedeemedCount} previously
                redeemed reward
                {selectedProfile.previouslyRedeemedCount === 1 ? "" : "s"}
              </button>

              {showPreviousRedemptions ? (
                <ul className="mt-3 space-y-2 rounded-[1.1rem] border border-[#e8edf5] bg-[#f8fafc]/60 p-3 text-sm text-slate-700">
                  {selectedProfile.previousRedemptions.map((item, index) => (
                    <li key={`${item.campaignName}-${item.redeemedAt}-${index}`}>
                      <span className="font-bold text-[#07111f]">
                        {item.campaignName}
                      </span>
                      {item.redeemedAt ? (
                        <span className="text-slate-600">
                          {" "}
                         , {formatDateTimeShort(item.redeemedAt)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          </div>
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

      {showTable ? (
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02]">
          <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden border-b border-[#e8edf5] bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] px-4 py-4 sm:px-5">
            <span
              className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-[#1877f2]/10 blur-2xl"
              aria-hidden
            />
            <div className="relative">
              <p className="m-0 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
                <Sparkles className="size-3" aria-hidden />
                Search results
              </p>
              <h3 className="m-0 mt-1 text-[1rem] font-extrabold text-[#07111f]">
                {meta?.total ?? 0} guest{(meta?.total ?? 0) === 1 ? "" : "s"} found
              </h3>
              <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                Tap a guest to view their profile and deals
              </p>
            </div>
            <span className="relative rounded-full bg-[#1877f2] px-3 py-1.5 text-[0.72rem] font-bold tabular-nums text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]">
              {meta?.total ?? 0} found
            </span>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr className="border-b border-[#e8edf5] bg-[#f8fafc]/60">
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
                <th className={`${thClass} w-16 text-right`}>
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {searching && results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <Loader2
                      className="mx-auto size-6 animate-spin text-zinc-400"
                      aria-hidden
                    />
                    <p className="mt-3 text-sm text-slate-700">Searching guests…</p>
                  </td>
                </tr>
              ) : null}

              {!searching || results.length > 0
                ? results.map((guest, index) => {
                    const rowNumber = rowOffset + index + 1;
                    const displayName = guest.name?.trim() || "Guest";
                    const initials = guestInitials(displayName);

                    return (
                      <tr
                        key={guest.id}
                        className="group cursor-pointer border-b border-[#f1f5f9] transition-colors duration-150 last:border-0 hover:bg-[#e8f2ff]/70"
                        onClick={() => void handleSelectGuest(guest)}
                      >
                        <td className={tdClass}>
                          <span className="text-xs font-medium tabular-nums text-zinc-400">
                            {rowNumber}
                          </span>
                        </td>
                        <td className={tdClass}>
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0d5bb8] text-[0.72rem] font-bold text-white"
                            >
                              {initials}
                            </span>
                            <span className="truncate font-bold text-black">
                              {displayName}
                            </span>
                          </div>
                        </td>
                        <td className={`${tdClass} max-w-[12rem] sm:max-w-xs`}>
                          <span className="inline-flex min-w-0 items-center gap-2 text-slate-600">
                            <Mail
                              className="size-3.5 shrink-0 text-zinc-400"
                              aria-hidden
                            />
                            <span className="truncate" title={guest.email}>
                              {guest.email}
                            </span>
                          </span>
                        </td>
                        <td className={tdClass}>
                          {guest.phone?.trim() ? (
                            <span className="inline-flex items-center gap-2 text-slate-600">
                              <Phone
                                className="size-3.5 shrink-0 text-zinc-400"
                                aria-hidden
                              />
                              {guest.phone}
                            </span>
                          ) : (
                            <span className="text-zinc-300">N/A</span>
                          )}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <span className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition group-hover:text-[#1877f2]">
                            <ChevronRight className="size-4" aria-hidden />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="border-t border-[#e8edf5] px-4 py-3 sm:px-5">
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
        </div>
      ) : null}
    </div>
    </>
  );
}
