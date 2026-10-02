"use client";

import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DIALOG_PANEL_ALERT_SIZE,
  resolveDialogPanelSize,
} from "@/app/lib/dialog-panel-size";

export function OverviewAlertDialog({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  const alertSize = useMemo(
    () =>
      DIALOG_PANEL_ALERT_SIZE[
        resolveDialogPanelSize("auto", `Something went wrong ${message}`)
      ],
    [message],
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent
        size={alertSize}
        style={{ zIndex: 70 }}
        className="gap-0 overflow-hidden p-0"
      >
        <AlertDialogHeader className="place-items-start gap-0 space-y-0 p-6 text-left sm:p-7">
          <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-red-200/80 bg-red-50 text-red-500">
            <AlertCircle className="size-5" strokeWidth={2.25} aria-hidden />
          </div>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight text-[#07111f]">
            Something went wrong
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
          <AlertDialogAction
            onClick={onClose}
            className="h-10 rounded-xl bg-[#07111f] px-5 text-white hover:bg-black"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
