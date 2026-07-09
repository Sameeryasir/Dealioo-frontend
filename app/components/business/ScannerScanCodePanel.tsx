"use client";

import {
  CheckCircle2,
  Loader2,
  ScanLine,
  XCircle,
} from "lucide-react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
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
          confirming={false}
          onBack={() => setDialogStep("selectRewards")}
          onContinue={() => setDialogStep("enterSubtotal")}
          onDismiss={() => void resetScan()}
        />
      ) : null}

      {scanState === "preview" &&
      previewResult &&
      dialogStep === "enterSubtotal" ? (
        <ScanOrderSubtotalDialog
          confirming={confirmingRedemption}
          requirePositiveAmount={pendingCouponIds.some((couponId) => {
            const reward = previewResult.availableRewards?.find(
              (item) => item.couponId === couponId,
            );
            return reward?.paymentLabel === "UNPAID";
          })}
          onBack={() => setDialogStep("completeOrder")}
          onDone={(orderSubtotal) =>
            void handleConfirmRedeem(pendingCouponIds, orderSubtotal)
          }
          onDismiss={() => void resetScan()}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {guestNotInDatabase ? (
          <GuestNotInDatabasePanel
            onCreateGuest={onCreateGuest}
            onScanAgain={() => void resetScan()}
          />
        ) : (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
          {scanState === "idle" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-2 py-8 sm:py-10">
              <div className="relative flex size-28 items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full bg-[#e8f2ff]/80 blur-xl"
                  aria-hidden
                />
                <span className="relative flex size-24 items-center justify-center rounded-[1.75rem] border border-[#dbeafe] bg-gradient-to-br from-[#f4f8ff] to-white shadow-[0_12px_32px_rgba(24,119,242,0.12)]">
                  <ScanLine
                    className="size-10 text-[#1877f2]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
              </div>
              <p className="max-w-xs text-center text-[0.82rem] font-medium leading-relaxed text-slate-700">
                Open the camera to scan a customer QR code.
              </p>
              <button
                type="button"
                onClick={startScanner}
                className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
              >
                <ScanLine className="size-4" strokeWidth={2.25} aria-hidden />
                Start camera
              </button>
            </div>
          ) : null}

          {scanState === "scanning" ? (
            <div>
              <div className="relative overflow-hidden rounded-[1.1rem] ring-2 ring-[#1877f2]/20 ring-offset-2 ring-offset-white">
                <div
                  id="qr-reader"
                  className="min-h-[280px] overflow-hidden rounded-[1.1rem] bg-[#07111f] [&_video]:min-h-[280px] [&_video]:w-full [&_video]:rounded-[1.1rem] [&_video]:object-cover"
                />
              </div>
              <p className="mt-3 text-center text-[0.72rem] leading-relaxed text-slate-700">
                Allow camera access if your browser asks. On a laptop, use the
                built-in webcam.
              </p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="mt-4 w-full cursor-pointer rounded-full border border-[#e8edf5] bg-white py-2.5 text-[0.82rem] font-bold text-slate-700 transition hover:bg-[#f4f7fb] hover:text-black"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {scanState === "loading" ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12">
              <Loader2 className="size-10 animate-spin text-[#1877f2]" aria-hidden />
              <p className="text-[0.82rem] font-medium text-slate-700">
                Loading customer…
              </p>
            </div>
          ) : null}

          {scanState === "preview" ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-[0.82rem] font-medium text-slate-700">
                Customer found. Confirm redemption in the popup.
              </p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="cursor-pointer rounded-full border border-[#e8edf5] px-4 py-2 text-[0.8rem] font-bold text-slate-700 transition hover:bg-[#f4f7fb]"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {scanState === "success" && successResult ? (
            <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#ecfdf5] ring-1 ring-[#bbf7d0]/80">
                <CheckCircle2 className="size-10 text-[#22c55e]" aria-hidden />
              </div>
              <div>
                <p className="text-[1.05rem] font-extrabold text-black">Redeemed!</p>
                <p className="mt-1 text-[0.82rem] text-slate-700">
                  Offer successfully applied.
                </p>
              </div>
              <dl className="w-full rounded-[1rem] border border-[#e8edf5] bg-[#f8fafc]/80 px-4 py-3 text-left text-sm">
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-slate-700">Customer</dt>
                  <dd className="font-bold text-black">
                    {successResult.customerName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-slate-700">Campaign</dt>
                  <dd className="font-bold text-black">
                    {successResult.campaignName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-slate-700">Total visits</dt>
                  <dd className="font-bold text-black">
                    {successResult.totalVisits}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-slate-700">Rewards available</dt>
                  <dd className="font-bold text-black">
                    {successResult.rewardsAvailable}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-slate-700">Redeemed at</dt>
                  <dd className="font-bold text-black">
                    {formatDateTimeShort(successResult.redeemedAt)}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="rounded-full bg-[#1877f2] px-6 py-2.5 text-[0.82rem] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
              >
                Scan another
              </button>
            </div>
          ) : null}

          {scanState === "error" ? (
            <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#fef2f2] ring-1 ring-[#fecaca]/80">
                <XCircle className="size-10 text-[#ef4444]" aria-hidden />
              </div>
              <p className="text-[1.05rem] font-extrabold text-black">Scan failed</p>
              <p className="max-w-sm text-[0.82rem] text-[#dc2626]">{errorMessage}</p>
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
