"use client";

import { AlertTriangle, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmDialogTone = "danger" | "warning" | "primary";

const toneMeta = {
  danger: {
    eyebrow: "Access change",
  },
  warning: {
    eyebrow: "Please confirm",
  },
  primary: {
    eyebrow: "Confirm action",
  },
} as const;

export function ConfirmDialog({
  open,
  title,
  titleId: _titleIdProp,
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
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const meta = toneMeta[tone];

  useEffect(() => {
    if (!open) setCheckboxChecked(false);
  }, [open]);

  const needsCheckbox = confirmCheckbox != null;
  const confirmBlocked =
    confirmDisabled || isLoading || (needsCheckbox && !checkboxChecked);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) onCancel();
      }}
    >
      <AlertDialogContent
        style={{ zIndex }}
        className={`max-w-[min(100%,38rem)] gap-0 p-0 sm:max-w-[min(100%,38rem)] ${panelClassName}`}
      >
        <AlertDialogHeader className="place-items-start gap-3 p-5 text-left sm:p-6">
          <AlertDialogMedia className="mb-0 size-11 rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800">
            <Icon className="size-5" strokeWidth={2.25} />
          </AlertDialogMedia>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-400">
              {meta.eyebrow}
            </p>
            <AlertDialogTitle className="mt-1 text-base font-semibold text-zinc-900">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm text-zinc-600">
              {description}
            </AlertDialogDescription>

            {needsCheckbox ? (
              <label className="mt-4 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  disabled={isLoading}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                  className="size-4 rounded border-zinc-300 text-[#1877f2] focus:ring-[#1877f2]/30"
                />
                <span className="text-sm font-semibold text-zinc-900">
                  {confirmCheckbox.label}
                </span>
              </label>
            ) : null}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-zinc-100 bg-zinc-50/80">
          <AlertDialogCancel
            disabled={isLoading}
            autoFocus={autoFocusCancel}
            onClick={onCancel}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmBlocked}
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {isLoading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
