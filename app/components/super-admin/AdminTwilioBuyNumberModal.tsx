/**
 * Modal to search and buy a Twilio number onto Dealioo's platform account.
 * Related: SuperAdminTwilioPanel, admin-twilio.ts
 */

"use client";

import {
  TwilioBuyCountryPicker,
  supportsTwilioAreaCodeFilter,
} from "@/app/components/business/TwilioBuyCountryPicker";
import styles from "@/app/components/super-admin/SuperAdminTwilioPanel.module.css";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  purchaseAdminTwilioNumber,
  searchAdminTwilioAvailableNumbers,
  type AdminTwilioAvailableNumber,
} from "@/app/services/admin/admin-twilio";
import { useMutation } from "@tanstack/react-query";
import {
  ImageIcon,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  Printer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { parsePhoneNumber, type Country } from "react-phone-number-input";
import { toast } from "sonner";

function formatBuyNumberDisplay(phoneNumber: string): string {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    if (parsed) return parsed.formatInternational();
  } catch {
    /* keep raw */
  }
  return phoneNumber;
}

function formatBuyNumberPlace(option: AdminTwilioAvailableNumber): string {
  const parts = [option.locality, option.region].filter(Boolean);
  const place = parts.join(", ");
  const country = option.isoCountry?.trim() || "";
  if (place && country) return `${place} ${country}`;
  if (place) return place;
  return country;
}

type AdminTwilioBuyNumberModalProps = {
  open: boolean;
  configured: boolean;
  onClose: () => void;
  onPurchased: () => void | Promise<void>;
};

