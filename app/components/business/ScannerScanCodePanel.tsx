"use client";

import {
  CheckCircle2,
  Gift,
  Loader2,
  ScanLine,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScanCompleteOrderDialog } from "@/app/components/business/ScanCompleteOrderDialog";
import { GuestNotInDatabasePanel } from "@/app/components/business/GuestNotInDatabasePanel";
import { ScanCustomerConfirmDialog } from "@/app/components/business/ScanCustomerConfirmDialog";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { ScanRewardSelectDialog } from "@/app/components/business/ScanRewardSelectDialog";
import {
  previewRedemptionQr,
  scanRedemptionQr,
  type ScanPreviewSuccess,
  type ScanRedemptionSuccess,
} from "@/app/services/redemption/scan-redemption";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";

type ScanState = "idle" | "scanning" | "loading" | "preview" | "success" | "error";
type DialogStep = "confirm" | "selectRewards" | "completeOrder" | "enterSubtotal";

function pickCameraId(cameras: CameraDevice[]): string {
  const backCamera = cameras.find((camera) =>
    /back|rear|environment/i.test(camera.label),
  );
  return backCamera?.id ?? cameras[0].id;
}

async function resolveCameraConfig(): Promise<string | MediaTrackConstraints> {
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras.length > 0) {
      return pickCameraId(cameras);
    }
  } catch {
    // fall through to facingMode constraints
  }

  return { facingMode: "user" };
}

const SCAN_STEPS = [
  {
    icon: ScanLine,
    title: "Scan pass",
    description: "Point the camera at the guest's QR code.",
  },
  {
    icon: UserCheck,
    title: "Confirm guest",
    description: "Review their profile and available rewards.",
  },
  {
    icon: Wallet,
    title: "Redeem offer",
    description: "Apply the deal and complete the order.",
  },
] as const;

