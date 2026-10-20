"use client";

import styles from "@/app/components/SuperAdminDashboard.module.css";
import {
  BUSINESS_CURRENCY_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
} from "@/app/lib/business-type-currency";
import type { AdminMeetingRequest } from "@/app/services/admin/get-admin-meeting-requests";
import type { CreateAccountFromMeetingInput } from "@/app/services/admin/customer-onboarding";
import {
  ArrowRight,
  Link2,
  Store,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type ExistingUserConflictState = {
  message: string;
  existingUser: { id: number; name: string; email: string };
  businesses: Array<{ id: number; name: string; slug: string }>;
};

type Draft = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string;
  businessType: string;
  phoneNumber: string;
  businessEmail: string;
  websiteUrl: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  currency: string;
};

function buildDraft(meeting: AdminMeetingRequest): Draft {
  const customerName =
    `${meeting.firstName} ${meeting.lastName}`.trim() || meeting.email;
  const customerPhone = meeting.phone?.trim() || "";
  const phoneNumber =
    meeting.businessPhone?.trim() || customerPhone || "";
  return {
    customerName,
    customerEmail: meeting.email.trim().toLowerCase(),
    customerPhone,
    businessName: meeting.businessName?.trim() || customerName,
    businessType: meeting.businessCategory?.trim() || "Business",
    phoneNumber,
    businessEmail: (
      meeting.businessEmail?.trim() ||
      meeting.email.trim() ||
      ""
    ).toLowerCase(),
    websiteUrl: meeting.website?.trim() || "",
    city: meeting.cityLocation?.trim() || "",
    state: meeting.state?.trim() || "",
    country: meeting.country?.trim() || "",
    postalCode: meeting.postalCode?.trim() || "",
    currency: (meeting.currency?.trim() || "USD").toUpperCase(),
  };
}

function toCreateInput(draft: Draft): CreateAccountFromMeetingInput {
  return {
    customerName: draft.customerName.trim(),
    customerEmail: draft.customerEmail.trim().toLowerCase(),
    customerPhone: draft.customerPhone.trim() || undefined,
    businessName: draft.businessName.trim(),
    businessType: draft.businessType.trim(),
    phoneNumber: draft.phoneNumber.trim(),
    businessEmail: draft.businessEmail.trim().toLowerCase() || undefined,
    websiteUrl: draft.websiteUrl.trim() || undefined,
    city: draft.city.trim() || undefined,
    state: draft.state.trim() || undefined,
    country: draft.country.trim() || undefined,
    postalCode: draft.postalCode.trim() || undefined,
    currency: draft.currency.trim().toUpperCase() || "USD",
  };
}

