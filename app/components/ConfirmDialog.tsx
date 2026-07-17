"use client";

import { AlertTriangle, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

export type ConfirmDialogTone = "danger" | "warning" | "primary";

const toneMeta = {
  danger: {
    eyebrow: "Access change",
    className: "rp-confirm-dialog--primary",
  },
  warning: {
    eyebrow: "Please confirm",
    className: "rp-confirm-dialog--primary",
  },
  primary: {
    eyebrow: "Confirm action",
    className: "rp-confirm-dialog--primary",
  },
} as const;

export function ConfirmDialog({
  open,
  title,
  titleId: titleIdProp,
  description,
  icon: Icon = AlertTriangle,
  tone = "danger",
  zIndex = 60,
  panelClassName = "max-w-[38rem]",
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  loadingLabel,
  isLoading = false,
  confirmDisabled = false,
  confirmCheckbox,
  onCancel,
  onConfirm,
  autoFocusCancel = false,
}: {
  open: boolean;
  title: string;
  titleId?: string;
  description: ReactNode;
  tone?: ConfirmDialogTone;
  icon?: LucideIcon;
  zIndex?: number;
  panelClassName?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  confirmCheckbox?: { label: string };
  onCancel: () => void;
  onConfirm: () => void;
  autoFocusCancel?: boolean;
}) {
  const generatedTitleId = useId();
  const titleId = titleIdProp ?? generatedTitleId;
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const meta = toneMeta[tone];

  useEffect(() => {
    if (!open) {
      setCheckboxChecked(false);
      return;
    }
    if (isLoading) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const needsCheckbox = confirmCheckbox != null;
  const confirmBlocked =
    confirmDisabled || isLoading || (needsCheckbox && !checkboxChecked);

  return (
    <div
      className={`rp-confirm-dialog ${meta.className}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isLoading}
        onClick={onCancel}
        className="rp-confirm-dialog__backdrop"
      />

      <div className={`rp-confirm-dialog__panel ${panelClassName}`}>
        <div className="rp-confirm-dialog__accent" aria-hidden />
        <div className="rp-confirm-dialog__glow" aria-hidden />

        <header className="rp-confirm-dialog__header">
          <div className="rp-confirm-dialog__heading">
            <span className="rp-confirm-dialog__icon" aria-hidden>
              <Icon className="size-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="rp-confirm-dialog__eyebrow">{meta.eyebrow}</p>
              <h2 id={titleId} className="rp-confirm-dialog__title">
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rp-confirm-dialog__close"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="rp-confirm-dialog__body">
          <div className="rp-confirm-dialog__message">{description}</div>

          {needsCheckbox ? (
            <label className="rp-confirm-dialog__checkbox">
              <span className="rp-confirm-dialog__checkbox-control">
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  disabled={isLoading}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                />
                <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="rp-confirm-dialog__checkbox-label">
                {confirmCheckbox.label}
              </span>
            </label>
          ) : null}
        </div>

        <footer className="rp-confirm-dialog__footer">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            autoFocus={autoFocusCancel}
            className="rp-confirm-dialog__cancel"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmBlocked}
            onClick={onConfirm}
            className="rp-confirm-dialog__confirm"
          >
            {isLoading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
