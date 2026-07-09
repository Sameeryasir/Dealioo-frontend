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
  restaurantId,
  onCreateGuest,
}: {
  restaurantId: number;
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
        const result = await previewRedemptionQr(restaurantId, rawToken);
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
    [restaurantId, stopScanner],
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
          restaurantId,
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
    [previewResult, restaurantId],
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

      <div className="flex flex-col gap-4">
        {guestNotInDatabase ? (
          <GuestNotInDatabasePanel
            onCreateGuest={onCreateGuest}
            onScanAgain={() => void resetScan()}
          />
        ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-200/40 ring-1 ring-zinc-950/[0.03]">
          {scanState === "idle" ? (
            <div className="flex flex-col items-center gap-5 px-6 py-12 sm:py-14">
              <div className="relative flex size-20 items-center justify-center">
                <span
                  className="absolute inset-2 rounded-2xl border border-dashed border-zinc-200/90"
                  aria-hidden
                />
                <div className="relative flex size-[4.75rem] items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-50 via-white to-zinc-100 shadow-sm ring-1 ring-zinc-200/90">
                  <ScanLine className="size-9 text-zinc-800" strokeWidth={1.75} aria-hidden />
                </div>
              </div>
              <p className="max-w-xs text-center text-sm font-medium leading-relaxed text-zinc-700">
                Open the camera to scan a customer QR code.
              </p>
              <button
                type="button"
                onClick={startScanner}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-zinc-900/20 transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/25 active:scale-[0.98]"
              >
                <ScanLine className="size-4" aria-hidden />
                Start camera
              </button>
            </div>
          ) : null}

          {scanState === "scanning" ? (
            <div className="p-4">
              <div className="relative overflow-hidden rounded-xl ring-2 ring-zinc-900/10 ring-offset-2 ring-offset-white">
                <div
                  id="qr-reader"
                  className="min-h-[280px] overflow-hidden rounded-xl bg-zinc-950 [&_video]:min-h-[280px] [&_video]:w-full [&_video]:rounded-xl [&_video]:object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
                Allow camera access if your browser asks. On a laptop, use the
                built-in webcam.
              </p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="mt-4 w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {scanState === "loading" ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <Loader2 className="size-10 animate-spin text-zinc-500" aria-hidden />
              <p className="text-sm font-medium text-zinc-700">Loading customer…</p>
            </div>
          ) : null}

          {scanState === "preview" ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-sm font-medium text-zinc-700">
                Customer found. Confirm redemption in the popup.
              </p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {scanState === "success" && successResult ? (
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <CheckCircle2 className="size-10 text-emerald-500" aria-hidden />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900">Redeemed!</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Offer successfully applied.
                </p>
              </div>
              <dl className="w-full rounded-xl border border-zinc-100 bg-gradient-to-b from-zinc-50 to-white px-4 py-3 text-left text-sm shadow-sm">
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-zinc-500">Customer</dt>
                  <dd className="font-medium text-zinc-900">
                    {successResult.customerName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-zinc-500">Campaign</dt>
                  <dd className="font-medium text-zinc-900">
                    {successResult.campaignName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-zinc-500">Total visits</dt>
                  <dd className="font-medium text-zinc-900">
                    {successResult.totalVisits}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-zinc-500">Rewards available</dt>
                  <dd className="font-medium text-zinc-900">
                    {successResult.rewardsAvailable}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <dt className="text-zinc-500">Redeemed at</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatDateTimeShort(successResult.redeemedAt)}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-zinc-900/20 transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.98]"
              >
                Scan another
              </button>
            </div>
          ) : null}

          {scanState === "error" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
                <XCircle className="size-10 text-red-500" aria-hidden />
              </div>
              <p className="text-lg font-semibold text-zinc-900">Scan failed</p>
              <p className="max-w-sm text-sm text-red-600">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void resetScan()}
                className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-zinc-900/20 transition-all duration-200 hover:bg-zinc-800 hover:shadow-lg active:scale-[0.98]"
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
