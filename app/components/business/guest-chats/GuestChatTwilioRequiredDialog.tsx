"use client";

import Link from "next/link";
import { PhoneOff } from "lucide-react";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type GuestChatTwilioRequiredDialogProps = {
  open: boolean;
  businessId: number;
  onClose: () => void;
};

export function GuestChatTwilioRequiredDialog({
  open,
  businessId,
  onClose,
}: GuestChatTwilioRequiredDialogProps) {
  const integrationsHref = businessSettingsHref(businessId, "integrations", {
    focus: "twilio",
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent
        style={{ zIndex: 80 }}
        className="gap-0 overflow-hidden p-0 sm:max-w-[420px]"
      >
        <AlertDialogHeader className="place-items-start gap-0 space-y-0 p-6 text-left sm:p-7">
          <div className="flex w-full items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#dbeafe] bg-[#eef5ff] text-[#1877f2]">
              <PhoneOff className="size-5" strokeWidth={2.25} aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Messaging
              </p>
              <AlertDialogTitle className="mt-1 text-lg font-semibold tracking-tight text-[#07111f]">
                No Twilio connected
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="mt-4 text-sm leading-6 text-slate-500">
            This business doesn&apos;t have a Twilio number selected yet. Open
            Integrations, choose a number for this business, then return here to
            send guest chat messages.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
          <AlertDialogCancel
            onClick={onClose}
            className="h-10 rounded-xl border-[#e2e8f0] bg-white px-4 text-slate-600 hover:bg-slate-50"
          >
            Close
          </AlertDialogCancel>
          <Link
            href={integrationsHref}
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1877f2] px-5 text-sm font-semibold text-white no-underline hover:bg-[#166fe0]"
          >
            Connect Twilio
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