export function CreateAccountConfirmModal({
  meeting,
  busy,
  existingUserConflict,
  onClearExistingUserConflict,
  onClose,
  onConfirm,
}: {
  meeting: AdminMeetingRequest;
  busy: boolean;
  existingUserConflict: ExistingUserConflictState | null;
  onClearExistingUserConflict: () => void;
  onClose: () => void;
  onConfirm: (input: CreateAccountFromMeetingInput) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => buildDraft(meeting));
  const [linkBusinessId, setLinkBusinessId] = useState<number | "">("");

  useEffect(() => {
    setDraft(buildDraft(meeting));
    setLinkBusinessId("");
  }, [meeting.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const phoneOk = draft.phoneNumber.trim().length > 0;
  const emailOk = draft.customerEmail.trim().includes("@");
  const canSubmit = phoneOk && emailOk && !busy;

  const typeOptions = useMemo(() => {
    const current = draft.businessType.trim();
    if (
      current &&
      !BUSINESS_TYPE_OPTIONS.some((option) => option.value === current)
    ) {
      return [
        { value: current, label: current },
        ...BUSINESS_TYPE_OPTIONS,
      ];
    }
    return [...BUSINESS_TYPE_OPTIONS];
  }, [draft.businessType]);

  const patch = (partial: Partial<Draft>) => {
    if (existingUserConflict) onClearExistingUserConflict();
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div
      className={styles.userModalBackdrop}
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <section
        className={styles.meetingConfirmPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.meetingConfirmHeader}>
          <div className={styles.meetingConfirmHeaderMain}>
            <span className={styles.meetingConfirmHeroIcon} aria-hidden>
              <UserRoundPlus className="size-5" strokeWidth={2.25} />
            </span>
            <div className={styles.meetingConfirmHeaderCopy}>
              <p className={styles.meetingConfirmEyebrow}>Customer onboarding</p>
              <h2 id="create-account-title">Create customer account</h2>
              <p className={styles.meetingConfirmLead}>
                Edit any details below before creating. Confirming creates the
                customer login and their business from this meeting.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.meetingModalClose}
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className={styles.meetingConfirmBody}>
          <section className={styles.meetingConfirmSection}>
            <div className={styles.meetingConfirmSectionHead}>
              <span
                className={`${styles.meetingConfirmSectionIcon} ${styles.meetingConfirmSectionIconBlue}`}
                aria-hidden
              >
                <UserRound className="size-3.5" strokeWidth={2.25} />
              </span>
              <h3 className={styles.meetingConfirmSectionTitle}>
                Customer account
              </h3>
            </div>
            <div className={styles.meetingConfirmFormGrid}>
              <label className={styles.meetingConfirmFormField}>
                Name
                <input
                  type="text"
                  value={draft.customerName}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ customerName: event.target.value })
                  }
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                Email
                <input
                  type="email"
                  value={draft.customerEmail}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ customerEmail: event.target.value })
                  }
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                Phone
                <input
                  type="tel"
                  value={draft.customerPhone}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ customerPhone: event.target.value })
                  }
                />
              </label>
            </div>
          </section>

          <section className={styles.meetingConfirmSection}>
            <div className={styles.meetingConfirmSectionHead}>
              <span
                className={`${styles.meetingConfirmSectionIcon} ${styles.meetingConfirmSectionIconPurple}`}
                aria-hidden
              >
                <Store className="size-3.5" strokeWidth={2.25} />
              </span>
              <h3 className={styles.meetingConfirmSectionTitle}>Business</h3>
            </div>
            <div className={styles.meetingConfirmFormGrid}>
              <label className={styles.meetingConfirmFormField}>
                Business name
                <input
                  type="text"
                  value={draft.businessName}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ businessName: event.target.value })
                  }
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                Business type
                <select
                  value={draft.businessType}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ businessType: event.target.value })
                  }
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.meetingConfirmFormField}>
                Business phone
                <input
                  type="tel"
                  value={draft.phoneNumber}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ phoneNumber: event.target.value })
                  }
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                Business email
                <input
                  type="email"
                  value={draft.businessEmail}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ businessEmail: event.target.value })
                  }
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                Currency
                <select
                  value={draft.currency}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ currency: event.target.value.toUpperCase() })
                  }
                >
                  {BUSINESS_CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.meetingConfirmFormField}>
                Website
                <input
                  type="url"
                  value={draft.websiteUrl}
                  disabled={busy}
                  onChange={(event) =>
                    patch({ websiteUrl: event.target.value })
                  }
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                City
                <input
                  type="text"
                  value={draft.city}
                  disabled={busy}
                  onChange={(event) => patch({ city: event.target.value })}
                />
              </label>
              <label className={styles.meetingConfirmFormField}>
                Country
                <input
                  type="text"
                  value={draft.country}
                  disabled={busy}
                  onChange={(event) => patch({ country: event.target.value })}
                />
              </label>
            </div>
          </section>

          {!phoneOk ? (
            <p className={styles.meetingConfirmWarning}>
              A business phone number is required before creating the account.
            </p>
          ) : null}

          {existingUserConflict ? (
            <section className={styles.meetingConfirmExisting}>
              <div className={styles.meetingConfirmExistingHead}>
                <Link2 className="size-4" strokeWidth={2.25} aria-hidden />
                <div>
                  <h3>Email already exists</h3>
                  <p>
                    {existingUserConflict.existingUser.name} (
                    {existingUserConflict.existingUser.email}) already has an
                    account. Choose how to continue — nothing was created yet.
                  </p>
                </div>
              </div>

              {existingUserConflict.businesses.length > 0 ? (
                <label className={styles.meetingConfirmFormField}>
                  Link an existing business (optional)
                  <select
                    value={linkBusinessId === "" ? "" : String(linkBusinessId)}
                    disabled={busy}
                    onChange={(event) => {
                      const value = event.target.value;
                      setLinkBusinessId(value ? Number(value) : "");
                    }}
                  >
                    <option value="">Create a new business instead</option>
                    {existingUserConflict.businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className={styles.meetingConfirmExistingHint}>
                  This user has no businesses yet. You can still attach them and
                  create a new business from this meeting.
                </p>
              )}

              <div className={styles.meetingConfirmExistingActions}>
                <button
                  type="button"
                  className={styles.meetingConfirmCancel}
                  disabled={busy}
                  onClick={onClearExistingUserConflict}
                >
                  Change email
                </button>
                <button
                  type="button"
                  className={styles.meetingConfirmSubmit}
                  disabled={!canSubmit}
                  onClick={() => {
                    const base = toCreateInput(draft);
                    if (linkBusinessId !== "") {
                      onConfirm({
                        ...base,
                        existingUserAction: "link_existing_business",
                        linkBusinessId,
                      });
                      return;
                    }
                    onConfirm({
                      ...base,
                      existingUserAction: "link_and_create_business",
                    });
                  }}
                >
                  {busy
                    ? "Creating…"
                    : linkBusinessId !== ""
                      ? "Link existing business"
                      : "Use existing user + new business"}
                  {!busy ? (
                    <ArrowRight
                      className="size-4"
                      strokeWidth={2.4}
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>
            </section>
          ) : null}
        </div>

        {!existingUserConflict ? (
          <footer className={styles.meetingConfirmFooter}>
            <button
              type="button"
              className={styles.meetingConfirmCancel}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.meetingConfirmSubmit}
              disabled={!canSubmit}
              onClick={() => onConfirm(toCreateInput(draft))}
            >
              {busy ? "Creating…" : "Confirm & create"}
              {!busy ? (
                <ArrowRight className="size-4" strokeWidth={2.4} aria-hidden />
              ) : null}
            </button>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
