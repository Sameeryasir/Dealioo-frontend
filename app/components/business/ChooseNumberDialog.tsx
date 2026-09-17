"use client";

import { TwilioBuyCountryPicker, supportsTwilioAreaCodeFilter } from "@/app/components/business/TwilioBuyCountryPicker";
import {
  useAssociateBusinessTwilioPhoneNumberMutation,
  useBusinessTwilioPhoneNumbersQuery,
  usePurchaseBusinessTwilioPhoneNumberMutation,
  useSearchTwilioAvailableToBuyMutation,
} from "@/app/hooks/use-business-twilio-phone-numbers-query";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import type {
  TwilioAvailableToBuyNumber,
  TwilioPhoneNumberOption,
} from "@/app/services/business/twilio-phone-numbers";
import { ImageIcon, Info, Loader2, MessageSquare, Phone, Printer, X } from "lucide-react";
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

function formatBuyNumberDisplay(phoneNumber: string): string {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (parsed) return parsed.formatInternational();
  } catch {
  }
  return phoneNumber;
}

function formatBuyNumberPlace(option: TwilioAvailableToBuyNumber): string {
  const parts = [option.locality, option.region].filter(Boolean);
  const place = parts.join(", ");
  const country = option.isoCountry?.trim() || "";
  if (place && country) return `${place} ${country}`;
  if (place) return place;
  return country;
}

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
  const area =
    supportsTwilioAreaCodeFilter(country) && /^\d{3}$/.test(areaCode.trim())
      ? areaCode.trim()
      : "";
  if (area) {
    return `We couldn't find any numbers that matched your search for area code ${area}. Try another area code or clear it.`;
  }
  return "We couldn't find any numbers that matched your search. Try another country or, for the US/Canada, change the area code.";
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
  const accountDefaultsAppliedRef = useRef(false);
  const searchRequestIdRef = useRef(0);
  const areaCodeSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [tab, setTab] = useState<NumberTab>("owned");
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedSid, setSelectedSid] = useState("");
  const [country, setCountry] = useState<Country>("US");
  const [areaCode, setAreaCode] = useState("");
  const [buyResults, setBuyResults] = useState<TwilioAvailableToBuyNumber[]>(
    [],
  );
  const [selectedBuyNumber, setSelectedBuyNumber] = useState("");
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
    setBuyResults([]);
    setHasSearched(true);

    const supportsArea = supportsTwilioAreaCodeFilter(nextCountry);
    const trimmedArea = nextAreaCode.trim();
    const area =
      supportsArea && /^\d{3}$/.test(trimmedArea) ? trimmedArea : "";
    if (supportsArea && trimmedArea.length > 0 && trimmedArea.length < 3) {
      return;
    }

    try {
      const result = await searchMutation.mutateAsync({
        country: nextCountry,
        ...(area ? { areaCode: area } : {}),
        limit: 20,
      });
      if (requestId !== searchRequestIdRef.current) return;
      setBuyResults(result.numbers);
    } catch {
    }
  }

  useEffect(() => {
    if (!open) {
      accountDefaultsAppliedRef.current = false;
      searchRequestIdRef.current += 1;
      if (areaCodeSearchTimerRef.current) {
        clearTimeout(areaCodeSearchTimerRef.current);
        areaCodeSearchTimerRef.current = null;
      }
      setLocalError(null);
      setSelectedSid("");
      setTab("owned");
      setCountry("US");
      setAreaCode("");
      setBuyResults([]);
      setSelectedBuyNumber("");
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

  const formLocked =
    isLoading ||
    isBusy ||
    associateMutation.isPending ||
    purchaseMutation.isPending;
  const searching = searchMutation.isPending;
  const busy = formLocked || searching;

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
    }
  }

  async function handleBuySelected() {
    if (!selectedBuyNumber) {
      setLocalError("Select a number to buy.");
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
        className={`flex max-h-[min(90vh,820px)] w-full flex-col overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-xl sm:p-6 ${
          tab === "buy" ? "max-w-3xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-[1.25rem] font-bold tracking-tight text-[#0f172a]"
            >
              {tab === "buy" ? "Buy a Number" : title}
            </h2>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-[#666]">
              {tab === "buy"
                ? "Search by country, then pick a number to buy on your Twilio account."
                : description}
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

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-0.5">
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
              <div className="max-h-[min(50vh,360px)] overflow-auto rounded-xl border border-[#e8e8e8]">
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
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[0.78rem] leading-relaxed text-sky-950"
              >
                <Info
                  className="mt-0.5 size-3.5 shrink-0 text-sky-600"
                  aria-hidden
                />
                <p className="m-0">
                  Twilio will charge your Twilio account for any number you buy
                  here — not Dealioo. Search by country (and area code when
                  available), pick a number, then tap Buy &amp; use.
                </p>
              </div>

              <div
                className={`grid gap-3 ${areaCodeSupported ? "grid-cols-2" : "grid-cols-1"}`}
              >
                <label className="block min-w-0">
                  <span className="text-[0.85rem] font-medium text-[#334155]">
                    Country
                  </span>
                  <TwilioBuyCountryPicker
                    value={country}
                    disabled={formLocked}
                    onChange={(next) => {
                      clearSearchErrors();
                      if (areaCodeSearchTimerRef.current) {
                        clearTimeout(areaCodeSearchTimerRef.current);
                        areaCodeSearchTimerRef.current = null;
                      }
                      setCountry(next);
                      setAreaCode("");
                      void runNumberSearch(next, "");
                    }}
                  />
                  <span className="mt-1 block text-[0.7rem] text-[#888]">
                    Search by country name or code
                  </span>
                </label>

                {areaCodeSupported ? (
                  <label className="block min-w-0">
                    <span className="text-[0.85rem] font-medium text-[#334155]">
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
                        if (areaCodeSearchTimerRef.current) {
                          clearTimeout(areaCodeSearchTimerRef.current);
                        }
                        areaCodeSearchTimerRef.current = setTimeout(() => {
                          areaCodeSearchTimerRef.current = null;
                          if (next.length === 0 || next.length === 3) {
                            void runNumberSearch(country, next);
                          }
                        }, 350);
                      }}
                      disabled={formLocked}
                      inputMode="numeric"
                      placeholder="e.g. 415"
                      className="mt-1.5 h-11 w-full rounded-lg border border-[#d0d7e2] bg-white px-3 text-[0.9rem] text-[#1e293b] outline-none transition-[box-shadow,border-color] placeholder:text-[#94a3b8] hover:border-[#b8c2d1] focus:border-[#60a5fa] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)]"
                    />
                    <span className="mt-1 block text-[0.7rem] text-[#888]">
                      Enter the area code you want in your number
                    </span>
                  </label>
                ) : null}
              </div>

              {!areaCodeSupported ? (
                <p className="mt-2 text-[0.72rem] text-[#888]">
                  Area code filtering is for US and Canada. For other countries,
                  available numbers (including mobile) are listed below.
                </p>
              ) : null}

              {searchMutation.isPending ? (
                <div className="flex items-center gap-2 py-3 text-[0.85rem] text-[#666]">
                  <Loader2 className="size-4 animate-spin" />
                  Searching numbers…
                </div>
              ) : null}

              {buyResults.length > 0 ? (
                <div className="mt-1 max-h-[min(50vh,420px)] overflow-auto rounded-xl border border-[#e2e8f0]">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="sticky top-0 z-[1] bg-[#f8fafc]">
                      <tr className="border-b border-[#e2e8f0] text-[0.72rem] font-semibold text-[#64748b]">
                        <th className="px-3 py-2.5 font-semibold">Number</th>
                        <th className="px-3 py-2.5 font-semibold">Type</th>
                        <th className="px-3 py-2.5 font-semibold" colSpan={4}>
                          <div className="mb-1">Capabilities</div>
                          <div className="grid grid-cols-4 gap-1 text-[0.65rem] font-medium text-[#94a3b8]">
                            <span className="flex justify-center" title="Voice">
                              <Phone className="size-3.5" aria-hidden />
                            </span>
                            <span className="flex justify-center" title="SMS">
                              <MessageSquare className="size-3.5" aria-hidden />
                            </span>
                            <span className="flex justify-center" title="MMS">
                              <ImageIcon className="size-3.5" aria-hidden />
                            </span>
                            <span className="flex justify-center" title="Fax">
                              <Printer className="size-3.5" aria-hidden />
                            </span>
                          </div>
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          Address Requirement
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          Monthly fee
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          <span className="sr-only">Buy</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyResults.map((option) => {
                        const active = selectedBuyNumber === option.phoneNumber;
                        const place = formatBuyNumberPlace(option);
                        const caps = option.capabilities;
                        return (
                          <tr
                            key={option.phoneNumber}
                            className={`border-b border-[#f1f5f9] last:border-b-0 ${
                              active ? "bg-[#f8fafc]" : "bg-white"
                            }`}
                          >
                            <td className="px-3 py-3 align-top">
                              <div className="text-[0.92rem] font-semibold text-[#0f172a]">
                                {formatBuyNumberDisplay(option.phoneNumber)}
                              </div>
                              {place ? (
                                <div className="mt-0.5 text-[0.75rem] text-[#64748b]">
                                  {place}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 align-middle text-[0.85rem] text-[#334155]">
                              {option.numberType || "Local"}
                            </td>
                            <td className="px-3 py-3 align-middle" colSpan={4}>
                              <div className="grid grid-cols-4 gap-1 text-[#0f172a]">
                                <span className="flex justify-center">
                                  {caps.voice ? (
                                    <Phone className="size-4" aria-label="Voice" />
                                  ) : (
                                    <span className="size-4" />
                                  )}
                                </span>
                                <span className="flex justify-center">
                                  {caps.sms ? (
                                    <MessageSquare className="size-4" aria-label="SMS" />
                                  ) : (
                                    <span className="size-4" />
                                  )}
                                </span>
                                <span className="flex justify-center">
                                  {caps.mms ? (
                                    <ImageIcon className="size-4" aria-label="MMS" />
                                  ) : (
                                    <span className="size-4" />
                                  )}
                                </span>
                                <span className="flex justify-center">
                                  {caps.fax ? (
                                    <Printer className="size-4" aria-label="Fax" />
                                  ) : (
                                    <span className="size-4" />
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle text-[0.85rem] text-[#334155]">
                              {option.addressRequirement || "None"}
                            </td>
                            <td className="px-3 py-3 align-middle text-[0.9rem] font-semibold text-[#0f172a]">
                              {option.monthlyFee || "—"}
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setSelectedBuyNumber(option.phoneNumber);
                                  setLocalError(null);
                                }}
                                className={`rounded-md border px-3 py-1.5 text-[0.8rem] font-medium ${
                                  active
                                    ? "border-[#0f172a] bg-[#0f172a] text-white"
                                    : "border-[#cbd5e1] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                                }`}
                              >
                                {active ? "Selected" : "Buy"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : hasSearched &&
                !searchMutation.isPending &&
                !error ? (
                <p className="py-6 text-center text-[0.85rem] leading-relaxed text-[#64748b]">
                  {emptySearchMessage(country, areaCode)}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-3 shrink-0 text-[0.78rem] text-red-600">{error}</p>
        ) : null}

        <div className="mt-5 flex shrink-0 justify-end gap-2">
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
              disabled={busy || !selectedBuyNumber}
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
