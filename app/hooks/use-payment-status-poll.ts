"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPaymentStatus,
  type FunnelPaymentStatusValue,
  type PaymentStatusResponse,
} from "@/app/services/payment/get-payment-status";

const SUCCESS_STATUSES: ReadonlySet<FunnelPaymentStatusValue> = new Set([
  "paid",
]);

const FAILURE_STATUSES: ReadonlySet<FunnelPaymentStatusValue> = new Set([
  "failed",
  "cancelled",
]);

const FAST_INTERVAL_MS = 2_000;
const SLOW_INTERVAL_MS = 5_000;
const SLOW_AFTER_MS = 30_000;

export type PaymentPollPhase = "idle" | "confirming" | "paid" | "failed";

type Options = {
  paymentId: number | null;
  enabled?: boolean;
};

function intervalForElapsed(elapsedMs: number): number {
  return elapsedMs >= SLOW_AFTER_MS ? SLOW_INTERVAL_MS : FAST_INTERVAL_MS;
}

/**
 * Polls GET /payment/:id/status until paid or failed.
 * Keeps going through slow verification / network blips — never treats timeout as failure.
 */
export function usePaymentStatusPoll({
  paymentId,
  enabled = true,
}: Options) {
  const [status, setStatus] = useState<FunnelPaymentStatusValue | null>(null);
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [phase, setPhase] = useState<PaymentPollPhase>("idle");
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (paymentId == null) return null;
    const res = await getPaymentStatus(paymentId);
    setData(res);
    setStatus(res.status);
    return res;
  }, [paymentId]);

  useEffect(() => {
    clearTimer();

    if (!enabled || paymentId == null) {
      setStatus(null);
      setData(null);
      setPhase("idle");
      return;
    }

    let cancelled = false;
    startedAtRef.current = Date.now();
    setPhase("confirming");

    const scheduleNext = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAtRef.current;
      const delay = intervalForElapsed(elapsed);
      timerRef.current = window.setTimeout(() => {
        void tick();
      }, delay);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await pollOnce();
        if (cancelled || !res) return;

        if (SUCCESS_STATUSES.has(res.status)) {
          setPhase("paid");
          return;
        }
        if (FAILURE_STATUSES.has(res.status)) {
          setPhase("failed");
          return;
        }

        setPhase("confirming");
        scheduleNext();
      } catch {
        // Network / transient errors: keep confirming and retry — never show as payment failed.
        if (cancelled) return;
        setPhase("confirming");
        scheduleNext();
      }
    };

    void tick();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [enabled, paymentId, pollOnce, clearTimer]);

  const isPaid = phase === "paid" || status === "paid";
  const isFailed = phase === "failed";
  const isConfirming = phase === "confirming";
  const isTerminal = isPaid || isFailed;

  return {
    status,
    data,
    phase,
    isPaid,
    isFailed,
    isConfirming,
    isTerminal,
    loading: isConfirming,
    refresh: pollOnce,
  };
}
