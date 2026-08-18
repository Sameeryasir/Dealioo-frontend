"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  CreditCard,
  Gift,
  IdCard,
  Loader2,
  Mail,
  Megaphone,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { formatDollars } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
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

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
  const imageSrc = resolveUploadImageUrl(deal.imageUrl);

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex w-full items-start gap-3 rounded-[1.1rem] border px-4 py-3.5 text-left transition ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-[#f8fafc]"
        } ${
          checked
            ? "border-[#1877f2]/45 bg-[#f4f8ff] ring-1 ring-[#1877f2]/15"
            : "border-[#e8edf5] bg-white hover:border-[#dbeafe]"
        }`}
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
            checked
              ? "border-[#1877f2] bg-[#1877f2] text-white"
              : "border-[#cbd5e1] bg-white"
          }`}
          aria-hidden
        >
          {checked ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe]">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Megaphone className="size-4" strokeWidth={2.15} aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold text-[#0e182b]">
            {deal.campaignName}
          </span>
          <span className="mt-0.5 block text-[0.76rem] font-medium text-slate-500">
            Special offer for guests
          </span>
          {priceLabel ? (
            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.72rem] font-bold text-emerald-700 ring-1 ring-emerald-100">
              {priceLabel}
            </span>
          ) : null}
          {deal.campaignType === "postpaid" ? (
            <span className="mt-2 ml-1.5 inline-flex rounded-full bg-[#eef1f5] px-2.5 py-0.5 text-[0.72rem] font-bold text-[#4b5563] ring-1 ring-[#e5e7eb]">
              Postpaid
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
    iconWrap: "bg-[#e8f1ff] text-[#1877f2] ring-[#dbeafe]",
    stepWrap: "bg-[#1877f2] text-white",
  },
  {
    icon: Briefcase,
    title: "Pick deals",
    description: "Choose which offers to attach to the guest.",
    iconWrap: "bg-[#ecfdf5] text-[#059669] ring-[#a7f3d0]",
    stepWrap: "bg-[#10b981] text-white",
  },
  {
    icon: CreditCard,
    title: "Complete purchase",
    description: "Record payment and finish the order.",
    iconWrap: "bg-[#f3e8ff] text-[#7e22ce] ring-[#e9d5ff]",
    stepWrap: "bg-[#9333ea] text-white",
  },
] as const;

const CREATE_FIELDS = [
  {
    id: "guest-name" as const,
    label: "Name",
    hint: "Full name of the guest",
    placeholder: "Jane Doe",
    type: "text" as const,
    autoComplete: "name",
    icon: UserRound,
  },
  {
    id: "guest-email" as const,
    label: "Email",
    hint: "Guest email address",
    placeholder: "jane@email.com",
    type: "email" as const,
    autoComplete: "email",
    icon: Mail,
  },
  {
    id: "guest-phone" as const,
    label: "Phone",
    hint: "Guest phone number",
    placeholder: "(555) 123-4567",
    type: "tel" as const,
    autoComplete: "tel",
    icon: Phone,
  },
] as const;

