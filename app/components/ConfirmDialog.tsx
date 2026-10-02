"use client";

/**
 * Change: dialog width is dynamic (sm/md/lg) from content, with optional size override.
 * Why: shared confirm panels used one width for every message and looked uneven.
 * Related: app/lib/dialog-panel-size.ts, DeleteConfirmationDialog.tsx
 */

import { AlertTriangle, Check, type LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DIALOG_PANEL_ALERT_SIZE,
  reactNodeToPlainText,
  resolveDialogPanelSize,
  type DialogPanelSizeProp,
} from "@/app/lib/dialog-panel-size";

export type ConfirmDialogTone = "danger" | "warning" | "primary";

const toneMeta = {
  danger: {
    eyebrow: "Access change",
    iconWrap: "border-red-200/80 bg-red-50 text-red-500",
  },
  warning: {
    eyebrow: "Please confirm",
    iconWrap: "border-amber-200/80 bg-amber-50 text-amber-700",
  },
  primary: {
    eyebrow: "Confirm action",
    iconWrap: "border-[#dbe7f8] bg-[#eff6ff] text-[#1877f2]",
  },
} as const;

export function ConfirmDialog({
  open,
  title,
  titleId: _titleIdProp,
  description,
  icon: Icon = AlertTriangle,
  tone = "danger",
  size = "auto",
  zIndex = 60,
  panelClassName = "",
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
  /** Override auto width: sm | md | lg | auto (from content). */
  size?: DialogPanelSizeProp;
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
  const checkboxId = useId();
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const meta = toneMeta[tone];

  useEffect(() => {
    if (!open) setCheckboxChecked(false);
  }, [open]);

  const needsCheckbox = confirmCheckbox != null;
  const confirmBlocked =
    confirmDisabled || isLoading || (needsCheckbox && !checkboxChecked);

  const alertSize = useMemo(() => {
    const contentText = [
      title,
      reactNodeToPlainText(description),
      confirmCheckbox?.label ?? "",
      confirmLabel,
    ].join(" ");
    return DIALOG_PANEL_ALERT_SIZE[resolveDialogPanelSize(size, contentText)];
  }, [size, title, description, confirmCheckbox?.label, confirmLabel]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) onCancel();
      }}
    >
      <AlertDialogContent
        size={alertSize}
        style={{ zIndex }}
        className={`gap-0 overflow-hidden p-0 ${panelClassName}`}
      >
        <AlertDialogHeader className="place-items-start gap-0 space-y-0 p-6 text-left sm:p-7">
          <div
            className={`mb-5 flex size-11 items-center justify-center rounded-2xl border ${meta.iconWrap}`}
          >
            <Icon className="size-5" strokeWidth={2.25} aria-hidden />
          </div>

          <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {meta.eyebrow}
          </p>
          <AlertDialogTitle className="mt-1.5 text-lg font-semibold tracking-tight text-[#07111f]">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </AlertDialogDescription>

          {needsCheckbox ? (
            <label
              htmlFor={checkboxId}
              className="mt-5 flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3.5 transition hover:border-[#dbe7f8] hover:bg-[#f4f8ff]"
            >
              <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checkboxChecked}
                  disabled={isLoading}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                  className="peer absolute inset-0 size-5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <span className="flex size-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-transparent transition peer-checked:border-[#1877f2] peer-checked:bg-[#1877f2] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#1877f2]/30 peer-disabled:opacity-50">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-5 text-slate-700">
                {confirmCheckbox.label}
              </span>
            </label>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
          <AlertDialogCancel
            disabled={isLoading}
            autoFocus={autoFocusCancel}
            onClick={onCancel}
            className="h-10 rounded-xl"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmBlocked}
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            className="h-10 min-w-[8rem] rounded-xl"
          >
            {isLoading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
