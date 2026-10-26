"use client";

import {
  ArrowDownToLine,
  Camera,
  CheckCircle2,
  CreditCard,
  Focus,
  Gift,
  ImagePlus,
  Loader2,
  QrCode,
  ScanLine,
  ShieldCheck,
  SunMedium,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ScanCompleteOrderDialog } from "@/app/components/business/ScanCompleteOrderDialog";
import { GuestNotInDatabasePanel } from "@/app/components/business/GuestNotInDatabasePanel";
import { ScanCustomerConfirmDialog } from "@/app/components/business/ScanCustomerConfirmDialog";
import { ScanOrderSubtotalDialog } from "@/app/components/business/ScanOrderSubtotalDialog";
import { ScanRewardSelectDialog } from "@/app/components/business/ScanRewardSelectDialog";
import {
  previewRedemptionQr,
  redeemExpectedOfferAmount,
  scanRedemptionQr,
  type ScanPreviewSuccess,
} from "@/app/services/redemption/scan-redemption";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { standardEase } from "@/app/lib/motion";
import {
  scannerCardHeaderClass,
  scannerCenterStageClass,
  scannerGhostBtnClass,
  scannerMainCardClass,
  scannerMainGridClass,
  scannerPageWrapClass,
  scannerPrimaryBtnClass,
  scannerStackClass,
  scannerStatusChipClass,
  scannerWorkflowCardClass,
} from "@/app/lib/scanner-ui";

type ScanState = "idle" | "scanning" | "loading" | "preview" | "error";
type DialogStep =
  | "confirm"
  | "selectRewards"
  | "completeOrder"
  | "enterSubtotal"
  | "enterExtra";
type AutoDetectStatus = "on" | "off" | "processing";

const MAX_QR_IMAGE_BYTES = 8 * 1024 * 1024;

function pickCameraId(cameras: CameraDevice[]): string {
  const backCamera = cameras.find((camera) =>
    /back|rear|environment/i.test(camera.label),
  );
  return backCamera?.id ?? cameras[0].id;
}

const WORKFLOW_STEPS = [
  {
    id: "scan",
    icon: ScanLine,
    title: "Scan Pass",
    description: "Point the camera at the guest's QR code.",
    iconIdle: "bg-[#ccfbf1] text-[#0f766e]",
    iconActive: "bg-[#0d9488] text-white",
    badgeIdle: "bg-[#ccfbf1] text-[#0f766e]",
    badgeActive: "bg-[#0d9488] text-white",
    cardActive:
      "border-[#99f6e4] shadow-[0_10px_28px_rgba(13,148,136,0.12)] ring-1 ring-[#0d9488]/20",
    cardComplete: "border-[#ccfbf1] bg-[#f0fdfa]/80",
  },
  {
    id: "confirm",
    icon: UserCheck,
    title: "Confirm Guest",
    description: "Review the guest's profile and available deals.",
    iconIdle: "bg-[#ecfdf5] text-[#059669]",
    iconActive: "bg-[#059669] text-white",
    badgeIdle: "bg-[#ecfdf5] text-[#059669]",
    badgeActive: "bg-[#059669] text-white",
    cardActive:
      "border-[#a7f3d0] shadow-[0_10px_28px_rgba(5,150,105,0.12)] ring-1 ring-[#059669]/20",
    cardComplete: "border-[#d1fae5] bg-[#ecfdf5]/80",
  },
  {
    id: "payment",
    icon: CreditCard,
    title: "Handle Payment",
    description: "Collect or confirm payment if required.",
    iconIdle: "bg-[#fff7ed] text-[#c2410c]",
    iconActive: "bg-[#ea580c] text-white",
    badgeIdle: "bg-[#fff7ed] text-[#c2410c]",
    badgeActive: "bg-[#ea580c] text-white",
    cardActive:
      "border-[#fed7aa] shadow-[0_10px_28px_rgba(234,88,12,0.12)] ring-1 ring-[#ea580c]/20",
    cardComplete: "border-[#ffedd5] bg-[#fff7ed]/80",
  },
  {
    id: "redeem",
    icon: Gift,
    title: "Redeem Offer",
    description: "Complete redemption and record the visit.",
    iconIdle: "bg-[#f5f3ff] text-[#7c3aed]",
    iconActive: "bg-[#7c3aed] text-white",
    badgeIdle: "bg-[#f5f3ff] text-[#7c3aed]",
    badgeActive: "bg-[#7c3aed] text-white",
    cardActive:
      "border-[#ddd6fe] shadow-[0_10px_28px_rgba(124,58,237,0.12)] ring-1 ring-[#7c3aed]/20",
    cardComplete: "border-[#ede9fe] bg-[#f5f3ff]/80",
  },
] as const;