const inputClassName =
  "w-full rounded-full border border-[#e2e8f0] bg-white py-3 px-4 text-[0.88rem] font-medium text-[#0e182b] shadow-[0_6px_18px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-2 focus:ring-[#1877f2]/15";

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
    const deal = deals.find((row) => row.id === funnelId);
    if (deal && deal.campaignType !== "postpaid") {
      setSelectedFunnelIds([funnelId]);
      setPendingDealAmount(null);
      setPurchaseStep("enterPrice");
      return;
    }
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

  const attachingPostpaidOnly =
    selectedDeals.length > 0 &&
    selectedDeals.every((deal) => deal.campaignType === "postpaid");

  const expectedPurchaseAmount = (() => {
    if (selectedDeals.length === 0) return null;

    let total = 0;
    let pricedCount = 0;

    for (const deal of selectedDeals) {
      if (deal.price == null || deal.price === "") {
        if (deal.campaignType === "postpaid") continue;
        return null;
      }
      const price =
        typeof deal.price === "number"
          ? deal.price
          : Number.parseFloat(String(deal.price));
      if (!Number.isFinite(price) || price < 0) {
        if (deal.campaignType === "postpaid") continue;
        return null;
      }
      pricedCount += 1;
      total += price;
    }

    if (pricedCount === 0) return null;
    return Math.round(total * 100) / 100;
  })();

  const canConfirmDeals =
    selectedDeals.length > 0 &&
    (expectedPurchaseAmount != null || attachingPostpaidOnly);

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
              {`You are about to charge this guest for the selected deal${selectedDeals.length === 1 ? "" : "s"}. No payment is created until you continue and complete the amount steps.`}
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
                        {priceLabel ??
                          (deal.campaignType === "postpaid" ? "Postpaid" : "—")}
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
                disabled={!canConfirmDeals || purchasing}
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
            setPurchaseStep(null);
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

      <div className="mx-auto w-full max-w-5xl pb-6">
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
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: standardEase }}
              className="overflow-hidden rounded-[1.5rem] border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] px-5 py-3 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#0e182b]">
                    Profile created
                  </p>
                </div>
                <p className="m-0 text-[0.72rem] font-bold text-slate-400">
                  Guest #{createdGuestId}
                </p>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="relative shrink-0">
                    <span className="flex size-16 items-center justify-center rounded-full bg-[#1877f2] text-[1.05rem] font-extrabold text-white shadow-[0_10px_24px_rgba(24,119,242,0.3)]">
                      {guestInitials(createdGuestName || "Guest")}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[#1877f2] ring-1 ring-[#dbeafe]">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Ready for deals
                    </p>
                    <p className="m-0 mt-2 truncate text-[1.25rem] font-extrabold tracking-tight text-[#0e182b]">
                      {createdGuestName || "Guest"}
                    </p>
                    <p className="m-0 mt-1 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
                      You&apos;ve created the guest profile successfully. Attach
                      deals below to complete the purchase.
                    </p>
                  </div>
                </div>

                <div
                  className="relative mx-auto hidden w-full max-w-[9rem] lg:block"
                  aria-hidden
                >
                  <div className="rounded-[1.1rem] border border-[#e8edf5] bg-[#f8fbff] p-4 shadow-sm">
                    <IdCard className="mx-auto size-10 text-[#1877f2]/70" />
                    <div className="mt-3 space-y-1.5">
                      <span className="mx-auto block h-1.5 w-16 rounded-full bg-[#dbeafe]" />
                      <span className="mx-auto block h-1.5 w-12 rounded-full bg-[#e2e8f0]" />
                    </div>
                  </div>
                  <Sparkles className="absolute -right-1 -top-1 size-4 text-[#1877f2]/50" />
                  <Sparkles className="absolute -bottom-1 left-0 size-3.5 text-slate-300" />
                </div>
              </div>
            </motion.div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]">
              <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1877f2]/55" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#1877f2]" />
                  </span>
                  <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
                    Attach deals
                  </p>
                </div>
                <p className="m-0 text-[0.7rem] font-medium text-white/55">
                  Step 2 of 3
                </p>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8edf5] px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)]">
                    <Gift className="size-5" strokeWidth={2.15} aria-hidden />
                  </span>
                  <div>
                    <h3 className="m-0 text-[0.98rem] font-extrabold text-[#0e182b]">
                      Select deals to attach
                    </h3>
                    <p className="m-0 mt-0.5 text-[0.76rem] font-medium text-slate-500">
                      Choose one or more offers to attach to this guest.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#e8f1ff] px-3 py-1 text-[0.72rem] font-bold tabular-nums text-[#1877f2] ring-1 ring-[#dbeafe]">
                  Selected {selectedFunnelIds.length} of {deals.length}
                </span>
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
                  <ul className="space-y-2.5">
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

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8edf5] pt-5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-4 py-2.5 text-[0.82rem] font-bold text-slate-700 transition hover:border-[#dbeafe] hover:bg-[#f8fafc]"
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={purchasing || !canConfirmDeals}
                    onClick={() => {
                      setPendingDealAmount(null);
                      if (attachingPostpaidOnly) {
                        setPurchaseStep("enterPrice");
                        return;
                      }
                      setPurchaseStep("confirm");
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.84rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!createdGuestId && !purchaseSuccess ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
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
                    New guest
                  </p>
                </div>
                <p className="m-0 hidden items-center gap-1.5 text-[0.7rem] font-medium text-white/55 sm:inline-flex">
                  Counter create mode
                  <Sparkles className="size-3.5 text-white/45" aria-hidden />
                </p>
              </div>

              <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-8 sm:px-7 sm:py-7">
                <div className="min-w-0">
                  <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#059669] ring-1 ring-[#a7f3d0]">
                    <ShieldCheck className="size-3.5" strokeWidth={2.25} aria-hidden />
                    Ready to create
                  </p>
                  <h3 className="m-0 mt-3.5 text-[1.55rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.75rem]">
                    Create a guest profile
                  </h3>
                  <p className="m-0 mt-2 max-w-lg text-[0.88rem] font-medium leading-relaxed text-slate-500">
                    Add the guest&apos;s details at the counter, then attach deals
                    and complete the purchase in one flow.
                  </p>

                  <form
                    onSubmit={(event) => void handleSubmit(event)}
                    className="mt-5 space-y-3"
                  >
                    {CREATE_FIELDS.map((field) => {
                      const value =
                        field.id === "guest-name"
                          ? name
                          : field.id === "guest-email"
                            ? email
                            : phone;
                      const onChange =
                        field.id === "guest-name"
                          ? setName
                          : field.id === "guest-email"
                            ? setEmail
                            : setPhone;

                      return (
                        <div key={field.id} className="min-w-0">
                          <label
                            htmlFor={field.id}
                            className="mb-1.5 block text-[0.72rem] font-bold text-slate-600"
                          >
                            {field.label}
                            <span className="ml-1.5 font-medium text-slate-400">
                              · {field.hint}
                            </span>
                          </label>
                          <div className="relative">
                            <field.icon
                              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400"
                              aria-hidden
                            />
                            <input
                              id={field.id}
                              type={field.type}
                              value={value}
                              onChange={(event) => onChange(event.target.value)}
                              required
                              autoComplete={field.autoComplete}
                              placeholder={field.placeholder}
                              className={`${inputClassName} pl-11`}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {errorMessage ? (
                      <p className="rounded-[1.1rem] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
                        {errorMessage}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1877f2] px-4 py-3 text-[0.88rem] font-bold text-white shadow-[0_6px_16px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <>
                          <UserPlus
                            className="size-4"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          Create guest
                        </>
                      )}
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="m-0 inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-slate-500">
                        <ShieldCheck
                          className="size-3.5 text-slate-400"
                          aria-hidden
                        />
                        Secure create · Your data is protected
                      </p>
                      <p className="m-0 text-[0.72rem] font-medium text-slate-400">
                        Name, email, and phone required
                      </p>
                    </div>
                  </form>
                </div>

                <div
                  className="relative mx-auto hidden w-full max-w-[15rem] lg:block"
                  aria-hidden
                >
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
                      New profile
                    </span>
                  </div>
                  <span className="absolute -bottom-3 -right-2 flex size-16 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_12px_28px_rgba(24,119,242,0.35)] ring-4 ring-white">
                    <Plus className="size-7" strokeWidth={2.5} />
                  </span>
                </div>
              </div>
            </motion.div>

            <div className="relative grid gap-3 sm:grid-cols-3 sm:gap-4">
              <span
                className="pointer-events-none absolute left-[16%] right-[16%] top-[1.65rem] hidden border-t border-dashed border-[#dbeafe] sm:block"
                aria-hidden
              />
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
        ) : null}
      </div>
    </>
  );
}
