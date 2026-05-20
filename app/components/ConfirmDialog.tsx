"use client";

import { AlertTriangle, type LucideIcon } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

export type ConfirmDialogTone = "danger" | "warning";

export function ConfirmDialog({
  open,
  title,
  titleId: titleIdProp,
  description,
  icon: Icon = AlertTriangle,
  zIndex = 60,
  panelClassName = "max-w-lg",
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
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
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
        className="absolute inset-0 cursor-default bg-zinc-900/60 backdrop-blur-[3px]"
      />

      <div
        className={`relative w-full overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-[0_24px_64px_-16px_rgba(0,0,0,0.28)] ring-1 ring-zinc-950/[0.06] ${panelClassName}`}
      >
        <div className="h-1 bg-zinc-900" aria-hidden />

        <div className="px-8 pb-7 pt-8">
          <div className="flex gap-5">
            <span
              className="flex size-[3.75rem] shrink-0 items-center justify-center rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50 to-white text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-zinc-950/[0.04]"
              aria-hidden
            >
              <Icon className="size-7" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Confirm action
              </p>
              <h2
                id={titleId}
                className="mt-1.5 text-[1.375rem] font-semibold leading-tight tracking-tight text-zinc-900"
              >
                {title}
              </h2>
              <div className="mt-3 text-[0.9375rem] leading-relaxed text-zinc-500">
                {description}
              </div>
            </div>
          </div>

          {needsCheckbox ? (
            <label className="mt-7 flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 px-5 py-4 transition hover:border-zinc-300 hover:bg-zinc-50">
              <span className="relative flex size-5 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  disabled={isLoading}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                  className="peer size-5 cursor-pointer appearance-none rounded-[0.35rem] border-2 border-zinc-400 bg-white transition checked:border-zinc-900 checked:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <svg
                  className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[0.9375rem] font-medium leading-snug text-zinc-800 select-none">
                {confirmCheckbox.label}
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 px-8 py-5 sm:flex-row sm:justify-end sm:gap-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            autoFocus={autoFocusCancel}
            className="h-12 cursor-pointer rounded-xl border border-zinc-300 bg-white px-7 text-[0.9375rem] font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[9rem]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmBlocked}
            onClick={onConfirm}
            className={`h-12 cursor-pointer rounded-xl px-7 text-[0.9375rem] font-semibold transition disabled:cursor-not-allowed sm:min-w-[9rem] ${
              confirmBlocked
                ? "bg-zinc-200 text-zinc-400 shadow-none"
                : "bg-zinc-900 text-white shadow-md shadow-zinc-900/25 hover:bg-black active:scale-[0.98]"
            }`}
          >
            {isLoading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