const SCAN_TIPS = [
  {
    icon: SunMedium,
    title: "Ensure good lighting",
    description: "Avoid glare and shadows.",
    iconWrap: "border-[#fde68a] bg-[#fffbeb] text-[#d97706]",
  },
  {
    icon: Focus,
    title: "Hold steady",
    description: "Keep the QR code within the frame.",
    iconWrap: "border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]",
  },
  {
    icon: ArrowDownToLine,
    title: "Close distance",
    description: "Move closer if the QR code is not detected.",
    iconWrap: "border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]",
  },
] as const;

function CornerBracket({
  className,
}: {
  className: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute size-4 border-[#1777f2] sm:size-5 ${className}`}
      aria-hidden
    />
  );
}

function ScannerCameraStage({
  active,
  reducedMotion,
  children,
}: {
  active: boolean;
  reducedMotion: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={scannerCenterStageClass}>
      <div className="relative aspect-[4/5] w-full sm:aspect-square">
        {children}
        <CornerBracket className="left-3.5 top-3.5 border-l-[2.5px] border-t-[2.5px]" />
        <CornerBracket className="right-3.5 top-3.5 border-r-[2.5px] border-t-[2.5px]" />
        <CornerBracket className="bottom-3.5 left-3.5 border-b-[2.5px] border-l-[2.5px]" />
        <CornerBracket className="bottom-3.5 right-3.5 border-b-[2.5px] border-r-[2.5px]" />
        {!reducedMotion ? (
          <motion.span
            aria-hidden
            className="absolute left-7 right-7 z-10 h-0.5 rounded-full bg-[#1777f2] shadow-[0_0_12px_rgba(23,119,242,0.85)]"
            initial={{ top: "18%" }}
            animate={{ top: ["18%", "78%", "18%"] }}
            transition={{
              duration: 2.4,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute left-7 right-7 top-1/2 z-10 h-0.5 -translate-y-1/2 rounded-full bg-[#1777f2]/80"
          />
        )}
        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <QrCode
              className="size-16 text-white/90 drop-shadow-sm"
              strokeWidth={1.4}
              aria-hidden
            />
            <p className="m-0 text-center text-[0.78rem] font-semibold text-white/80">
              Position QR code within the frame
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WorkflowCards({
  scanState,
  dialogStep,
  previewResult,
}: {
  scanState: ScanState;
  dialogStep: DialogStep;
  previewResult: ScanPreviewSuccess | null;
}) {
  const selectedRewards =
    previewResult?.availableRewards?.filter((reward) => reward.canSelect) ??
    [];
  const allPrepaid =
    selectedRewards.length > 0 &&
    selectedRewards.every((reward) => reward.paymentLabel === "PREPAID");

  let activeIndex = 0;
  if (scanState === "loading" || scanState === "scanning") activeIndex = 0;
  if (scanState === "preview") {
    if (dialogStep === "confirm" || dialogStep === "selectRewards") {
      activeIndex = 1;
    } else if (
      dialogStep === "completeOrder" ||
      dialogStep === "enterSubtotal" ||
      dialogStep === "enterExtra"
    ) {
      activeIndex = allPrepaid && dialogStep !== "enterExtra" ? 3 : 2;
      if (dialogStep === "enterExtra" || dialogStep === "completeOrder") {
        activeIndex = allPrepaid ? 3 : 2;
      }
      if (dialogStep === "enterSubtotal" && allPrepaid) activeIndex = 3;
      if (dialogStep === "enterSubtotal" && !allPrepaid) activeIndex = 2;
      if (dialogStep === "enterExtra") activeIndex = 3;
    }
  }

  return (
    <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      <span
        className="pointer-events-none absolute left-[12%] right-[12%] top-[1.7rem] hidden border-t border-dashed border-slate-200 xl:block"
        aria-hidden
      />
      {WORKFLOW_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === activeIndex && scanState !== "error";
        const isComplete = index < activeIndex && scanState !== "error";
        const paymentSkipped =
          step.id === "payment" && allPrepaid && activeIndex >= 3;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.05 + index * 0.05,
              ease: standardEase,
            }}
            className={`${scannerWorkflowCardClass} transition ${
              isActive
                ? step.cardActive
                : isComplete
                  ? step.cardComplete
                  : ""
            }`}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span
                className={`flex size-9 items-center justify-center rounded-xl ${
                  isActive || isComplete ? step.iconActive : step.iconIdle
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-4" strokeWidth={2.2} aria-hidden />
                ) : (
                  <Icon className="size-4" strokeWidth={2.15} aria-hidden />
                )}
              </span>
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[0.68rem] font-extrabold ${
                  isActive ? step.badgeActive : step.badgeIdle
                }`}
              >
                {index + 1}
              </span>
            </div>
            <p className="m-0 text-[0.88rem] font-extrabold text-[#0e182b]">
              {step.title}
            </p>
            <p className="m-0 mt-1 text-[0.74rem] leading-snug text-slate-500">
              {step.description}
            </p>
            {paymentSkipped ? (
              <p className="m-0 mt-2 text-[0.68rem] font-bold uppercase tracking-wide text-[#c2410c]">
                Not required · prepaid
              </p>
            ) : null}
          </motion.div>
        );
      })}
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
  const preferReducedMotion = useReducedMotion() === true;
  const fileInputId = useId();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const pendingTokenRef = useRef("");
  const idempotencyKeyRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ScanPreviewSuccess | null>(
    null,
  );
  const [confirmingRedemption, setConfirmingRedemption] = useState(false);
  const [showPreviousRedemptions, setShowPreviousRedemptions] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("confirm");
  const [pendingCouponIds, setPendingCouponIds] = useState<number[]>([]);
  const [pendingRedeemAmount, setPendingRedeemAmount] = useState<number | null>(
    null,
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [autoDetectStatus, setAutoDetectStatus] =
    useState<AutoDetectStatus>("off");
  const [decodingImage, setDecodingImage] = useState(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    scannerRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
    }

    try {
      scanner.clear();
    } catch {
    }

    setAutoDetectStatus("off");
  }, []);

  const handlePreview = useCallback(
    async (rawToken: string) => {
      if (!rawToken.trim() || scannedRef.current) return;
      scannedRef.current = true;
      pendingTokenRef.current = rawToken.trim();
      setScanState("loading");
      setAutoDetectStatus("processing");
      setErrorMessage(null);
      setPreviewResult(null);
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
          setDialogStep("confirm");
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
        setAutoDetectStatus("off");
      }
    },
    [businessId, stopScanner],
  );

  const handleConfirmRedeem = useCallback(
    async (
      couponIds: number[],
      orderSubtotal: number,
      extraItemsAmount = 0,
      extraItemNames?: string[],
      extraItems?: Array<{ name: string; unitPrice: number; qty: number }>,
    ) => {
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
          extraItemsAmount,
          extraItemNames,
          extraItems,
        );
        if (result.success) {
          idempotencyKeyRef.current = "";
          setPreviewResult(null);
          setDialogStep("confirm");
          setPendingCouponIds([]);
          setPendingRedeemAmount(null);
          toast.success("Successfully redeemed", {
            description: `${result.campaignName} · ${formatDateTimeShort(result.redeemedAt)}`,
          });
          scannedRef.current = false;
          pendingTokenRef.current = "";
          setScanState("scanning");
        } else {
          setErrorMessage(result.message);
          setScanState("error");
          setPreviewResult(null);
          setDialogStep("confirm");
          setPendingRedeemAmount(null);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Redemption failed. Try again.",
        );
        setScanState("error");
        setPreviewResult(null);
        setDialogStep("confirm");
        setPendingRedeemAmount(null);
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
      setAutoDetectStatus("processing");

      await new Promise((resolve) => window.setTimeout(resolve, 0));
      if (cancelled) return;

      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        setScanState("error");
        setErrorMessage("Camera view failed to load. Refresh and try again.");
        setAutoDetectStatus("off");
        return;
      }

      await stopScanner();
      if (cancelled) return;

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      try {
        let cameraConfig: string | MediaTrackConstraints = {
          facingMode: "user",
        };
        try {
          const list = await Html5Qrcode.getCameras();
          if (cancelled) return;
          const preferred =
            (selectedCameraId &&
              list.find((camera) => camera.id === selectedCameraId)?.id) ||
            (list.length > 0 ? pickCameraId(list) : null);
          if (preferred) {
            setSelectedCameraId((current) => current ?? preferred);
            cameraConfig = preferred;
          }
        } catch {
        }

        await scanner.start(
          cameraConfig,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            void handlePreview(decoded);
          },
          () => {},
        );

        if (cancelled) {
          await stopScanner();
          return;
        }

        setAutoDetectStatus("on");
      } catch (err) {
        if (cancelled) return;

        await stopScanner();
        setScanState("error");
        const message =
          err instanceof Error
            ? err.message
            : "Could not access camera. Allow camera permission and try again.";
        const lower = message.toLowerCase();
        if (
          lower.includes("permission") ||
          lower.includes("notallowed") ||
          lower.includes("denied")
        ) {
          setErrorMessage(
            "Camera permission denied. Allow camera access in your browser, then try again.",
          );
        } else if (
          lower.includes("notfound") ||
          lower.includes("no camera") ||
          lower.includes("device")
        ) {
          setErrorMessage(
            "No camera is available on this device. Use Upload QR Image, or check camera access and try again.",
          );
        } else {
          setErrorMessage(message);
        }
        setAutoDetectStatus("off");
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanState, selectedCameraId, handlePreview, stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const startScanner = () => {
    setErrorMessage(null);
    setPreviewResult(null);
    scannedRef.current = false;
    setScanState("scanning");
  };

  const resetScan = async () => {
    await stopScanner();
    setScanState("idle");
    setErrorMessage(null);
    setPreviewResult(null);
    setShowPreviousRedemptions(false);
    setConfirmingRedemption(false);
    setDialogStep("confirm");
    setPendingCouponIds([]);
    setPendingRedeemAmount(null);
    pendingTokenRef.current = "";
    idempotencyKeyRef.current = "";
    scannedRef.current = false;
    setDecodingImage(false);
    setAutoDetectStatus("off");
  };

  const handleQrImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file containing the QR code.");
      return;
    }
    if (file.size > MAX_QR_IMAGE_BYTES) {
      toast.error("Image is too large. Use a file under 8 MB.");
      return;
    }

    setDecodingImage(true);
    setErrorMessage(null);
    setAutoDetectStatus("processing");

    const hostId = "qr-file-decoder-host";
    let host = document.getElementById(hostId);
    if (!host) {
      host = document.createElement("div");
      host.id = hostId;
      host.className = "sr-only";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
    }

    const decoder = new Html5Qrcode(hostId);
    try {
      await stopScanner();
      const decoded = await decoder.scanFile(file, false);
      await handlePreview(decoded);
    } catch (err) {
      const raw =
        err instanceof Error ? err.message : "Could not read a QR code from that image.";
      const lower = raw.toLowerCase();
      const friendly =
        lower.includes("multiformat") ||
        lower.includes("detect the code") ||
        lower.includes("not found") ||
        lower.includes("no qr") ||
        lower.includes("could not")
          ? "We couldn’t find a QR code in that image. Try a clearer photo with the full code visible, or use Start Camera instead."
          : raw;

      setScanState("error");
      setErrorMessage(friendly);
      setAutoDetectStatus("off");
    } finally {
      try {
        decoder.clear();
      } catch {
      }
      setDecodingImage(false);
    }
  };

  const guestNotInDatabase =
    scanState === "error" &&
    Boolean(
      errorMessage?.toLowerCase().includes("customer not found") ||
        errorMessage?.toLowerCase().includes("guest not found"),
    );

  const cameraBusy = scanState === "scanning" || scanState === "loading";

  const statusLabel = (() => {
    if (scanState === "scanning" && autoDetectStatus === "processing") {
      return "Requesting camera…";
    }
    if (scanState === "scanning") return "Camera active";
    if (scanState === "loading") return "Validating pass…";
    if (scanState === "preview") return "Guest preview";
    if (scanState === "error") return "Needs attention";
    return "Camera ready";
  })();

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
            return redeemExpectedOfferAmount(selectedRewards);
          })()}
          onBack={() => {
            setDialogStep("completeOrder");
            setPendingRedeemAmount(null);
          }}
          onDone={(orderSubtotal, meta) => {
            const selectedRewards = (
              previewResult.availableRewards ?? []
            ).filter((reward) => pendingCouponIds.includes(reward.couponId));
            const allPrepaid =
              selectedRewards.length > 0 &&
              selectedRewards.every(
                (reward) => reward.paymentLabel === "PREPAID",
              );
            if (allPrepaid) {
              void handleConfirmRedeem(
                pendingCouponIds,
                orderSubtotal,
                0,
                meta?.itemNames,
                meta?.items,
              );
              return;
            }
            setPendingRedeemAmount(orderSubtotal);
            setDialogStep("enterExtra");
          }}
          onDismiss={() => void resetScan()}
        />
      ) : null}

      {scanState === "preview" &&
      previewResult &&
      dialogStep === "enterExtra" &&
      pendingRedeemAmount != null ? (
        <ScanOrderSubtotalDialog
          confirming={confirmingRedemption}
          extraPurchaseMode
          onBack={() => setDialogStep("enterSubtotal")}
          onDone={(extraItemsAmount, meta) =>
            void handleConfirmRedeem(
              pendingCouponIds,
              pendingRedeemAmount,
              extraItemsAmount,
              meta?.itemNames,
              meta?.items,
            )
          }
          onDismiss={() => void resetScan()}
        />
      ) : null}

      <div className={scannerPageWrapClass}>
        {guestNotInDatabase ? (
          <GuestNotInDatabasePanel
            onCreateGuest={onCreateGuest}
            onScanAgain={() => void resetScan()}
          />
        ) : (
          <div className={scannerStackClass}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: standardEase }}
              className={scannerMainCardClass}
            >
              <div className={scannerCardHeaderClass}>
                <span className={scannerStatusChipClass}>
                  <span className="relative flex size-2">
                    {!preferReducedMotion && cameraBusy ? (
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1777f2]/45" />
                    ) : null}
                    <span className="relative inline-flex size-2 rounded-full bg-[#1777f2]" />
                  </span>
                  {statusLabel}
                </span>
                {scanState !== "idle" ? (
                  <button
                    type="button"
                    onClick={() => void resetScan()}
                    className="cursor-pointer text-[0.8rem] font-bold text-slate-500 transition hover:text-[#1777f2]"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <div className={scannerMainGridClass}>
                <div className="min-w-0">
                  <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[#1777f2]">
                    Counter scan mode
                  </p>
                  <span
                    className="mt-2 block h-0.5 w-10 rounded-full bg-[#1777f2]"
                    aria-hidden
                  />
                  <h2 className="m-0 mt-4 text-[1.65rem] font-extrabold tracking-tight text-[#0e182b] sm:text-[1.85rem]">
                    Scan &amp; Redeem
                  </h2>
                  <p className="m-0 mt-3 text-[0.88rem] font-medium leading-relaxed text-slate-500">
                    Scan a guest&apos;s QR code to verify their pass, confirm
                    details, collect payment if needed, and redeem their offer.
                  </p>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={startScanner}
                      disabled={cameraBusy || decodingImage}
                      className={scannerPrimaryBtnClass}
                    >
                      {scanState === "scanning" &&
                      autoDetectStatus === "processing" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Camera className="size-4" strokeWidth={2.25} aria-hidden />
                      )}
                      {scanState === "scanning" &&
                      autoDetectStatus === "processing"
                        ? "Requesting camera…"
                        : scanState === "scanning"
                          ? "Camera running"
                          : "Start Camera"}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={scanState === "loading" || decodingImage}
                      className={scannerGhostBtnClass}
                    >
                      {decodingImage ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <ImagePlus className="size-4" strokeWidth={2.25} aria-hidden />
                      )}
                      {decodingImage ? "Reading image…" : "Upload QR Image"}
                    </button>
                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => void handleQrImageSelected(event)}
                    />
                  </div>
                </div>

                <div className="flex min-w-0 flex-col items-center">
                  <ScannerCameraStage
                    active={scanState === "scanning"}
                    reducedMotion={preferReducedMotion}
                  >
                    {scanState === "scanning" ? (
                      <div
                        id="qr-reader"
                        className="absolute inset-0 min-h-full overflow-hidden [&_video]:h-full [&_video]:min-h-full [&_video]:w-full [&_video]:object-cover [&_img]:hidden"
                      />
                    ) : null}
                    {scanState === "loading" ? (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0b1f3a]/85 px-6 text-center">
                        <Loader2
                          className="size-9 animate-spin text-[#1777f2]"
                          aria-hidden
                        />
                        <p className="m-0 text-[0.9rem] font-bold text-white">
                          Validating pass
                        </p>
                        <p className="m-0 text-[0.75rem] text-white/70">
                          Checking eligibility with your business account…
                        </p>
                      </div>
                    ) : null}
                    {scanState === "preview" ? (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0b1f3a]/80 px-6 text-center">
                        <CheckCircle2
                          className="size-10 text-[#1777f2]"
                          aria-hidden
                        />
                        <p className="m-0 text-[0.95rem] font-extrabold text-white">
                          Guest found
                        </p>
                        <p className="m-0 text-[0.78rem] text-white/75">
                          Confirm redemption in the popup to continue.
                        </p>
                      </div>
                    ) : null}
                    {scanState === "error" && !guestNotInDatabase ? (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#2a0f12]/88 px-6 text-center">
                        <XCircle className="size-10 text-[#f87171]" aria-hidden />
                        <p className="m-0 text-[0.95rem] font-extrabold text-white">
                          Scan failed
                        </p>
                        <p className="m-0 max-w-xs text-[0.78rem] text-[#fecaca]">
                          {errorMessage}
                        </p>
                      </div>
                    ) : null}
                  </ScannerCameraStage>
                </div>

                <div className="min-w-0 lg:pl-1">
                  <h3 className="m-0 text-[0.95rem] font-extrabold tracking-tight text-[#0e182b]">
                    Tips for best results
                  </h3>
                  <ul className="m-0 mt-4 flex list-none flex-col gap-3.5 p-0">
                    {SCAN_TIPS.map((tip) => {
                      const Icon = tip.icon;
                      return (
                        <li key={tip.title} className="flex items-start gap-3">
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${tip.iconWrap}`}
                          >
                            <Icon
                              className="size-4"
                              strokeWidth={2.1}
                              aria-hidden
                            />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="m-0 text-[0.84rem] font-bold text-[#0e182b]">
                              {tip.title}
                            </p>
                            <p className="m-0 mt-0.5 text-[0.76rem] font-medium text-slate-500">
                              {tip.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-5 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-4">
                    <p className="m-0 flex items-center gap-2 text-[0.84rem] font-extrabold text-[#0e182b]">
                      <ShieldCheck
                        className="size-4 text-[#059669]"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                      Secure &amp; Verified
                    </p>
                    <p className="m-0 mt-1.5 text-[0.76rem] font-medium leading-relaxed text-slate-600">
                      Deals, payments, and eligibility are checked before
                      redemption.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <WorkflowCards
              scanState={scanState}
              dialogStep={dialogStep}
              previewResult={previewResult}
            />

            {scanState === "error" && !guestNotInDatabase ? (
              <div className="flex flex-col items-center gap-3 rounded-[1.35rem] border border-[#fecaca] bg-[#fef2f2] px-4 py-6 text-center">
                <p className="m-0 max-w-md text-[0.84rem] font-medium text-[#dc2626]">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => void resetScan()}
                  className={scannerPrimaryBtnClass}
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
