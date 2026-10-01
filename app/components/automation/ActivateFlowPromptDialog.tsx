"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ActivateFlowPromptDialogProps = {
  open: boolean;
  isLoading?: boolean;
  onStay: () => void;
  onActivate: () => void;
};

export function ActivateFlowPromptDialog({
  open,
  isLoading = false,
  onStay,
  onActivate,
}: ActivateFlowPromptDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) onStay();
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
              Please activate your flow
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              You have unsaved changes. Save your step settings and activate
              your flow before leaving this page.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-zinc-100 bg-zinc-50/80">
          <AlertDialogAction
            disabled={isLoading}
            onClick={onActivate}
            className="h-10 rounded-xl bg-zinc-900 px-5 text-white hover:bg-black"
          >
            {isLoading ? "Activating…" : "Activate flow"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