export function AdminTwilioBuyNumberModal({
  open,
  configured,
  onClose,
  onPurchased,
}: AdminTwilioBuyNumberModalProps) {
  const [country, setCountry] = useState<Country>("US");
  const [areaCode, setAreaCode] = useState("");
  const [available, setAvailable] = useState<AdminTwilioAvailableNumber[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedBuyNumber, setSelectedBuyNumber] = useState<string | null>(
    null,
  );
  const areaCodeSupported = supportsTwilioAreaCodeFilter(country);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const searchMutation = useMutation({
    mutationFn: () =>
      searchAdminTwilioAvailableNumbers({
        country,
        areaCode: areaCode.trim() || undefined,
        sms: true,
        limit: 20,
      }),
    onSuccess: (numbers) => {
      setAvailable(numbers);
      setSearched(true);
      if (numbers.length === 0) {
        toast.message("No numbers found for that search.");
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not search numbers."));
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: (phoneNumber: string) =>
      purchaseAdminTwilioNumber({ phoneNumber }),
    onSuccess: async (result) => {
      toast.success(
        `Bought ${result.phoneNumber}. Inbound webhook was applied.`,
      );
      await onPurchased();
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not buy number."));
    },
  });

  const busy = searchMutation.isPending || purchaseMutation.isPending;

  if (!open) return null;

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <section
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-twilio-buy-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2 id="sa-twilio-buy-title" className={styles.modalTitle}>
            Buy a number
          </h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.buyBar}>
            <div className={styles.field}>
              <label>Country</label>
              <TwilioBuyCountryPicker
                value={country}
                disabled={busy}
                onChange={(next) => {
                  setCountry(next);
                  setAreaCode("");
                  setSelectedBuyNumber(null);
                  setAvailable([]);
                  setSearched(false);
                }}
              />
            </div>
            {areaCodeSupported ? (
              <div className={styles.field}>
                <label htmlFor="sa-twilio-buy-area">Area code</label>
                <input
                  id="sa-twilio-buy-area"
                  value={areaCode}
                  onChange={(event) => {
                    setAreaCode(
                      event.target.value.replace(/\D/g, "").slice(0, 3),
                    );
                    setSelectedBuyNumber(null);
                  }}
                  disabled={busy}
                  inputMode="numeric"
                  placeholder="e.g. 415"
                />
              </div>
            ) : (
              <div className={styles.field}>
                <label>Area code</label>
                <p className={styles.fieldHint}>
                  Area code filtering is for US and Canada.
                </p>
              </div>
            )}
            <div className={styles.buyActions}>
              <button
                type="button"
                className={styles.ghostBtn}
                disabled={!configured || busy}
                onClick={() => searchMutation.mutate()}
              >
                {searchMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Search
              </button>
              <button
                type="button"
                className={styles.refreshBtn}
                disabled={!selectedBuyNumber || busy}
                onClick={() => {
                  if (selectedBuyNumber) {
                    purchaseMutation.mutate(selectedBuyNumber);
                  }
                }}
              >
                {purchaseMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {purchaseMutation.isPending ? "Buying…" : "Buy number"}
              </button>
            </div>
          </div>

          {searchMutation.isPending ? (
            <div className={styles.loadingBox}>
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : null}

          {!searched && !searchMutation.isPending ? (
            <p className={styles.empty}>
              Search by country to see numbers you can buy.
            </p>
          ) : null}

          {searched &&
          !searchMutation.isPending &&
          available.length === 0 ? (
            <p className={styles.empty}>
              No numbers matched that search. Try another country or area code.
            </p>
          ) : null}

          {available.length > 0 ? (
            <div className={styles.buyTableWrap}>
              <table className={styles.buyTable}>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Type</th>
                    <th colSpan={4}>
                      <div className="mb-1">Capabilities</div>
                      <div className="grid grid-cols-4 gap-1 text-[0.65rem] font-medium text-[#94a3b8]">
                        <span className="flex justify-center">
                          <Phone className="size-3.5" aria-hidden />
                        </span>
                        <span className="flex justify-center">
                          <MessageSquare className="size-3.5" aria-hidden />
                        </span>
                        <span className="flex justify-center">
                          <ImageIcon className="size-3.5" aria-hidden />
                        </span>
                        <span className="flex justify-center">
                          <Printer className="size-3.5" aria-hidden />
                        </span>
                      </div>
                    </th>
                    <th>Address</th>
                    <th>Monthly fee</th>
                    <th>
                      <span className="sr-only">Select</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {available.map((option) => {
                    const active = selectedBuyNumber === option.phoneNumber;
                    const place = formatBuyNumberPlace(option);
                    const caps = option.capabilities;
                    return (
                      <tr
                        key={option.phoneNumber}
                        style={{
                          background: active ? "#fff5f6" : undefined,
                        }}
                      >
                        <td>
                          <div className={styles.cellMain}>
                            {formatBuyNumberDisplay(option.phoneNumber)}
                          </div>
                          {place ? (
                            <div className={styles.cellMeta}>{place}</div>
                          ) : null}
                        </td>
                        <td>{option.numberType || "Local"}</td>
                        <td colSpan={4}>
                          <div className="grid grid-cols-4 gap-1">
                            <span className="flex justify-center">
                              {caps.voice ? (
                                <Phone className="size-4" />
                              ) : (
                                <span className="size-4" />
                              )}
                            </span>
                            <span className="flex justify-center">
                              {caps.sms ? (
                                <MessageSquare className="size-4" />
                              ) : (
                                <span className="size-4" />
                              )}
                            </span>
                            <span className="flex justify-center">
                              {caps.mms ? (
                                <ImageIcon className="size-4" />
                              ) : (
                                <span className="size-4" />
                              )}
                            </span>
                            <span className="flex justify-center">
                              {caps.fax ? (
                                <Printer className="size-4" />
                              ) : (
                                <span className="size-4" />
                              )}
                            </span>
                          </div>
                        </td>
                        <td>{option.addressRequirement || "None"}</td>
                        <td className={styles.cellMain}>
                          {option.monthlyFee || "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setSelectedBuyNumber(option.phoneNumber)
                            }
                            className={`${styles.selectBtn} ${
                              active ? styles.selectBtnActive : ""
                            }`}
                          >
                            {active ? "Selected" : "Select"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
