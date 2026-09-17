"use client";

import { TwilioBuyCountryPicker, supportsTwilioAreaCodeFilter } from "@/app/components/business/TwilioBuyCountryPicker";
import {
  useAssociateBusinessTwilioPhoneNumberMutation,
  useBusinessTwilioPhoneNumbersQuery,
  usePurchaseBusinessTwilioPhoneNumberMutation,
  useSearchTwilioAvailableToBuyMutation,
} from "@/app/hooks/use-business-twilio-phone-numbers-query";
import { countryDisplayName } from "@/app/lib/resolve-twilio-country";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import type {
  TwilioAvailableToBuyNumber,
  TwilioPhoneNumberOption,
} from "@/app/services/business/twilio-phone-numbers";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  parsePhoneNumber,
  type Country,
} from "react-phone-number-input";

type ChooseNumberDialogProps = {
  open: boolean;
  businessId: number;
  isBusy?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  dismissible?: boolean;
  overlayClassName?: string;
  onClose: () => void;
  onConfirmed: (selected: TwilioPhoneNumberOption) => void | Promise<void>;
};

type NumberTab = "owned" | "buy";

function searchDefaultsFromAccountPhone(phone: string | null | undefined): {
  country: Country;
  areaCode: string;
} {
  const raw = phone?.trim() || "";
  if (!raw) {
    return { country: "US", areaCode: "" };
  }

  try {
    const parsed = parsePhoneNumber(raw);
    if (!parsed?.country) {
      return { country: "US", areaCode: "" };
    }

    const country = parsed.country as Country;
    const national = String(parsed.nationalNumber || "");
    const areaCode =
      supportsTwilioAreaCodeFilter(country) && /^\d{10}$/.test(national)
        ? national.slice(0, 3)
        : "";

    return { country, areaCode };
  } catch {
    return { country: "US", areaCode: "" };
  }
}

function emptySearchMessage(country: Country, areaCode: string): string {
  const name = countryDisplayName(country);
  if (areaCode) {
    return `No SMS-capable numbers available in ${name} for area code ${areaCode}. Try another area code, or clear it to see more.`;
  }
  if (country === "PK") {
    return `Twilio typically does not sell local SMS numbers in ${name}. Try United States or Canada instead.`;
  }
  return `No SMS-capable numbers available in ${name} for this Twilio account right now. Try another country${supportsTwilioAreaCodeFilter(country) ? " or area code" : ""}.`;
}

