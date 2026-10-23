/**
 * What changed: Modal for super admins to assign a platform Twilio number to a business.
 * Why: Backend assign endpoint exists; Twilio panel needed a UI to pick the business.
 * Related: SuperAdminTwilioPanel, assignAdminTwilioNumber, getAdminBusinesses
 */

"use client";

import styles from "@/app/components/super-admin/SuperAdminTwilioPanel.module.css";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { adminQueryKeys } from "@/app/services/admin/admin-query-keys";
import { assignAdminTwilioNumber } from "@/app/services/admin/admin-twilio";
import { getAdminBusinesses } from "@/app/services/admin/get-admin-businesses";
import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { Building2, Check, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AdminTwilioAssignNumberModalProps = {
  open: boolean;
  configured: boolean;
  phoneNumber: string;
  currentBusinessName?: string | null;
  onClose: () => void;
  onAssigned: () => void | Promise<void>;
};

export function AdminTwilioAssignNumberModal({
  open,
  configured,
  phoneNumber,
  currentBusinessName,
  onClose,
  onAssigned,
}: AdminTwilioAssignNumberModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(
    null,
  );

  // Parent remounts this modal with a new key when the target number changes.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(query.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

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

  const businessesQuery = useQuery({
    queryKey: adminQueryKeys.businesses(1, debouncedSearch, 20, "all"),
    queryFn: () =>
      getAdminBusinesses({
        page: 1,
        limit: 20,
        search: debouncedSearch || undefined,
        onboarding: "all",
      }),
    enabled: open && hasAuthSession(),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const assignMutation = useMutation({
    mutationFn: (businessId: number) =>
      assignAdminTwilioNumber({ phoneNumber, businessId }),
    onSuccess: async (result) => {
      toast.success(
        `Assigned ${result.twilioPhoneNumber} to ${result.businessName || "business"}.`,
      );
      await onAssigned();
      onClose();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Could not assign that Twilio number."),
      );
    },
  });

  const items = businessesQuery.data?.items ?? [];
  const busy = assignMutation.isPending;
  const loadingBusinesses =
    businessesQuery.isLoading || businessesQuery.isFetching;

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
        className={`${styles.modalPanel} ${styles.assignModalPanel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sa-twilio-assign-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div className={styles.modalIcon} aria-hidden>
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 id="sa-twilio-assign-title" className={styles.modalTitle}>
                Assign number
              </h2>
              <p className={styles.modalHint}>
                Link <strong>{phoneNumber}</strong> to a business so they can
                send SMS.
                {currentBusinessName
                  ? ` Currently assigned to ${currentBusinessName}.`
                  : " This number is unassigned."}
              </p>
            </div>
          </div>
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
          <div className={styles.field}>
            <label htmlFor="sa-twilio-assign-search">Find business</label>
            <div className={styles.assignSearchWrap}>
              <Search className={styles.assignSearchIcon} aria-hidden />
              <input
                id="sa-twilio-assign-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={busy}
                placeholder="Search by name, email, or city…"
                autoComplete="off"
              />
            </div>
          </div>

          <div className={styles.assignList} role="listbox" aria-label="Businesses">
            {loadingBusinesses && items.length === 0 ? (
              <div className={styles.loadingBox}>
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : null}

            {!loadingBusinesses && items.length === 0 ? (
              <p className={styles.empty}>
                No businesses matched that search.
              </p>
            ) : null}

            {items.map((business) => {
              const selected = selectedBusinessId === business.id;
              const alreadyHasTwilio = business.twilioConnected;
              return (
                <button
                  key={business.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.assignOption} ${
                    selected ? styles.assignOptionSelected : ""
                  }`}
                  disabled={busy}
                  onClick={() => setSelectedBusinessId(business.id)}
                >
                  <span className={styles.assignOptionMain}>
                    <span className={styles.cellMain}>{business.name}</span>
                    <span className={styles.cellMeta}>
                      {[business.city, business.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                      {business.ownerEmail
                        ? ` · ${business.ownerEmail}`
                        : ""}
                    </span>
                  </span>
                  <span className={styles.assignOptionSide}>
                    {alreadyHasTwilio ? (
                      <span
                        className={`${styles.badge} ${styles.badgeMuted}`}
                        title="This business already has a Twilio number"
                      >
                        Has number
                      </span>
                    ) : null}
                    {selected ? (
                      <Check className="size-4 text-[#1877f2]" aria-hidden />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.assignFooter}>
            <button
              type="button"
              className={styles.ghostBtn}
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.refreshBtn}
              disabled={
                !configured || busy || selectedBusinessId == null
              }
              onClick={() => {
                if (selectedBusinessId == null) return;
                assignMutation.mutate(selectedBusinessId);
              }}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Building2 className="size-4" />
              )}
              {busy ? "Assigning…" : "Assign number"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
