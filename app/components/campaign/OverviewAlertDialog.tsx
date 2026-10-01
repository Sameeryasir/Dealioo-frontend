"use client";

import { AlertCircle } from "lucide-react";
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

export function OverviewAlertDialog({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent
        style={{ zIndex: 70 }}
        className="max-w-md gap-0 p-0 sm:max-w-md"
      >
        <AlertDialogHeader className="place-items-start gap-4 p-5 text-left sm:p-6">
          <AlertDialogMedia className="mb-0 size-11 rounded-xl border border-red-200/80 bg-red-50 text-red-700">
            <AlertCircle className="size-5" strokeWidth={2} />
          </AlertDialogMedia>
          <div className="min-w-0 flex-1">
            <AlertDialogTitle className="text-base font-semibold text-zinc-900">
              Something went wrong
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              {message}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-zinc-100 bg-zinc-50/80">
          <AlertDialogAction
            onClick={onClose}
            className="h-10 rounded-xl bg-zinc-900 px-5 text-white hover:bg-black"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
