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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_DESCRIPTION =
  "This action cannot be undone. Once deleted, this item will be permanently removed from the system.";

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
  const resolvedTitle = title ?? `Delete ${itemName}?`;
  const resolvedDescription =
    description ?? (
      <>
        <span className="font-semibold text-[#1877f2]">{itemName}</span>,{" "}
        {DEFAULT_DESCRIPTION}
      </>
    );
  const resolvedCheckboxLabel =
    checkboxLabel ?? `Are you sure you want to delete ${itemName}?`;
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
        className="max-w-xl gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <AlertDialogHeader className="place-items-start gap-3 p-5 text-left sm:p-6">
          <AlertDialogMedia className="mb-0 size-10 rounded-xl border border-red-200/90 bg-gradient-to-br from-red-50 to-[#fff1f2] text-red-500">
            <AlertTriangle className="size-4.5" strokeWidth={2.25} />
          </AlertDialogMedia>
          <div className="min-w-0 flex-1">
            <AlertDialogTitle className="text-[1rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.05rem]">
              {resolvedTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 max-w-lg text-[0.82rem] leading-relaxed text-slate-500 sm:text-[0.85rem]">
              {resolvedDescription}
            </AlertDialogDescription>
            <label
              htmlFor={checkboxId}
              className="mt-3.5 flex cursor-pointer items-center gap-3"
            >
              <span className="relative flex size-4.5 shrink-0 items-center justify-center">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={confirmed}
                  disabled={isLoading}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="peer absolute inset-0 size-4.5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <span className="flex size-4.5 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-transparent shadow-sm transition peer-checked:border-[#1877f2] peer-checked:bg-[#1877f2] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#1877f2]/30 peer-disabled:opacity-50">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              </span>
              <span className="text-[0.82rem] font-bold leading-none text-[#07111f] sm:text-[0.85rem]">
                {resolvedCheckboxLabel}
              </span>
            </label>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-[#e8edf5] bg-gradient-to-r from-white via-[#f8fbff] to-white">
          <AlertDialogCancel disabled={isLoading} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete}
            onClick={onConfirm}
            className="min-w-[7.5rem] gap-1.5 bg-gradient-to-r from-[#1877f2] to-[#166fe5] text-white hover:bg-[#1877f2] hover:brightness-105 disabled:bg-none disabled:bg-[#f1f5f9] disabled:text-slate-400"
          >
            {isLoading ? (
              <>
                <Loader2
                  className="size-3.5 animate-spin"
                  aria-hidden
                  strokeWidth={2}
                />
                Deleting...
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
