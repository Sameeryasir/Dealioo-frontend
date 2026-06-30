"use client";

import {
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  Mail,
  Phone,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { GuestNotInDatabasePanel } from "@/app/components/restaurant/GuestNotInDatabasePanel";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { ReportTable } from "@/app/components/shared/ReportTable";
import { TableColumnHeader } from "@/app/components/TableColumnHeader";
import { ScanCompleteOrderDialog } from "@/app/components/restaurant/ScanCompleteOrderDialog";
import { ScanOrderSubtotalDialog } from "@/app/components/restaurant/ScanOrderSubtotalDialog";
import { formatDateTimeShort } from "@/app/lib/datetime";
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
  "whitespace-nowrap px-4 py-3.5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-zinc-500 first:pl-6 last:pr-6";
const tdClass =
  "px-4 py-4 text-left align-middle text-sm text-zinc-700 first:pl-6 last:pr-6";

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
] as const;

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function guestAvatarColor(seed: number): string {
  return AVATAR_COLORS[Math.abs(seed) % AVATAR_COLORS.length];
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
            <span className="font-medium text-zinc-900">{deal.offerName}</span>
            <DealPaymentBadge label={deal.paymentLabel} />
          </span>
          <span className="mt-1 block text-xs text-zinc-500">
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
  restaurantId,
  onCreateGuest,
}: {
  restaurantId: number;
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
        const profile = await getGuestProfile(restaurantId, guest.id);
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
    [restaurantId, activeQuery],
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
          restaurantId,
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
            restaurantId,
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
    [activeDeals, restaurantId, selectedProfile],
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

    <div className="flex flex-col gap-4">
      {!selectedProfile && !loadingProfile ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700">
            <Search className="size-4" aria-hidden />
            Search by name, email, or phone
          </p>
          <div className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="e.g. Jane Doe or jane@email.com"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />
            <button
              type="button"
              disabled={!query.trim() || searching}
              onClick={handleSearch}
              className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Type at least 2 characters, then search.
          </p>
        </div>
      ) : null}

      {errorMessage && !showGuestNotFound ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {loadingProfile ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-12 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading guest…
        </div>
      ) : null}

      {selectedProfile ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                {selectedProfile.customerName}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedProfile.email}
              </p>
              {selectedProfile.phone ? (
                <p className="text-sm text-zinc-500">{selectedProfile.phone}</p>
              ) : null}
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
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Back to results
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteGuest()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {deleting ? "Deleting…" : "Delete guest"}
              </button>
            </div>
          </div>

          {redeemSuccess ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-900">
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
                className="shrink-0 text-xs font-medium text-emerald-700 hover:text-emerald-900"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <div className="mt-5 border-t border-zinc-100 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-zinc-500" aria-hidden />
                <h3 className="text-sm font-semibold text-zinc-900">Deals</h3>
              </div>
              {activeDeals.some((deal) => deal.canSelect) ? (
                <p className="text-xs text-zinc-500">
                  Select deals to redeem, then continue.
                </p>
              ) : null}
            </div>

            {activeDeals.length === 0 ? (
              <p className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
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
                    <p className="mt-2 text-sm text-zinc-500">No paid deals.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                    <p className="mt-2 text-sm text-zinc-500">
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
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
            <div className="mt-5">
              <button
                type="button"
                onClick={() =>
                  setShowPreviousRedemptions((current) => !current)
                }
                className="rounded-lg border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                Show {selectedProfile.previouslyRedeemedCount} previously
                redeemed reward
                {selectedProfile.previouslyRedeemedCount === 1 ? "" : "s"}
              </button>

              {showPreviousRedemptions ? (
                <ul className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                  {selectedProfile.previousRedemptions.map((item, index) => (
                    <li key={`${item.campaignName}-${item.redeemedAt}-${index}`}>
                      <span className="font-medium text-zinc-900">
                        {item.campaignName}
                      </span>
                      {item.redeemedAt ? (
                        <span className="text-zinc-500">
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
        <ReportTable
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          header={
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                  <Users className="size-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    Search results
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Tap a guest to view their profile
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold tabular-nums text-white">
                {meta?.total ?? 0} found
              </span>
            </div>
          }
          footer={
            meta && meta.totalPages > 1 ? (
              <OffsetPagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                loading={searching}
                onPageChange={handlePageChange}
                itemLabel="guests"
              />
            ) : null
          }
        >
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90">
                <th className={`${thClass} w-12`}>
                  <TableColumnHeader
                    label="#"
                    iconClassName="text-zinc-400"
                    labelClassName="text-zinc-500"
                  />
                </th>
                <th className={thClass}>
                  <TableColumnHeader
                    icon={UserRound}
                    label="Guest"
                    iconClassName="text-zinc-400"
                    labelClassName="text-zinc-500"
                  />
                </th>
                <th className={thClass}>
                  <TableColumnHeader
                    icon={Mail}
                    label="Email"
                    iconClassName="text-zinc-400"
                    labelClassName="text-zinc-500"
                  />
                </th>
                <th className={thClass}>
                  <TableColumnHeader
                    icon={Phone}
                    label="Phone"
                    iconClassName="text-zinc-400"
                    labelClassName="text-zinc-500"
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
                    <p className="mt-3 text-sm text-zinc-500">Searching guests…</p>
                  </td>
                </tr>
              ) : null}

              {!searching || results.length > 0
                ? results.map((guest, index) => {
                    const rowNumber = rowOffset + index + 1;
                    const displayName = guest.name?.trim() || "Guest";
                    const initials = guestInitials(displayName);
                    const avatarColor = guestAvatarColor(guest.id * 13 + index * 7);

                    return (
                      <tr
                        key={guest.id}
                        className={`group cursor-pointer border-b border-zinc-100 transition-all duration-150 last:border-0 hover:bg-zinc-50 hover:shadow-[inset_3px_0_0_0_rgb(24_24_27)] ${
                          index % 2 === 1 ? "bg-zinc-50/50" : "bg-white"
                        }`}
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
                              className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-xs font-semibold text-white shadow-sm ring-2 ring-white`}
                            >
                              {initials}
                            </span>
                            <span className="truncate font-semibold text-zinc-900">
                              {displayName}
                            </span>
                          </div>
                        </td>
                        <td className={`${tdClass} max-w-[12rem] sm:max-w-xs`}>
                          <span className="inline-flex min-w-0 items-center gap-2 text-zinc-600">
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
                            <span className="inline-flex items-center gap-2 text-zinc-600">
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
                          <span className="inline-flex size-8 items-center justify-center rounded-full text-zinc-300 transition group-hover:bg-zinc-900 group-hover:text-white">
                            <ChevronRight className="size-4" aria-hidden />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </ReportTable>
      ) : null}
    </div>
    </>
  );
}
