"use client";

import { CheckCircle2, Gift, Loader2, Sparkles, UserCheck, UserPlus, Wallet } from "lucide-react";
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
            ? "border-[#1877f2]/35 bg-[#f4f8ff] ring-1 ring-[#1877f2]/20"
            : "border-[#e8edf5] bg-white hover:border-[#dbeafe]"
        }`}
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
            checked
              ? "border-[#1877f2] bg-[#1877f2] text-xs text-white"
              : "border-zinc-300 bg-white"
          }`}
          aria-hidden
        >
          {checked ? "✓" : ""}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[#07111f]">{deal.campaignName}</span>
          {priceLabel ? (
            <span className="mt-1 block text-xs font-semibold text-emerald-700">
              {priceLabel}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

const CREATE_STEPS = [
  {
    icon: UserPlus,
    title: "Create profile",
    description: "Add name, email, and phone at the counter.",
  },
  {
    icon: Gift,
    title: "Pick deals",
    description: "Choose which offers to attach to the guest.",
  },
  {
    icon: Wallet,
    title: "Complete purchase",
    description: "Record payment and finish the order.",
  },
] as const;

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
          !createdGuestId && !purchaseSuccess ? "mx-auto max-w-2xl" : "mx-auto max-w-2xl"
        }`}
      >
        {purchaseSuccess ? (
          <div className="flex flex-col items-center gap-4 rounded-[1.35rem] border border-[#bbf7d0] bg-gradient-to-b from-[#f0fdf4] to-white px-6 py-8 text-center shadow-[0_10px_28px_rgba(34,197,94,0.08)]">
            <div className="flex size-16 items-center justify-center rounded-full bg-white ring-1 ring-[#bbf7d0]/80 shadow-sm">
              <CheckCircle2 className="size-10 text-[#22c55e]" aria-hidden />
            </div>
            <div>
              <p className="m-0 text-[1.05rem] font-extrabold text-[#07111f]">
                Purchase recorded
              </p>
              <p className="m-0 mt-1 text-[0.82rem] text-slate-600">
                {createdGuestName || "Guest"} bought{" "}
                {purchaseSuccess.length === 1
                  ? purchaseSuccess[0].campaignName
                  : `${purchaseSuccess.length} deals`}
                .
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer rounded-full bg-[#1877f2] px-6 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
            >
              Create another guest
            </button>
          </div>
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className="mb-5 overflow-hidden rounded-[1.35rem] border border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] via-white to-[#f8fafc] shadow-[0_10px_28px_rgba(34,197,94,0.08)] ring-1 ring-black/[0.02]">
            <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#bbf7d0]/80 shadow-sm">
                <CheckCircle2 className="size-6 text-[#22c55e]" aria-hidden />
              </span>
              <div>
                <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Profile created
                </p>
                <p className="m-0 mt-1 text-[1rem] font-extrabold text-[#07111f]">
                  {createdGuestName || "Guest"}
                </p>
                <p className="m-0 mt-0.5 text-[0.78rem] font-medium text-slate-500">
                  Guest ID #{createdGuestId} · Now attach deals below
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!createdGuestId && !purchaseSuccess ? (
          <div className="flex flex-col gap-5">
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
                  New guest
                </p>
                <h3 className="m-0 mt-2 text-[1.15rem] font-extrabold tracking-tight text-[#07111f]">
                  Create a guest profile
                </h3>
                <p className="m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
                  Add their details at the counter, then attach deals and
                  complete the purchase in one flow.
                </p>

                <form
                  onSubmit={(event) => void handleSubmit(event)}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="guest-name"
                      className="mb-1.5 block text-[0.78rem] font-bold text-slate-700"
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
                      className="w-full rounded-full border border-[#dbeafe] bg-white px-4 py-3 text-[0.85rem] font-medium text-black shadow-[0_4px_14px_rgba(24,119,242,0.06)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-email"
                      className="mb-1.5 block text-[0.78rem] font-bold text-slate-700"
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
                      className="w-full rounded-full border border-[#dbeafe] bg-white px-4 py-3 text-[0.85rem] font-medium text-black shadow-[0_4px_14px_rgba(24,119,242,0.06)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-phone"
                      className="mb-1.5 block text-[0.78rem] font-bold text-slate-700"
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
                      className="w-full rounded-full border border-[#dbeafe] bg-white px-4 py-3 text-[0.85rem] font-medium text-black shadow-[0_4px_14px_rgba(24,119,242,0.06)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15"
                    />
                  </div>

                  {errorMessage ? (
                    <p className="rounded-[1.1rem] border border-[#fecaca] bg-gradient-to-b from-[#fef2f2] to-white px-4 py-3 text-sm text-[#dc2626]">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full cursor-pointer rounded-full bg-[#1877f2] px-4 py-3 text-[0.85rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:opacity-50"
                  >
                    {submitting ? "Creating…" : "Create guest"}
                  </button>
                </form>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {CREATE_STEPS.map((step, index) => {
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
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className="overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02]">
            <div className="border-b border-[#e8edf5] bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-[#1877f2]" aria-hidden />
                <div>
                  <h3 className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
                    Select deals to buy
                  </h3>
                  <p className="m-0 mt-0.5 text-[0.72rem] font-medium text-slate-500">
                    Choose one or more offers to attach to this guest
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
            {loadingDeals ? (
              <div className="flex flex-col items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-[#f8fafc]/60 py-12 text-center">
                <Loader2 className="size-8 animate-spin text-[#1877f2]" aria-hidden />
                <p className="m-0 text-[0.82rem] font-medium text-slate-600">
                  Loading available deals…
                </p>
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
                  <div className="mt-5 flex justify-end border-t border-[#f1f5f9] pt-5">
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
              <p className="rounded-[1.1rem] border border-[#e8edf5] bg-[#f8fafc]/60 px-4 py-4 text-[0.82rem] font-medium text-slate-600">
                No deals available for this restaurant.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="mt-3 rounded-[1.1rem] border border-[#fecaca] bg-gradient-to-b from-[#fef2f2] to-white px-4 py-3 text-sm text-[#dc2626]">
                {errorMessage}
              </p>
            ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
