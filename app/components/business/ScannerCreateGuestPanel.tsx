"use client";

import {
  CheckCircle2,
  Gift,
  Loader2,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { formatDollars } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
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
        className={`flex w-full items-start gap-3 rounded-[1rem] border px-4 py-3.5 text-left transition ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-[#f8fafc]"
        } ${
          checked
            ? "border-[#1877f2]/35 bg-[#f4f8ff] ring-1 ring-[#1877f2]/20"
            : "border-[#e8edf5] bg-white hover:border-[#dbeafe]"
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
          <span className="block font-bold text-[#0e182b]">
            {deal.campaignName}
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

const inputClassName =
  "w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-[0.84rem] font-medium text-[#0e182b] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15";

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
  const purchaseIdempotencyKeyRef = useRef("");

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
    setPendingDealAmount(null);
    setPurchaseSuccess(null);
    purchaseIdempotencyKeyRef.current = "";
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
      const result = await createCustomer({
        name,
        email,
        phone,
        rejectDuplicateEmail: true,
        businessId,
      });
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

  const handlePurchase = async (
    orderSubtotal: number,
    extraItemsAmount = 0,
  ) => {
    if (createdGuestId == null || selectedFunnelIds.length === 0) return;

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
        customerId: createdGuestId,
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
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not complete purchase.",
      );
      setPurchaseStep(null);
      setPendingDealAmount(null);
    } finally {
      setPurchasing(false);
    }
  };

  const selectedDeals = deals.filter((deal) =>
    selectedFunnelIds.includes(deal.id),
  );

  const expectedPurchaseAmount = (() => {
    if (selectedDeals.length === 0) return null;
    let total = 0;
    for (const deal of selectedDeals) {
      if (deal.price == null || deal.price === "") return null;
      const price =
        typeof deal.price === "number"
          ? deal.price
          : Number.parseFloat(String(deal.price));
      if (!Number.isFinite(price) || price < 0) return null;
      total += price;
    }
    return Math.round(total * 100) / 100;
  })();

  return (
    <>
      {createdGuestId != null && purchaseStep === "confirm" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => setPurchaseStep(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-create-purchase-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="confirm-create-purchase-title"
              className="text-2xl font-semibold tracking-tight text-zinc-900"
            >
              Are you sure you want to proceed?
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-600">
              You are about to charge this guest for the selected deal
              {selectedDeals.length === 1 ? "" : "s"}. No payment is created
              until you continue and complete the amount steps.
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
                {selectedDeals.map((deal) => {
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

      {createdGuestId != null && purchaseStep === "enterPrice" ? (
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

      {createdGuestId != null &&
      purchaseStep === "enterExtra" &&
      pendingDealAmount != null ? (
        <ScanOrderSubtotalDialog
          confirming={purchasing}
          extraPurchaseMode
          onBack={() => setPurchaseStep("enterPrice")}
          onDone={(extraItemsAmount) =>
            void handlePurchase(pendingDealAmount, extraItemsAmount)
          }
          onDismiss={() => {
            setPurchaseStep(null);
            setPendingDealAmount(null);
          }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-2xl pb-6">
        {purchaseSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: standardEase }}
            className="overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]"
          >
            <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
                  Purchase complete
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#f0fdf4] text-emerald-600 ring-1 ring-[#bbf7d0]">
                <CheckCircle2 className="size-7" aria-hidden />
              </span>
              <div>
                <p className="m-0 text-[1.15rem] font-extrabold tracking-tight text-[#0e182b]">
                  Purchase recorded
                </p>
                <p className="m-0 mt-1.5 max-w-sm text-[0.8rem] font-medium text-slate-500">
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
                className="cursor-pointer rounded-full bg-[#1877f2] px-6 py-2.5 text-[0.82rem] font-bold text-white transition hover:bg-[#166fe5]"
              >
                Create another guest
              </button>
            </div>
          </motion.div>
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className="mb-4 overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]">
            <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
                  Profile created
                </p>
              </div>
              <p className="m-0 hidden text-[0.7rem] font-medium text-white/50 sm:block">
                Guest #{createdGuestId}
              </p>
            </div>
            <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-white">
                <CheckCircle2 className="size-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                  <Sparkles className="size-3" aria-hidden />
                  Ready for deals
                </p>
                <p className="m-0 mt-2 text-[1.05rem] font-extrabold text-[#0e182b]">
                  {createdGuestName || "Guest"}
                </p>
                <p className="m-0 mt-0.5 text-[0.78rem] font-medium text-slate-500">
                  Attach deals below to complete the purchase.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {!createdGuestId && !purchaseSuccess ? (
          <div className="flex flex-col gap-3.5">
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
                    New guest
                  </p>
                </div>
                <p className="m-0 hidden text-[0.7rem] font-medium text-white/50 sm:block">
                  Counter create mode
                </p>
              </div>

              <div className="px-5 py-5 sm:px-7 sm:py-6">
                <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                  <Sparkles className="size-3" aria-hidden />
                  Ready to create
                </p>
                <h3 className="m-0 mt-2 text-[1.15rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.25rem]">
                  Create a guest profile
                </h3>
                <p className="m-0 mt-1 max-w-md text-[0.78rem] font-medium leading-relaxed text-slate-500">
                  Add their details at the counter, then attach deals and
                  complete the purchase in one flow.
                </p>

                <form
                  onSubmit={(event) => void handleSubmit(event)}
                  className="mt-5 space-y-3.5"
                >
                  <div>
                    <label
                      htmlFor="guest-name"
                      className="mb-1.5 block text-[0.72rem] font-bold text-slate-600"
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
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-email"
                      className="mb-1.5 block text-[0.72rem] font-bold text-slate-600"
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
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-phone"
                      className="mb-1.5 block text-[0.72rem] font-bold text-slate-600"
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
                      className={inputClassName}
                    />
                  </div>

                  {errorMessage ? (
                    <p className="rounded-[1.1rem] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-[0.84rem] font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      "Create guest"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {CREATE_STEPS.map((step, index) => {
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
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]">
            <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
                  Attach deals
                </p>
              </div>
              <p className="m-0 hidden text-[0.7rem] font-medium text-white/50 sm:block">
                Step 2 of 3
              </p>
            </div>

            <div className="border-b border-[#e8edf5] px-5 py-4 sm:px-6">
              <div className="flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white">
                  <Gift className="size-4" aria-hidden />
                </span>
                <div>
                  <h3 className="m-0 text-[0.95rem] font-extrabold text-[#0e182b]">
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
                <div className="flex flex-col items-center gap-3 rounded-[1.1rem] border border-[#e8edf5] bg-[#f8fafc] py-12 text-center">
                  <Loader2
                    className="size-8 animate-spin text-[#1877f2]"
                    aria-hidden
                  />
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
                    <div className="mt-5 flex justify-end border-t border-[#e8edf5] pt-5">
                      <button
                        type="button"
                        disabled={purchasing || expectedPurchaseAmount == null}
                        onClick={() => setPurchaseStep("confirm")}
                        className="cursor-pointer rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.82rem] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
                      >
                        Confirm ({selectedFunnelIds.length} selected)
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}

              {!loadingDeals && deals.length === 0 && !errorMessage ? (
                <p className="rounded-[1.1rem] border border-dashed border-[#dbe3ef] bg-[#f8fafc] px-4 py-5 text-center text-[0.8rem] font-semibold text-slate-600">
                  No deals available for this restaurant.
                </p>
              ) : null}

              {errorMessage ? (
                <p className="mt-3 rounded-[1.1rem] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
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
