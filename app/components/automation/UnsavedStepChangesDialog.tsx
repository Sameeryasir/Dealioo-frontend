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
        className="max-w-[26rem] gap-0 overflow-hidden p-0 sm:max-w-[26rem]"
      >
        <div className="h-0.5 bg-amber-500" aria-hidden />

        <AlertDialogHeader className="place-items-start gap-4 p-5 text-left sm:px-6 sm:pt-5 sm:pb-4">
          <AlertDialogMedia className="mb-0 size-11 rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800">
            <AlertTriangle className="size-5" strokeWidth={2} />
          </AlertDialogMedia>
          <div className="min-w-0 flex-1">
            <AlertDialogTitle className="text-base font-semibold text-zinc-900">
              Unsaved step changes
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              You edited{" "}
              <span className="font-medium text-zinc-700">{label}</span> but did
              not save. Discard those edits or activate the automation to save
              everything and turn it on.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 border-t border-zinc-100 bg-zinc-50/50 sm:flex-col">
          <AlertDialogAction
            disabled={isLoading}
            onClick={onActivate}
            className="h-10 w-full rounded-lg bg-zinc-900 text-white hover:bg-black"
          >
            {isLoading ? "Activating…" : "Activate automation"}
          </AlertDialogAction>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              disabled={isLoading}
              autoFocus
              onClick={onKeepEditing}
              className="h-10 sm:min-w-[6.5rem]"
            >
              Keep editing
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onDiscard}
              className="h-10 sm:min-w-[6.5rem]"
            >
              Discard changes
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
