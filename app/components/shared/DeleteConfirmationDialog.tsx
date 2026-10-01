"use client";

import { AlertTriangle, Check, Loader2, Trash2 } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
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

const DEFAULT_DESCRIPTION =
  "This can’t be undone. Once deleted, it is permanently removed.";

export type DeleteConfirmationDialogProps = {
  open: boolean;
  itemName: string;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  checkboxLabel?: string;
  isLoading?: boolean;
  zIndex?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmationDialog({
  open,
  itemName,
  title,
  description,
  confirmText = "Delete",
  checkboxLabel,
  isLoading = false,
  zIndex = 60,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const checkboxId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const displayName = itemName.trim() || "this item";
  const resolvedTitle = title ?? `Delete “${displayName}”?`;
  const resolvedDescription =
    description ?? (
      <>
        You’re about to delete{" "}
        <span className="font-semibold text-[#1877f2]">{displayName}</span>.{" "}
        {DEFAULT_DESCRIPTION}
      </>
    );
  const resolvedCheckboxLabel =
    checkboxLabel ?? `Yes, delete “${displayName}”`;
  const canDelete = confirmed && !isLoading;

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
      return;
    }
    setConfirmed(false);
  }, [open, itemName]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) onCancel();
      }}
    >
      <AlertDialogContent
        style={{ zIndex }}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[32rem]"
      >
        <AlertDialogHeader className="place-items-start gap-0 space-y-0 p-6 text-left sm:p-7">
          <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-red-200/80 bg-red-50 text-red-500">
            <AlertTriangle className="size-5" strokeWidth={2.25} aria-hidden />
          </div>

          <AlertDialogTitle className="text-lg font-semibold tracking-tight text-[#07111f]">
            {resolvedTitle}
          </AlertDialogTitle>

          <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
            {resolvedDescription}
          </AlertDialogDescription>

          <label
            htmlFor={checkboxId}
            className="mt-5 flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3.5 transition hover:border-[#dbe7f8] hover:bg-[#f4f8ff]"
          >
            <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
              <input
                id={checkboxId}
                type="checkbox"
                checked={confirmed}
                disabled={isLoading}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="peer absolute inset-0 size-5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <span className="flex size-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-transparent transition peer-checked:border-[#1877f2] peer-checked:bg-[#1877f2] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#1877f2]/30 peer-disabled:opacity-50">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium leading-5 text-slate-700">
              {resolvedCheckboxLabel}
            </span>
          </label>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
          <AlertDialogCancel
            disabled={isLoading}
            onClick={onCancel}
            className="h-10 rounded-xl"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete}
            onClick={onConfirm}
            className="h-10 min-w-[8.5rem] gap-1.5 rounded-xl bg-[#1877f2] text-white hover:bg-[#166fe5] disabled:bg-[#e2e8f0] disabled:text-slate-400"
          >
            {isLoading ? (
              <>
                <Loader2
                  className="size-3.5 animate-spin"
                  aria-hidden
                  strokeWidth={2}
                />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
                {confirmText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