export function ChooseNumberDialog({
  open,
  businessId,
  isBusy = false,
  title = "Twilio number",
  description = "Pick a number you own, or search for one to buy.",
  confirmLabel = "Save",
  confirmingLabel = "Saving…",
  dismissible = true,
  overlayClassName = "z-[70]",
  onClose,
  onConfirmed,
}: ChooseNumberDialogProps) {
  const titleId = useId();
  const chargeAckId = useId();
  const accountDefaultsAppliedRef = useRef(false);
  const searchRequestIdRef = useRef(0);
  const [tab, setTab] = useState<NumberTab>("owned");
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedSid, setSelectedSid] = useState("");
  const [country, setCountry] = useState<Country>("US");
  const [areaCode, setAreaCode] = useState("");
  const [buyResults, setBuyResults] = useState<TwilioAvailableToBuyNumber[]>(
    [],
  );
  const [selectedBuyNumber, setSelectedBuyNumber] = useState("");
  const [chargeAcknowledged, setChargeAcknowledged] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const businessQuery = useBusinessTwilioPhoneNumbersQuery(businessId, {
    enabled: open && businessId >= 1,
  });

  const numbers = businessQuery.numbers;
  const selectedPhoneSid = businessQuery.selectedPhoneSid;
  const selectedPhoneNumber = businessQuery.selectedPhoneNumber;
  const isLoading = businessQuery.isLoading;
  const loadError = businessQuery.error;

  const associateMutation =
    useAssociateBusinessTwilioPhoneNumberMutation(businessId);
  const searchMutation = useSearchTwilioAvailableToBuyMutation(businessId);
  const purchaseMutation =
    usePurchaseBusinessTwilioPhoneNumberMutation(businessId);

  const areaCodeSupported = supportsTwilioAreaCodeFilter(country);

  async function runNumberSearch(nextCountry: Country, nextAreaCode: string) {
    const requestId = ++searchRequestIdRef.current;
    setLocalError(null);
    if (searchMutation.error) searchMutation.reset();
    setSelectedBuyNumber("");
    setChargeAcknowledged(false);
    setBuyResults([]);
    setHasSearched(true);

    const area = areaCodeSupported ? nextAreaCode.trim() : "";
    if (area && !/^\d{3}$/.test(area)) {
      setLocalError(
        "Area code must be exactly 3 digits (e.g. 415), or leave it blank.",
      );
      return;
    }

    try {
      const result = await searchMutation.mutateAsync({
        country: nextCountry,
        areaCode: area || undefined,
        limit: 20,
      });
      if (requestId !== searchRequestIdRef.current) return;
      setBuyResults(result.numbers);
      if (result.numbers.length === 0) {
        setLocalError(emptySearchMessage(nextCountry, area));
      }
    } catch {
      // Error shown via searchMutation.error
    }
  }

  useEffect(() => {
    if (!open) {
      accountDefaultsAppliedRef.current = false;
      searchRequestIdRef.current += 1;
      setLocalError(null);
      setSelectedSid("");
      setTab("owned");
      setCountry("US");
      setAreaCode("");
      setBuyResults([]);
      setSelectedBuyNumber("");
      setChargeAcknowledged(false);
      setHasSearched(false);
      searchMutation.reset();
      associateMutation.reset();
      purchaseMutation.reset();
      return;
    }
    setLocalError(null);
    searchMutation.reset();
    associateMutation.reset();
    purchaseMutation.reset();
    setSelectedSid(selectedPhoneSid?.trim() || numbers[0]?.sid || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog opens/closes
  }, [open, selectedPhoneSid, numbers]);

  useEffect(() => {
    if (!open || isLoading || accountDefaultsAppliedRef.current) {
      return;
    }

    const accountPhone =
      selectedPhoneNumber?.trim() ||
      numbers.find((n) => n.sid === selectedPhoneSid)?.phoneNumber ||
      numbers[0]?.phoneNumber ||
      null;

    const defaults = searchDefaultsFromAccountPhone(accountPhone);
    accountDefaultsAppliedRef.current = true;
    setCountry(defaults.country);
    setAreaCode(defaults.areaCode);
    void runNumberSearch(defaults.country, defaults.areaCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once per open after numbers load
  }, [open, isLoading, selectedPhoneNumber, selectedPhoneSid, numbers]);

  useEffect(() => {
    if (
      !open ||
      associateMutation.isPending ||
      purchaseMutation.isPending ||
      isBusy ||
      !dismissible
    ) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    associateMutation.isPending,
    purchaseMutation.isPending,
    isBusy,
    onClose,
    dismissible,
  ]);

  if (!open || typeof document === "undefined") return null;

  const busy =
    isLoading ||
    isBusy ||
    associateMutation.isPending ||
    purchaseMutation.isPending ||
    searchMutation.isPending;

  const selected = numbers.find((n) => n.sid === selectedSid) ?? null;
  const error =
    localError ||
    loadError ||
    (associateMutation.error
      ? getApiErrorMessage(associateMutation.error, "Could not save number.")
      : null) ||
    (searchMutation.error
      ? getApiErrorMessage(searchMutation.error, "Could not search numbers.")
      : null) ||
    (purchaseMutation.error
      ? getApiErrorMessage(purchaseMutation.error, "Could not buy number.")
      : null);

  function clearSearchErrors() {
    setLocalError(null);
    if (searchMutation.error) searchMutation.reset();
  }

  async function handleConfirmOwned() {
    if (!selected) {
      setLocalError("Select a number.");
      return;
    }
    setLocalError(null);
    try {
      await associateMutation.mutateAsync({
        phoneSid: selected.sid,
        phoneNumber: selected.phoneNumber,
      });
      await onConfirmed(selected);
    } catch {
      // Error shown via associateMutation.error
    }
  }

  async function handleBuySelected() {
    if (!selectedBuyNumber) {
      setLocalError("Select a number to buy.");
      return;
    }
    if (!chargeAcknowledged) {
      setLocalError(
        "Confirm that Twilio will charge your account before buying.",
      );
      return;
    }
    setLocalError(null);
    try {
      const purchased = await purchaseMutation.mutateAsync({
        phoneNumber: selectedBuyNumber,
      });
      await onConfirmed({
        sid: purchased.twilioPhoneSid,
        phoneNumber: purchased.twilioPhoneNumber,
        friendlyName: null,
      });
    } catch {
      // Error shown via purchaseMutation.error
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/40 p-4 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => {
        if (!busy && dismissible) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-[1.05rem] font-semibold text-[#1a1a1a]"
            >
              {title}
            </h2>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-[#666]">
              {description}
            </p>
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full p-1 text-[#888] hover:bg-[#f4f4f4] hover:text-[#333]"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex gap-1 rounded-lg bg-[#f4f4f4] p-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setTab("owned");
              setLocalError(null);
              searchMutation.reset();
              associateMutation.reset();
              purchaseMutation.reset();
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-[0.8rem] font-semibold ${
              tab === "owned"
                ? "bg-white text-[#222] shadow-sm"
                : "text-[#666]"
            }`}
          >
            Yours
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setTab("buy");
              setLocalError(null);
              searchMutation.reset();
              associateMutation.reset();
              purchaseMutation.reset();
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-[0.8rem] font-semibold ${
              tab === "buy" ? "bg-white text-[#222] shadow-sm" : "text-[#666]"
            }`}
          >
            Buy new
          </button>
        </div>

        <div className="mt-4">
          {tab === "owned" ? (
            isLoading ? (
              <div className="flex items-center gap-2 py-6 text-[0.85rem] text-[#666]">
                <Loader2 className="size-4 animate-spin" />
                Loading numbers…
              </div>
            ) : numbers.length === 0 ? (
              <p className="py-4 text-[0.85rem] text-[#666]">
                No numbers on this account yet. Use Buy new.
              </p>
            ) : (
              <div className="max-h-56 overflow-auto rounded-xl border border-[#e8e8e8]">
                {numbers.map((option) => {
                  const active = selectedSid === option.sid;
                  return (
                    <button
                      key={option.sid}
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setSelectedSid(option.sid);
                        setLocalError(null);
                      }}
                      className={`flex w-full items-center justify-between border-b border-[#f0f0f0] px-3 py-2.5 text-left text-[0.88rem] last:border-b-0 ${
                        active
                          ? "bg-[#fafafa] font-semibold text-[#111]"
                          : "text-[#333] hover:bg-[#fafafa]"
                      }`}
                    >
                      <span>{option.phoneNumber}</span>
                      {active ? (
                        <span className="text-[0.72rem] text-[#888]">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl bg-[#fff8f8] px-3 py-2 text-[0.78rem] leading-relaxed text-[#7a3a3a]">
                Buying a number is charged by Twilio to your Twilio account — not
                by Dealioo. Pick a country, optionally an area code, then buy.
              </p>

              <div
                className={`grid gap-2 ${areaCodeSupported ? "grid-cols-2" : "grid-cols-1"}`}
              >
                <label className="block min-w-0">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#777]">
                    Country
                  </span>
                  <TwilioBuyCountryPicker
                    value={country}
                    disabled={busy}
                    onChange={(next) => {
                      clearSearchErrors();
                      setCountry(next);
                      const nextArea = supportsTwilioAreaCodeFilter(next)
                        ? areaCode
                        : "";
                      if (!supportsTwilioAreaCodeFilter(next)) {
                        setAreaCode("");
                      }
                      void runNumberSearch(next, nextArea);
                    }}
                  />
                  <span className="mt-1 block text-[0.7rem] text-[#888]">
                    Search by name or code
                  </span>
                </label>

                {areaCodeSupported ? (
                  <label className="block min-w-0">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#777]">
                      Area code
                    </span>
                    <input
                      type="text"
                      value={areaCode}
                      onChange={(e) => {
                        const next = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 3);
                        clearSearchErrors();
                        setAreaCode(next);
                        if (next.length === 0 || next.length === 3) {
                          void runNumberSearch(country, next);
                        }
                      }}
                      disabled={busy}
                      inputMode="numeric"
                      placeholder="415"
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#e4e4e4] bg-[#fafafa] px-3 text-[0.88rem] outline-none focus:border-[#ccc] focus:bg-white"
                    />
                    <span className="mt-1 block text-[0.7rem] text-[#888]">
                      Optional · US/Canada only
                    </span>
                  </label>
                ) : null}
              </div>

              {!areaCodeSupported ? (
                <p className="text-[0.72rem] text-[#888]">
                  Area code filtering is for US and Canada. For other countries,
                  available SMS numbers (including mobile) are listed below.
                </p>
              ) : null}

              {searchMutation.isPending ? (
                <div className="flex items-center gap-2 py-3 text-[0.85rem] text-[#666]">
                  <Loader2 className="size-4 animate-spin" />
                  Searching available numbers…
                </div>
              ) : null}

              {buyResults.length > 0 ? (
                <div className="max-h-48 overflow-auto rounded-xl border border-[#e8e8e8]">
                  {buyResults.map((option) => {
                    const active = selectedBuyNumber === option.phoneNumber;
                    const place = [option.locality, option.region]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <button
                        key={option.phoneNumber}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setSelectedBuyNumber(option.phoneNumber);
                          setChargeAcknowledged(false);
                          setLocalError(null);
                        }}
                        className={`flex w-full flex-col border-b border-[#f0f0f0] px-3 py-2.5 text-left last:border-b-0 ${
                          active ? "bg-[#fafafa]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <span
                          className={`text-[0.88rem] ${
                            active ? "font-semibold text-[#111]" : "text-[#333]"
                          }`}
                        >
                          {option.phoneNumber}
                        </span>
                        {place ? (
                          <span className="mt-0.5 text-[0.72rem] text-[#888]">
                            {place}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : hasSearched &&
                !searchMutation.isPending &&
                !error ? (
                <p className="text-[0.8rem] text-[#888]">
                  No numbers to show yet.
                </p>
              ) : null}

              {selectedBuyNumber ? (
                <label
                  htmlFor={chargeAckId}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5"
                >
                  <input
                    id={chargeAckId}
                    type="checkbox"
                    checked={chargeAcknowledged}
                    disabled={busy}
                    onChange={(e) => {
                      setChargeAcknowledged(e.target.checked);
                      setLocalError(null);
                    }}
                    className="mt-0.5 size-4 shrink-0 accent-[#F22F46]"
                  />
                  <span className="text-[0.78rem] leading-relaxed text-[#444]">
                    I understand Twilio will charge my Twilio account for{" "}
                    <span className="font-semibold">{selectedBuyNumber}</span>,
                    and Dealioo will use it for SMS.
                  </span>
                </label>
              ) : null}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-3 text-[0.78rem] text-red-600">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[#e4e4e4] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#444]"
            >
              Cancel
            </button>
          ) : null}
          {tab === "owned" ? (
            <button
              type="button"
              onClick={() => void handleConfirmOwned()}
              disabled={busy || !selected}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F22F46] px-3.5 py-2 text-[0.8rem] font-semibold text-white disabled:opacity-70"
            >
              {associateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {associateMutation.isPending || isBusy
                ? confirmingLabel
                : confirmLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleBuySelected()}
              disabled={busy || !selectedBuyNumber || !chargeAcknowledged}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F22F46] px-3.5 py-2 text-[0.8rem] font-semibold text-white disabled:opacity-70"
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {purchaseMutation.isPending ? "Buying…" : "Buy & use"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
