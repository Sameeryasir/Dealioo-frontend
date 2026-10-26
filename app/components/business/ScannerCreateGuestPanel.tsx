"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  CreditCard,
  Focus,
  Loader2,
  Mail,
  Megaphone,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DealPriceDisplay } from "@/app/components/DealPriceDisplay";
import { BookMeetingPhoneInput } from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import {
  emailValidationMessage,
  guestNameValidationMessage,
  phoneValidationMessage,
} from "@/app/lib/form-validation";
import { formatDollars } from "@/app/lib/money";
import { standardEase } from "@/app/lib/motion";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  scannerCardHeaderClass,
  scannerEyebrowClass,
  scannerInputClass,
  scannerInputErrorClass,
  scannerMainCardClass,
  scannerPageWrapClass,
  scannerPrimaryBtnClass,
  scannerSecondaryBtnClass,
  scannerStackClass,
  scannerStatusChipClass,
  scannerTwoColGridClass,
  scannerWorkflowCardClass,
} from "@/app/lib/scanner-ui";
import { createCustomer } from "@/app/services/customer/create-customer";
import {
  purchaseScannerDeals,
  type ScannerPurchasedDeal,
} from "@/app/services/funnel/purchase-scanner-deals";
import {
  getGuestProfile,
  type GuestAvailableBusinessDeal,
} from "@/app/services/redemption/scan-redemption";

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
  deal: GuestAvailableBusinessDeal;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const imageSrc = resolveUploadImageUrl(deal.imageUrl);

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-[#f8fafc]"
        } ${checked ? "bg-[#e8f1ff]" : "bg-transparent"}`}
      >
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
            checked
              ? "border-[#1777f2] bg-[#1777f2] text-white"
              : "border-[#cbd5e1] bg-white"
          }`}
          aria-hidden
        >
          {checked ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8f1ff] text-[#1777f2]">
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
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {deal.price != null && deal.price !== "" ? (
              <DealPriceDisplay
                price={deal.price}
                originalPrice={deal.originalPrice}
                size="sm"
                showSaveBadge={false}
              />
            ) : null}
            {deal.campaignType === "postpaid" ? (
              <span className="text-[0.72rem] font-semibold text-slate-500">
                Postpaid
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

const CREATE_STEPS = [
  {
    icon: UserPlus,
    title: "Create Profile",
    description: "Add name, email, and phone at the counter.",
    iconWrap: "bg-[#ccfbf1] text-[#0f766e]",
    badgeWrap: "bg-[#0d9488] text-white",
  },
  {
    icon: Briefcase,
    title: "Pick Deals",
    description: "Choose which offers to attach to the guest.",
    iconWrap: "bg-[#ecfdf5] text-[#059669]",
    badgeWrap: "bg-[#059669] text-white",
  },
  {
    icon: CreditCard,
    title: "Complete Purchase",
    description: "Record payment and finish the order.",
    iconWrap: "bg-[#fff7ed] text-[#c2410c]",
    badgeWrap: "bg-[#ea580c] text-white",
  },
] as const;

const CREATE_TIPS = [
  {
    icon: Focus,
    title: "Enter accurate details",
    description: "Use the guest's real name and contact info.",
    iconWrap: "border-[#fde68a] bg-[#fffbeb] text-[#d97706]",
  },
  {
    icon: Mail,
    title: "Unique email & phone",
    description: "Duplicates are blocked to keep records clean.",
    iconWrap: "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]",
  },
  {
    icon: ShieldCheck,
    title: "Confirm before purchase",
    description: "Review selected deals before completing.",
    iconWrap: "border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]",
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
] as const;

const inputClassName = scannerInputClass;
const inputErrorClassName = scannerInputErrorClass;

type CreateGuestFieldKey = "name" | "email" | "phone";

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
  const [touched, setTouched] = useState<
    Partial<Record<CreateGuestFieldKey, boolean>>
  >({});
  const [createdGuestId, setCreatedGuestId] = useState<number | null>(null);
  const [createdGuestName, setCreatedGuestName] = useState("");
  const [deals, setDeals] = useState<GuestAvailableBusinessDeal[]>([]);
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

  const markTouched = (key: CreateGuestFieldKey) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const fieldErrors = {
    name: guestNameValidationMessage(name),
    email: emailValidationMessage(email),
    phone: phoneValidationMessage(phone),
  };

  const showError = (key: CreateGuestFieldKey) =>
    touched[key] ? fieldErrors[key] : null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setErrorMessage(null);
    setTouched({});
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
    if (createdGuestId == null) return;

    setLoadingDeals(true);
    setErrorMessage(null);

    try {
      const profile = await getGuestProfile(businessId, createdGuestId);
      const rows = profile?.availableBusinessDeals ?? [];
      setDeals(rows);
      if (rows.length === 0) {
        setErrorMessage(
          (profile?.publishedBusinessDealCount ?? 0) === 0
            ? "No published deals for this business."
            : "All published deals are already on this guest.",
        );
      }
    } catch (err) {
      setDeals([]);
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load deals.",
      );
    } finally {
      setLoadingDeals(false);
    }
  }, [businessId, createdGuestId]);

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
    setErrorMessage(null);
    setTouched({ name: true, email: true, phone: true });

    if (fieldErrors.name || fieldErrors.email || fieldErrors.phone) {
      return;
    }

    setSubmitting(true);
    setCreatedGuestId(null);
    setPurchaseSuccess(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    try {
      const result = await createCustomer({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        rejectDuplicateEmail: true,
        rejectDuplicatePhone: true,
        businessId,
      });
      setCreatedGuestId(result.id);
      setCreatedGuestName(trimmedName);
      setName("");
      setEmail("");
      setPhone("");
      setTouched({});
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
    extraItemNames?: string[],
    extraItems?: Array<{ name: string; unitPrice: number; qty: number }>,
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
        extraItemNames,
        extraItems,
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
                className="min-w-24 rounded-lg bg-[#1777f2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1569e0] disabled:cursor-not-allowed disabled:opacity-50"
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
          onDone={(extraItemsAmount, meta) =>
            void handlePurchase(
              pendingDealAmount,
              extraItemsAmount,
              meta?.itemNames,
              meta?.items,
            )
          }
          onDismiss={() => {
            setPurchaseStep(null);
            setPendingDealAmount(null);
          }}
        />
      ) : null}

      <div className={scannerPageWrapClass}>
        {purchaseSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: standardEase }}
            className={scannerMainCardClass}
          >
            <div className={scannerCardHeaderClass}>
              <span className={scannerStatusChipClass}>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1777f2]/45" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#1777f2]" />
                </span>
                Purchase complete
              </span>
            </div>
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-7">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1777f2] ring-1 ring-[#dbeafe]">
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
                className={scannerPrimaryBtnClass}
              >
                Create another guest
              </button>
            </div>
          </motion.div>
        ) : null}

        {createdGuestId && !purchaseSuccess ? (
          <div className={scannerStackClass}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: standardEase }}
              className={scannerMainCardClass}
            >
              <div className={scannerCardHeaderClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1777f2] text-[0.9rem] font-extrabold text-white">
                    {guestInitials(createdGuestName || "Guest")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[1.05rem] font-extrabold text-[#0e182b]">
                      {createdGuestName || "Guest"}
                    </p>
                    <p className="m-0 mt-0.5 text-[0.76rem] font-medium text-slate-500">
                      Guest #{createdGuestId} · profile created
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 sm:px-6 sm:px-7">
                <div>
                  <h3 className="m-0 text-[0.98rem] font-extrabold text-[#0e182b]">
                    Attach deals
                  </h3>
                  <p className="m-0 mt-0.5 text-[0.76rem] font-medium text-slate-500">
                    Choose offers for this guest.
                  </p>
                </div>
                <span className="text-[0.72rem] font-semibold tabular-nums text-slate-500">
                  {selectedFunnelIds.length} of {deals.length} selected
                </span>
              </div>

              <div className="px-5 pb-5 pt-3 sm:px-7 sm:pb-6">
                {loadingDeals ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Loader2
                      className="size-7 animate-spin text-[#1777f2]"
                      aria-hidden
                    />
                    <p className="m-0 text-[0.82rem] font-medium text-slate-600">
                      Loading deals…
                    </p>
                  </div>
                ) : null}

                {!loadingDeals && deals.length > 0 ? (
                  <ul className="divide-y divide-[#eef2f7]">
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
                  <p className="px-1 py-5 text-center text-[0.8rem] font-semibold text-slate-600">
                    No deals available for this restaurant.
                  </p>
                ) : null}

                {errorMessage ? (
                  <p className="mt-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className={scannerSecondaryBtnClass}
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
                    className={scannerPrimaryBtnClass}
                  >
                    Continue
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}

        {!createdGuestId && !purchaseSuccess ? (
          <div className={scannerStackClass}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: standardEase }}
              className={scannerMainCardClass}
            >
              <div className={scannerCardHeaderClass}>
                <span className={scannerStatusChipClass}>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1777f2]/45" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#1777f2]" />
                  </span>
                  Ready to create
                </span>
              </div>

              <div className={scannerTwoColGridClass}>
                <div className="min-w-0">
                  <p className={scannerEyebrowClass}>Counter create mode</p>
                  <span
                    className="mt-1.5 block h-0.5 w-10 rounded-full bg-[#1777f2]"
                    aria-hidden
                  />
                  <h2 className="m-0 mt-2.5 text-[1.4rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.55rem]">
                    New Guest
                  </h2>
                  <p className="m-0 mt-1.5 text-[0.78rem] font-medium leading-snug text-slate-500">
                    Add the guest&apos;s details at the counter, then attach deals
                    and complete the purchase in one flow.
                  </p>

                  <form
                    onSubmit={(event) => void handleSubmit(event)}
                    className="mt-3 space-y-2"
                  >
                    {CREATE_FIELDS.map((field) => {
                      const value =
                        field.id === "guest-name" ? name : email;
                      const fieldKey: CreateGuestFieldKey =
                        field.id === "guest-name" ? "name" : "email";
                      const onChange =
                        field.id === "guest-name" ? setName : setEmail;
                      const error = showError(fieldKey);

                      return (
                        <div key={field.id} className="min-w-0">
                          <label
                            htmlFor={field.id}
                            className="mb-0.5 block text-[0.68rem] font-bold text-slate-600"
                          >
                            {field.label}
                            <span className="ml-1.5 font-medium text-slate-400">
                              · {field.hint}
                            </span>
                          </label>
                          <div className="relative">
                            <field.icon
                              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                              aria-hidden
                            />
                            <input
                              id={field.id}
                              type={field.type}
                              value={value}
                              onChange={(event) => onChange(event.target.value)}
                              onBlur={() => markTouched(fieldKey)}
                              autoComplete={field.autoComplete}
                              placeholder={field.placeholder}
                              aria-invalid={Boolean(error)}
                              className={`${
                                error ? inputErrorClassName : inputClassName
                              } py-2 pl-9 text-[0.84rem] shadow-none`}
                            />
                          </div>
                          {error ? (
                            <p
                              className="mt-0.5 text-[0.7rem] font-medium text-red-600"
                              role="alert"
                            >
                              {error}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}

                    <div className="min-w-0">
                      <label
                        htmlFor="guest-phone"
                        className="mb-0.5 block text-[0.68rem] font-bold text-slate-600"
                      >
                        Phone
                        <span className="ml-1.5 font-medium text-slate-400">
                          · Guest phone number
                        </span>
                      </label>
                      <div
                        data-phone-field
                        className={`${
                          showError("phone") ? inputErrorClassName : inputClassName
                        } flex items-center py-2 shadow-none focus-within:border-[#1777f2]/45 focus-within:ring-2 focus-within:ring-[#1777f2]/15`}
                        onBlur={() => markTouched("phone")}
                      >
                        <BookMeetingPhoneInput
                          value={phone}
                          onChange={setPhone}
                          variant="boxed"
                          wrapClassName="min-w-0 flex-1 [&_input]:!text-[0.84rem] [&_input]:!font-medium"
                        />
                      </div>
                      {showError("phone") ? (
                        <p
                          className="mt-0.5 text-[0.7rem] font-medium text-red-600"
                          role="alert"
                        >
                          {showError("phone")}
                        </p>
                      ) : null}
                    </div>

                    {errorMessage ? (
                      <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-[0.8rem] text-[#dc2626]">
                        {errorMessage}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`mt-3 w-full ${scannerPrimaryBtnClass} py-2 text-[0.8rem]`}
                    >
                      {submitting ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <>
                          <UserPlus
                            className="size-3.5"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          Create guest
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="min-w-0 lg:pl-1">
                  <h3 className="m-0 text-[0.95rem] font-extrabold tracking-tight text-[#0e182b]">
                    Tips for best results
                  </h3>
                  <ul className="m-0 mt-4 flex list-none flex-col gap-3.5 p-0">
                    {CREATE_TIPS.map((tip) => {
                      const Icon = tip.icon;
                      return (
                        <li key={tip.title} className="flex items-start gap-3">
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${tip.iconWrap}`}
                          >
                            <Icon
                              className="size-4"
                              strokeWidth={2.1}
                              aria-hidden
                            />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="m-0 text-[0.84rem] font-bold text-[#0e182b]">
                              {tip.title}
                            </p>
                            <p className="m-0 mt-0.5 text-[0.76rem] font-medium text-slate-500">
                              {tip.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-5 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-4">
                    <p className="m-0 flex items-center gap-2 text-[0.84rem] font-extrabold text-[#0e182b]">
                      <ShieldCheck
                        className="size-4 text-[#059669]"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                      Secure &amp; Verified
                    </p>
                    <p className="m-0 mt-1.5 text-[0.76rem] font-medium leading-relaxed text-slate-600">
                      Deals, payments, and eligibility are checked before
                      redemption.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="relative grid gap-3 sm:grid-cols-3 sm:gap-4">
              <span
                className="pointer-events-none absolute left-[16%] right-[16%] top-[1.7rem] hidden border-t border-dashed border-slate-200 sm:block"
                aria-hidden
              />
              {CREATE_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.05 + index * 0.05,
                      ease: standardEase,
                    }}
                    className={scannerWorkflowCardClass}
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl ${step.iconWrap}`}
                      >
                        <Icon className="size-4" strokeWidth={2.15} aria-hidden />
                      </span>
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-[0.68rem] font-extrabold ${step.badgeWrap}`}
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
