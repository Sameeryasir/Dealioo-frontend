"use client";

import { CheckCircle2, Gift, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { formatDollars } from "@/app/lib/money";
import { createCustomer } from "@/app/services/customer/create-customer";
import {
  fetchFunnelsByRestaurant,
  type RestaurantFunnelDeal,
} from "@/app/services/funnel/get-funnels-by-business";
import {
  purchaseScannerDeals,
  type ScannerPurchasedDeal,
} from "@/app/services/funnel/purchase-scanner-deals";

function formatDealPrice(price: number | string | null): string | null {
  if (price == null || price === "") return null;
  const numeric = typeof price === "number" ? price : Number.parseFloat(price);
  if (!Number.isFinite(numeric)) return null;
  return formatDollars(numeric);
}

function DealCheckboxRow({
  deal,
  checked,
  disabled,
  onToggle,
}: {
  deal: RestaurantFunnelDeal;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const priceLabel = formatDealPrice(deal.price);

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-sm"
        } ${
          checked
            ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-300"
            : "border-zinc-200 bg-white"
        }`}
      >
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
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-slate-800">{deal.campaignName}</span>
          {priceLabel ? (
            <span className="mt-1 block text-xs font-medium text-emerald-700">
              {priceLabel}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

export function ScannerCreateGuestPanel({
  businessId,
}: {
  businessId: number;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdGuestId, setCreatedGuestId] = useState<number | null>(null);
  const [createdGuestName, setCreatedGuestName] = useState("");
  const [deals, setDeals] = useState<RestaurantFunnelDeal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [selectedFunnelIds, setSelectedFunnelIds] = useState<number[]>([]);
  const [purchaseStep, setPurchaseStep] = useState<null | "enterPrice">(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<
    ScannerPurchasedDeal[] | null
  >(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setErrorMessage(null);
    setCreatedGuestId(null);
    setCreatedGuestName("");
    setDeals([]);
    setSelectedFunnelIds([]);
    setPurchaseStep(null);
    setPurchaseSuccess(null);
  };

  const loadDeals = useCallback(async () => {
    setLoadingDeals(true);
    setErrorMessage(null);

    try {
      const rows = await fetchFunnelsByRestaurant(businessId);
      setDeals(rows);
      if (rows.length === 0) {
        setErrorMessage("No deals are set up for this restaurant yet.");
      }
    } catch (err) {
      setDeals([]);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load deals.",
      );
    } finally {
      setLoadingDeals(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (createdGuestId == null) return;
    void loadDeals();
  }, [createdGuestId, loadDeals]);

  const toggleDealSelection = (funnelId: number) => {
    if (purchasing) return;
    setSelectedFunnelIds((current) =>
      current.includes(funnelId)
        ? current.filter((id) => id !== funnelId)
        : [...current, funnelId],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setCreatedGuestId(null);
    setPurchaseSuccess(null);

    try {
      const result = await createCustomer({ name, email, phone });
      setCreatedGuestId(result.id);
      setCreatedGuestName(name.trim());
      setName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not create guest.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchase = async (orderSubtotal: number) => {
    if (createdGuestId == null || selectedFunnelIds.length === 0) return;

    setPurchasing(true);
    setErrorMessage(null);

    try {
      const purchased = await purchaseScannerDeals({
        businessId,
        customerId: createdGuestId,
        funnelIds: selectedFunnelIds,
        orderSubtotal,
      });
      setPurchaseStep(null);
      setSelectedFunnelIds([]);
      setPurchaseSuccess(purchased);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not complete purchase.",
      );
      setPurchaseStep(null);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <>
      {createdGuestId != null && purchaseStep === "enterPrice" ? (
        <ScanOrderSubtotalDialog
          confirming={purchasing}
          requirePositiveAmount
          onBack={() => setPurchaseStep(null)}
          onDone={(orderSubtotal) => void handlePurchase(orderSubtotal)}
          onDismiss={() => setPurchaseStep(null)}
        />
      ) : null}

      <div
        className={`flex min-h-0 w-full flex-1 flex-col ${
          !createdGuestId && !purchaseSuccess ? "mx-auto max-w-lg" : "max-w-xl"
        }`}
      >
        {purchaseSuccess ? (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="font-semibold text-emerald-900">Purchase recorded</p>
                <p className="mt-1 text-sm text-emerald-800">
                  {createdGuestName || "Guest"} bought{" "}
                  {purchaseSuccess.length === 1
                    ? purchaseSuccess[0].campaignName
                    : `${purchaseSuccess.length} deals`}
                  .
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="self-start cursor-pointer rounded-full bg-[#1877f2] px-4 py-2 text-[0.82rem] font-bold text-white transition hover:bg-[#166fe5]"
            >
              Create another guest
            </button>
          </div>
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="font-semibold text-slate-800">Guest created</p>
            <p className="mt-1 text-sm text-slate-700">
              {createdGuestName || "Guest"}, ID #{createdGuestId}
            </p>
          </div>
        ) : null}

        {!createdGuestId && !purchaseSuccess ? (
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="space-y-4 rounded-[1.1rem] border border-[#e8edf5] bg-[#f8fafc]/60 p-5 sm:p-6"
          >
            <div>
              <label
                htmlFor="guest-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="guest-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
                placeholder="Jane Doe"
                className="w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-[0.82rem] font-medium text-black outline-none transition focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
              />
            </div>

            <div>
              <label
                htmlFor="guest-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="jane@email.com"
                className="w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-[0.82rem] font-medium text-black outline-none transition focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
              />
            </div>

            <div>
              <label
                htmlFor="guest-phone"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Phone
              </label>
              <input
                id="guest-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                autoComplete="tel"
                placeholder="(555) 123-4567"
                className="w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-2.5 text-[0.82rem] font-medium text-black outline-none transition focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create guest"}
            </button>
          </form>
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className="border-t border-zinc-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Gift className="size-4 text-slate-700" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-800">Select deals to buy</h3>
            </div>

            {loadingDeals ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-10 text-sm text-slate-700">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading deals…
              </div>
            ) : null}

            {!loadingDeals && deals.length > 0 ? (
              <>
                <ul className="space-y-2">
                  {deals.map((deal) => (
                    <DealCheckboxRow
                      key={deal.id}
                      deal={deal}
                      checked={selectedFunnelIds.includes(deal.id)}
                      disabled={purchasing}
                      onToggle={() => toggleDealSelection(deal.id)}
                    />
                  ))}
                </ul>

                {selectedFunnelIds.length > 0 ? (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={purchasing}
                      onClick={() => setPurchaseStep("enterPrice")}
                      className="cursor-pointer rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:opacity-50"
                    >
                      Continue ({selectedFunnelIds.length} selected)
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}

            {!loadingDeals && deals.length === 0 && !errorMessage ? (
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-slate-700">
                No deals available for this restaurant.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
