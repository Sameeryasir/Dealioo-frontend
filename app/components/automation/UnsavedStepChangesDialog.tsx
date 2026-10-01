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
import { Button } from "@/components/ui/button";

export type UnsavedStepChangesDialogProps = {
  open: boolean;
  stepLabel?: string;
  isLoading?: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onActivate: () => void;
};

export function UnsavedStepChangesDialog({
  open,
  stepLabel,
  isLoading = false,
  onKeepEditing,
  onDiscard,
  onActivate,
}: UnsavedStepChangesDialogProps) {
  const label = stepLabel?.trim() || "this step";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isLoading) onKeepEditing();
      }}
    >
      <AlertDialogContent
        style={{ zIndex: 70 }}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[32rem]"
      >
        <AlertDialogHeader className="place-items-start gap-0 space-y-0 p-6 text-left sm:p-7">
          <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-700">
            <AlertTriangle className="size-5" strokeWidth={2.25} aria-hidden />
          </div>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight text-[#07111f]">
            Unsaved step changes
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
            You edited{" "}
            <span className="font-semibold text-[#1877f2]">{label}</span> but
            didn’t save. Discard those edits, or activate to save everything and
            turn the automation on.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:flex-col sm:px-7">
          <AlertDialogAction
            disabled={isLoading}
            onClick={onActivate}
            className="h-10 w-full rounded-xl bg-[#07111f] text-white hover:bg-black"
          >
            {isLoading ? "Activating…" : "Activate automation"}
          </AlertDialogAction>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              disabled={isLoading}
              autoFocus
              onClick={onKeepEditing}
              className="h-10 rounded-xl sm:min-w-[7rem]"
            >
              Keep editing
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onDiscard}
              className="h-10 rounded-xl sm:min-w-[7rem]"
            >
              Discard changes
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