function ScannerSuccessState({
  result,
  onScanAnother,
}: {
  result: ScanRedemptionSuccess;
  onScanAnother: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-[#bfdbfe]/90 bg-gradient-to-b from-[#eff6ff] via-white to-white shadow-[0_16px_40px_rgba(24,119,242,0.12)] ring-1 ring-[#1877f2]/10">
      <span
        className="pointer-events-none absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full bg-[#1877f2]/20 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-10 top-24 size-28 rounded-full bg-[#1877f2]/10 blur-2xl"
        aria-hidden
      />

      <div className="relative px-5 pb-6 pt-8 text-center sm:px-8 sm:pb-8 sm:pt-10">
        <div className="mx-auto mb-5 flex size-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1877f2] shadow-[0_12px_28px_rgba(24,119,242,0.35)] ring-4 ring-white">
          <CheckCircle2
            className="size-9 text-white"
            strokeWidth={2.5}
            aria-hidden
          />
        </div>

        <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#1877f2]/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
          <Sparkles className="size-3" aria-hidden />
          Success
        </p>
        <h3 className="m-0 mt-3 text-[1.45rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.6rem]">
          Redeemed!
        </h3>
        <p className="m-0 mt-1.5 text-[0.88rem] font-medium text-slate-500">
          Offer successfully applied at the counter.
        </p>

        <div className="mt-6 rounded-[1.2rem] border border-[#e8edf5] bg-white/90 px-4 py-4 text-left shadow-sm sm:px-5">
          <div className="flex items-start gap-3 border-b border-[#f1f5f9] pb-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2]/10 text-[#1877f2] ring-1 ring-[#1877f2]/15">
              <UserCheck className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                Customer
              </p>
              <p className="m-0 mt-0.5 truncate text-[1.05rem] font-extrabold text-[#07111f]">
                {result.customerName}
              </p>
              <p className="m-0 mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-[#1877f2]/10 px-2.5 py-0.5 text-[0.72rem] font-bold text-[#1877f2] ring-1 ring-[#1877f2]/15">
                <Gift className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{result.campaignName}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-[#f8fafc] px-3 py-3 ring-1 ring-[#e8edf5]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="size-3.5" aria-hidden />
                <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wide">
                  Total visits
                </p>
              </div>
              <p className="m-0 mt-1.5 text-[1.35rem] font-extrabold tabular-nums text-[#07111f]">
                {result.totalVisits}
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] px-3 py-3 ring-1 ring-[#e8edf5]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Gift className="size-3.5" aria-hidden />
                <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wide">
                  Rewards left
                </p>
              </div>
              <p className="m-0 mt-1.5 text-[1.35rem] font-extrabold tabular-nums text-[#07111f]">
                {result.rewardsAvailable}
              </p>
            </div>
          </div>

          <p className="m-0 mt-4 text-center text-[0.75rem] font-medium text-slate-500">
            Redeemed at{" "}
            <span className="font-bold text-slate-700">
              {formatDateTimeShort(result.redeemedAt)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onScanAnother}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1877f2] px-6 py-3.5 text-[0.9rem] font-bold text-white shadow-[0_10px_24px_rgba(24,119,242,0.32)] transition hover:bg-[#166fe5] sm:w-auto sm:min-w-[12rem]"
        >
          <ScanLine className="size-4" strokeWidth={2.25} aria-hidden />
          Scan another
        </button>
      </div>
    </div>
  );
}

function ScannerIdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3.5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: standardEase }}
        className="overflow-hidden rounded-[1.5rem] border border-[#e2e8f0] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.08)]"
      >
        <div className="flex items-center justify-between gap-3 bg-[#0e182b] px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white">
              Camera standby
            </p>
          </div>
          <p className="m-0 hidden text-[0.7rem] font-medium text-white/50 sm:block">
            Counter scan mode
          </p>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <div className="relative mb-4 aspect-square w-full max-w-[11rem]">
              <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] border border-[#e2e8f0] bg-[#f8fafc]">
                <motion.span
                  aria-hidden
                  className="absolute left-3.5 right-3.5 z-10 h-0.5 rounded-full bg-[#1877f2]"
                  initial={{ top: "14%" }}
                  animate={{ top: ["14%", "86%", "14%"] }}
                  transition={{
                    duration: 2.4,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
                <span
                  className="absolute left-0 top-0 size-6 border-l-[3px] border-t-[3px] border-[#1877f2]"
                  aria-hidden
                />
                <span
                  className="absolute right-0 top-0 size-6 border-r-[3px] border-t-[3px] border-[#1877f2]"
                  aria-hidden
                />
                <span
                  className="absolute bottom-0 left-0 size-6 border-b-[3px] border-l-[3px] border-[#1877f2]"
                  aria-hidden
                />
                <span
                  className="absolute bottom-0 right-0 size-6 border-b-[3px] border-r-[3px] border-[#1877f2]"
                  aria-hidden
                />
                <div className="flex h-full items-center justify-center">
                  <span className="flex size-14 items-center justify-center rounded-xl bg-[#0e182b] shadow-[0_8px_20px_rgba(14,24,43,0.2)]">
                    <ScanLine
                      className="size-7 text-white"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                </div>
              </div>
            </div>

            <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1877f2] ring-1 ring-[#1877f2]/15">
              <Sparkles className="size-3" aria-hidden />
              Ready to scan
            </p>
            <h3 className="m-0 mt-2 text-[1.15rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.25rem]">
              Scan a guest pass
            </h3>
            <p className="m-0 mt-1 max-w-[18rem] text-[0.78rem] font-medium leading-relaxed text-slate-500">
              Point the camera at the QR, confirm the guest, and redeem at the
              counter.
            </p>

            <button
              type="button"
              onClick={onStart}
              className="mt-4 inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-full bg-[#1877f2] px-6 py-2.5 text-[0.84rem] font-bold text-white shadow-[0_10px_24px_rgba(24,119,242,0.3)] transition hover:bg-[#166fe5]"
            >
              <ScanLine className="size-4" strokeWidth={2.25} aria-hidden />
              Start camera
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {SCAN_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.08 + index * 0.06,
                ease: standardEase,
              }}
              className="rounded-[1.1rem] border border-[#e8edf5] bg-white px-3.5 py-3.5"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1877f2] text-[0.7rem] font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
                    <p className="m-0 text-[0.8rem] font-bold text-[#0e182b]">
                      {step.title}
                    </p>
                  </div>
                  <p className="m-0 mt-1 text-[0.7rem] leading-snug text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ScannerActiveView({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-3 flex items-center justify-between gap-3 rounded-full border border-[#dbeafe] bg-[#f4f8ff] px-4 py-2">
        <span className="inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1877f2]/60" />
            <span className="relative inline-flex size-2 rounded-full bg-[#1877f2]" />
          </span>
          Scanning
        </span>
        <span className="text-[0.72rem] font-medium text-slate-500">
          Align QR inside the frame
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[1.35rem] border border-[#1877f2]/20 bg-[#07111f] shadow-[0_16px_40px_rgba(24,119,242,0.18)] ring-2 ring-[#1877f2]/15 ring-offset-2 ring-offset-white">
        <div
          id="qr-reader"
          className="min-h-[320px] overflow-hidden [&_video]:min-h-[320px] [&_video]:w-full [&_video]:object-cover"
        />
        <span className="pointer-events-none absolute inset-0 rounded-[1.35rem] ring-1 ring-inset ring-white/10" aria-hidden />
        <span className="pointer-events-none absolute left-5 top-5 size-8 border-l-2 border-t-2 border-[#1877f2]" aria-hidden />
        <span className="pointer-events-none absolute right-5 top-5 size-8 border-r-2 border-t-2 border-[#1877f2]" aria-hidden />
        <span className="pointer-events-none absolute bottom-5 left-5 size-8 border-b-2 border-l-2 border-[#1877f2]" aria-hidden />
        <span className="pointer-events-none absolute bottom-5 right-5 size-8 border-b-2 border-r-2 border-[#1877f2]" aria-hidden />
      </div>

      <p className="mt-4 text-center text-[0.78rem] leading-relaxed text-slate-500">
        Allow camera access if your browser asks. On a laptop, use the built-in
        webcam and hold the QR code steady in the frame.
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 w-full cursor-pointer rounded-full border border-[#e8edf5] bg-white py-2.5 text-[0.82rem] font-bold text-slate-700 transition hover:border-[#dbeafe] hover:bg-[#f4f8ff] hover:text-[#1877f2]"
      >
        Cancel
      </button>
    </div>
  );
}

export function ScannerScanCodePanel({
  businessId,
  onCreateGuest,
}: {
  businessId: number;
  onCreateGuest?: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const pendingTokenRef = useRef("");
  const idempotencyKeyRef = useRef("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ScanPreviewSuccess | null>(
    null,
  );
  const [successResult, setSuccessResult] = useState<ScanRedemptionSuccess | null>(
    null,
  );
  const [confirmingRedemption, setConfirmingRedemption] = useState(false);
  const [showPreviousRedemptions, setShowPreviousRedemptions] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("confirm");
  const [pendingCouponIds, setPendingCouponIds] = useState<number[]>([]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    scannerRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // camera may already be stopped
    }

    try {
      scanner.clear();
    } catch {
      // reader element may already be cleared
    }
  }, []);

  const handlePreview = useCallback(
    async (rawToken: string) => {
      if (!rawToken.trim() || scannedRef.current) return;
      scannedRef.current = true;
      pendingTokenRef.current = rawToken.trim();
      setScanState("loading");
      setErrorMessage(null);
      setPreviewResult(null);
      setSuccessResult(null);
      setShowPreviousRedemptions(false);

      await stopScanner();

      try {
        const result = await previewRedemptionQr(businessId, rawToken);
        if (result.success) {
          if (result.qrToken?.trim()) {
            pendingTokenRef.current = result.qrToken.trim();
          }
          setPreviewResult(result);
          setScanState("preview");
        } else {
          setErrorMessage(result.message);
          setScanState("error");
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Scan failed. Try again.",
        );
        setScanState("error");
      } finally {
        scannedRef.current = false;
      }
    },
    [businessId, stopScanner],
  );

  const handleConfirmRedeem = useCallback(
    async (couponIds: number[], orderSubtotal: number) => {
      if (!previewResult || !pendingTokenRef.current || couponIds.length === 0) {
        return;
      }

      setConfirmingRedemption(true);
      setErrorMessage(null);

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `redeem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      }

      try {
        const result = await scanRedemptionQr(
          businessId,
          pendingTokenRef.current,
          couponIds,
          orderSubtotal,
          idempotencyKeyRef.current,
          "qr_scan",
        );
        if (result.success) {
          idempotencyKeyRef.current = "";
          setPreviewResult(null);
          setDialogStep("confirm");
          setPendingCouponIds([]);
          setSuccessResult(result);
          setScanState("success");
        } else {
          setErrorMessage(result.message);
          setScanState("error");
          setPreviewResult(null);
          setDialogStep("confirm");
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Redemption failed. Try again.",
        );
        setScanState("error");
        setPreviewResult(null);
        setDialogStep("confirm");
      } finally {
        setConfirmingRedemption(false);
      }
    },
    [previewResult, businessId],
  );

  useEffect(() => {
    if (scanState !== "scanning") return;

    let cancelled = false;

    const startCamera = async () => {
      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        setScanState("error");
        setErrorMessage("Camera view failed to load. Refresh and try again.");
        return;
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      try {
        const cameraConfig = await resolveCameraConfig();
        if (cancelled) return;

        await scanner.start(
          cameraConfig,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            void handlePreview(decoded);
          },
          () => {
            // ignore per-frame scan misses
          },
        );
      } catch (err) {
        if (cancelled) return;

        await stopScanner();
        setScanState("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not access camera. Allow camera permission and try again.",
        );
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanState, handlePreview, stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const startScanner = () => {
    setErrorMessage(null);
    setPreviewResult(null);
    setSuccessResult(null);
    scannedRef.current = false;
    setScanState("scanning");
  };

  const resetScan = async () => {
    await stopScanner();
    setScanState("idle");
    setErrorMessage(null);
    setPreviewResult(null);
    setSuccessResult(null);
    setShowPreviousRedemptions(false);
    setConfirmingRedemption(false);
    setDialogStep("confirm");
    setPendingCouponIds([]);
    pendingTokenRef.current = "";
    idempotencyKeyRef.current = "";
    scannedRef.current = false;
  };

  const guestNotInDatabase =
    scanState === "error" &&
    Boolean(
      errorMessage?.toLowerCase().includes("customer not found") ||
        errorMessage?.toLowerCase().includes("guest not found"),
    );

  return (
    <>
      {scanState === "preview" && previewResult && dialogStep === "confirm" ? (
        <ScanCustomerConfirmDialog
          preview={previewResult}
          confirming={confirmingRedemption}
          showPreviousRedemptions={showPreviousRedemptions}
          onTogglePreviousRedemptions={() =>
            setShowPreviousRedemptions((current) => !current)
          }
          onConfirm={() => setDialogStep("selectRewards")}
          onDismiss={() => void resetScan()}
        />
      ) : null}

      {scanState === "preview" &&
      previewResult &&
      dialogStep === "selectRewards" ? (
        <ScanRewardSelectDialog
          rewards={previewResult.availableRewards ?? []}
          confirming={false}
          onBack={() => setDialogStep("confirm")}
          onConfirm={(couponIds) => {
            setPendingCouponIds(couponIds);
            setDialogStep("completeOrder");
          }}
          onDismiss={() => void resetScan()}
        />
      ) : null}

      {scanState === "preview" &&
      previewResult &&
      dialogStep === "completeOrder" ? (
        <ScanCompleteOrderDialog
          customerName={previewResult.customerName}
          selectedRewards={(previewResult.availableRewards ?? []).filter(
            (reward) => pendingCouponIds.includes(reward.couponId),
          )}
          confirming={confirmingRedemption}
          onBack={() => setDialogStep("selectRewards")}
          onContinue={() => {
            setDialogStep("enterSubtotal");
          }}
          onDismiss={() => void resetScan()}
        />
      ) : null}

      {scanState === "preview" &&
      previewResult &&
      dialogStep === "enterSubtotal" ? (
        <ScanOrderSubtotalDialog
          confirming={confirmingRedemption}
          requirePositiveAmount={(() => {
            const selectedRewards = (
              previewResult.availableRewards ?? []
            ).filter((reward) => pendingCouponIds.includes(reward.couponId));
            return !(
              selectedRewards.length > 0 &&
              selectedRewards.every((reward) => reward.paymentLabel === "PREPAID")
            );
          })()}
          extraPurchaseMode={(() => {
            const selectedRewards = (
              previewResult.availableRewards ?? []
            ).filter((reward) => pendingCouponIds.includes(reward.couponId));
            return (
              selectedRewards.length > 0 &&
              selectedRewards.every((reward) => reward.paymentLabel === "PREPAID")
            );
          })()}
          expectedAmount={(() => {
            const selectedRewards = (
              previewResult.availableRewards ?? []
            ).filter((reward) => pendingCouponIds.includes(reward.couponId));
            if (
              selectedRewards.length > 0 &&
              selectedRewards.every((reward) => reward.paymentLabel === "PREPAID")
            ) {
              return null;
            }
            if (selectedRewards.length === 0) return null;
            let total = 0;
            for (const reward of selectedRewards) {
              const price = reward.campaignPrice;
              if (price == null || !Number.isFinite(price) || price < 0) {
                return null;
              }
              total += price;
            }
            return Math.round(total * 100) / 100;
          })()}
          onBack={() => setDialogStep("completeOrder")}
          onDone={(orderSubtotal) =>
            void handleConfirmRedeem(pendingCouponIds, orderSubtotal)
          }
          onDismiss={() => void resetScan()}
        />
      ) : null}

      <div className="mx-auto w-full max-w-2xl pb-6">
        {guestNotInDatabase ? (
          <GuestNotInDatabasePanel
            onCreateGuest={onCreateGuest}
            onScanAgain={() => void resetScan()}
          />
        ) : (
        <div className="flex w-full flex-col">
          {scanState === "idle" ? (
            <ScannerIdleState onStart={startScanner} />
          ) : null}

          {scanState === "scanning" ? (
            <ScannerActiveView onCancel={() => void resetScan()} />
          ) : null}

          {scanState === "loading" ? (
            <div className="flex flex-col items-center gap-4 rounded-[1.35rem] border border-[#e8edf5] bg-white px-6 py-14 text-center shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <Loader2 className="size-10 animate-spin text-[#1877f2]" aria-hidden />
              <div>
                <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
                  Loading guest
                </p>
                <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
                  Fetching pass details from your business account…
                </p>
              </div>
            </div>
          ) : null}

          {scanState === "preview" ? (
            <div className="flex flex-col items-center gap-4 rounded-[1.35rem] border border-[#dbeafe] bg-[#f4f8ff] px-6 py-12 text-center">
              <p className="m-0 text-[0.95rem] font-extrabold text-[#07111f]">
                Guest found
              </p>
              <p className="m-0 max-w-sm text-[0.8rem] font-medium text-slate-600">
                Confirm redemption in the popup to continue.
              </p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="cursor-pointer rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-[0.8rem] font-bold text-slate-700 transition hover:bg-white hover:text-[#1877f2]"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {scanState === "success" && successResult ? (
            <ScannerSuccessState
              result={successResult}
              onScanAnother={() => void resetScan()}
            />
          ) : null}

          {scanState === "error" ? (
            <div className="flex flex-col items-center gap-4 rounded-[1.35rem] border border-[#fecaca] bg-gradient-to-b from-[#fef2f2] to-white px-4 py-8 text-center shadow-[0_10px_28px_rgba(239,68,68,0.08)]">
              <div className="flex size-16 items-center justify-center rounded-full bg-white ring-1 ring-[#fecaca]/80 shadow-sm">
                <XCircle className="size-10 text-[#ef4444]" aria-hidden />
              </div>
              <p className="m-0 text-[1.05rem] font-extrabold text-[#07111f]">Scan failed</p>
              <p className="m-0 max-w-sm text-[0.82rem] text-[#dc2626]">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="rounded-full bg-[#1877f2] px-6 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>
        )}
      </div>
    </>
  );
}
