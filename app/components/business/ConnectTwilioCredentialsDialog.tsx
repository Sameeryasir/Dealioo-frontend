"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useConnectBusinessTwilioCredentialsMutation } from "@/app/hooks/use-business-twilio-phone-numbers-query";
import { automationEase } from "@/app/lib/motion";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";

type ConnectTwilioCredentialsDialogProps = {
  open: boolean;
  businessId: number;
  onClose: () => void;
  onConnected: (result: {
    accountSidMasked: string | null;
    selectedPhoneNumber: string | null;
  }) => void | Promise<void>;
};

export function ConnectTwilioCredentialsDialog({
  open,
  businessId,
  onClose,
  onConnected,
}: ConnectTwilioCredentialsDialogProps) {
  const titleId = useId();
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const connectMutation = useConnectBusinessTwilioCredentialsMutation(businessId);

  useEffect(() => {
    if (!open) {
      setAccountSid("");
      setAuthToken("");
      setLocalError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || connectMutation.isPending) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, connectMutation.isPending, onClose]);

  if (typeof document === "undefined") return null;

  const busy = connectMutation.isPending;

  const handleSubmit = async () => {
    setLocalError(null);
    const sid = accountSid.trim();
    const token = authToken.trim();
    if (!sid || !token) {
      setLocalError("Enter both Account SID and Auth Token.");
      return;
    }
    if (!/^AC[0-9a-fA-F]{32}$/.test(sid)) {
      setLocalError("Account SID should start with AC and be 34 characters.");
      return;
    }

    try {
      const result = await connectMutation.mutateAsync({
        accountSid: sid,
        authToken: token,
      });
      await onConnected({
        accountSidMasked: result.accountSidMasked,
        selectedPhoneNumber: result.selectedPhoneNumber,
      });
    } catch (error) {
      setLocalError(
        getApiErrorMessage(error, "Could not connect Twilio credentials."),
      );
    }
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!busy) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: automationEase }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="text-[1.05rem] font-semibold text-[#1a1a1a]"
                >
                  Connect Twilio account
                </h2>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-[#666]">
                  Paste your Twilio Account SID and Auth Token from the Twilio
                  Console. Dealioo will use this account to send SMS.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-full p-1 text-[#888] hover:bg-[#f4f4f4] hover:text-[#333]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#777]">
                  Account SID
                </span>
                <input
                  type="text"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  disabled={busy}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-1.5 w-full rounded-xl border border-[#e4e4e4] bg-[#fafafa] px-3 py-2.5 text-[0.88rem] text-[#222] outline-none focus:border-[#F22F46]/40 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#777]">
                  Auth Token
                </span>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  disabled={busy}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Your Twilio Auth Token"
                  className="mt-1.5 w-full rounded-xl border border-[#e4e4e4] bg-[#fafafa] px-3 py-2.5 text-[0.88rem] text-[#222] outline-none focus:border-[#F22F46]/40 focus:bg-white"
                />
              </label>
            </div>

            {localError ? (
              <p className="mt-3 text-[0.78rem] text-red-600">{localError}</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-xl border border-[#e4e4e4] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[#444]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F22F46] px-3.5 py-2 text-[0.8rem] font-semibold text-white disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {busy ? "Connecting…" : "Connect Twilio"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
