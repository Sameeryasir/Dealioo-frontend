"use client";

import { AlertTriangle } from "lucide-react";
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

export type DeactivateToEditDialogProps = {
  open: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onDeactivate?: () => void;
};

export function DeactivateToEditDialog({
  open,
  isLoading = false,
  onClose,
  onDeactivate,
}: DeactivateToEditDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) onClose();
      }}
    >
      <AlertDialogContent
        size="sm"
        style={{ zIndex: 70 }}
        className="gap-0 overflow-hidden p-0"
      >
        <AlertDialogHeader className="place-items-start gap-0 space-y-0 p-6 text-left sm:p-7">
          <div className="flex w-full items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-700">
              <AlertTriangle className="size-5" strokeWidth={2.25} aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Please confirm
              </p>
              <AlertDialogTitle className="mt-1 text-lg font-semibold tracking-tight text-[#07111f]">
                Deactivate before editing
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="mt-4 text-sm leading-6 text-slate-500">
            This automation is active and running for guests. Deactivate it
            first, then edit your flow.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
          <AlertDialogCancel
            disabled={isLoading}
            onClick={onClose}
            className="h-10 rounded-xl"
          >
            Got it
          </AlertDialogCancel>
          {onDeactivate ? (
            <AlertDialogAction
              disabled={isLoading}
              onClick={onDeactivate}
              className="h-10 rounded-xl bg-[#07111f] px-5 text-white hover:bg-black"
            >
              {isLoading ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
