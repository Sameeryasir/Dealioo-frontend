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
  AlertDialogMedia,
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
        style={{ zIndex: 70 }}
        className="max-w-md gap-0 p-0 sm:max-w-md"
      >
        <AlertDialogHeader className="place-items-start gap-4 p-5 text-left sm:p-6">
          <AlertDialogMedia className="mb-0 size-11 rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800">
            <AlertTriangle className="size-5" strokeWidth={2} />
          </AlertDialogMedia>
          <div className="min-w-0 flex-1">
            <AlertDialogTitle className="text-base font-semibold text-zinc-900">
              Deactivate before editing
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              This automation is active and running for guests. Please
              deactivate it first, then edit your flow.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-zinc-100 bg-zinc-50/80">
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>
            Got it
          </AlertDialogCancel>
          {onDeactivate ? (
            <AlertDialogAction
              disabled={isLoading}
              onClick={onDeactivate}
              className="h-10 rounded-xl bg-zinc-900 px-5 text-white hover:bg-black"
            >
              {isLoading ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
