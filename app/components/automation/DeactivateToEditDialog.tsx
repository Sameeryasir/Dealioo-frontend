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
          <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-700">
            <AlertTriangle className="size-5" strokeWidth={2.25} aria-hidden />
          </div>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight text-[#07111f]">
            Deactivate before editing
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
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
