"use client";

/**
 * Change summary:
 * - What: Rebuilt the delete-business dialog into a dedicated danger confirmation UI.
 * - Why: The shared blue ConfirmDialog felt weak for a permanent delete action.
 * - Related: BusinessDashboardCard.tsx
 * - MCP: Context 7 — clear irreversible-action UX with typed confirmation.
 */

import { Building2, Loader2, ShieldAlert, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

export type DeleteBusinessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
};

const LOSS_ITEMS = [
  "Campaigns, funnels, and customer records",
  "Team member access for this location",
  "Connected ads, payments, and scan history",
] as const;

export default function DeleteBusinessDialog({
  open,
  onOpenChange,
  businessName,
  isLoading = false,
  onConfirm,
}: DeleteBusinessDialogProps) {
  const titleId = useId();
  const inputId = useId();
  const [typedName, setTypedName] = useState("");

  const normalizedTarget = useMemo(
    () => businessName.trim().toLowerCase(),
    [businessName],
  );
  const canDelete =
    typedName.trim().toLowerCase() === normalizedTarget &&
    normalizedTarget.length > 0 &&
    !isLoading;

  useEffect(() => {
    if (!open) {
      setTypedName("");
      return;
    }

    if (isLoading) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="delete-biz-dialog fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* --- Backdrop --- */}
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isLoading}
        onClick={() => onOpenChange(false)}
        className="delete-biz-dialog__backdrop absolute inset-0 cursor-default"
      />

      {/* --- Panel --- */}
      <div className="delete-biz-dialog__panel relative w-full max-w-[28rem] overflow-hidden">
        <div className="delete-biz-dialog__glow" aria-hidden />

        <header className="relative px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <span className="delete-biz-dialog__icon" aria-hidden>
                <ShieldAlert className="size-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="delete-biz-dialog__eyebrow">Permanent action</p>
                <h2 id={titleId} className="delete-biz-dialog__title">
                  Delete this business?
                </h2>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="delete-biz-dialog__close"
              aria-label="Close"
            >
              <X className="size-4" strokeWidth={2.25} />
            </button>
          </div>

          <div className="delete-biz-dialog__target mt-4">
            <span className="delete-biz-dialog__target-icon" aria-hidden>
              <Building2 className="size-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="delete-biz-dialog__target-label">You are deleting</p>
              <p className="delete-biz-dialog__target-name" title={businessName}>
                {businessName}
              </p>
            </div>
          </div>
        </header>

        <div className="relative px-5 sm:px-6">
          <p className="delete-biz-dialog__lead">
            This cannot be undone. Everything tied to this location will be removed
            from your workspace.
          </p>

          <ul className="delete-biz-dialog__list" aria-label="What will be deleted">
            {LOSS_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {/* --- Typed confirmation (business rule: exact name required) --- */}
          <label htmlFor={inputId} className="delete-biz-dialog__field-label">
            Type <span>{businessName}</span> to confirm
          </label>
          <input
            id={inputId}
            type="text"
            value={typedName}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
            placeholder={businessName}
            onChange={(event) => setTypedName(event.target.value)}
            className="delete-biz-dialog__input"
          />
        </div>

        <footer className="relative mt-5 flex flex-col-reverse gap-2 border-t border-[#f1d5d5] bg-[#fff8f8] px-5 py-4 sm:mt-6 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="delete-biz-dialog__cancel"
          >
            Keep business
          </button>
          <button
            type="button"
            disabled={!canDelete}
            onClick={() => {
              void onConfirm();
            }}
            className="delete-biz-dialog__confirm"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
                Deleting…
              </>
            ) : (
              "Delete forever"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
