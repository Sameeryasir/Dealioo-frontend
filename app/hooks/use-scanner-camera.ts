"use client";

import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

export type ScannerAutoDetectStatus = "on" | "off" | "processing";

function pickCameraId(cameras: CameraDevice[]): string {
  const backCamera = cameras.find((camera) =>
    /back|rear|environment/i.test(camera.label),
  );
  return backCamera?.id ?? cameras[0].id;
}

type UseScannerCameraArgs = {
  enabled: boolean;
  readerElementId: string;
  onDecoded: (decodedText: string) => void;
  onCameraError: (message: string) => void;
};

export function useScannerCamera({
  enabled,
  readerElementId,
  onDecoded,
  onCameraError,
}: UseScannerCameraArgs) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onDecodedRef = useRef(onDecoded);
  const onCameraErrorRef = useRef(onCameraError);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [autoDetectStatus, setAutoDetectStatus] =
    useState<ScannerAutoDetectStatus>("off");

  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  useEffect(() => {
    onCameraErrorRef.current = onCameraError;
  }, [onCameraError]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      setAutoDetectStatus("off");
      return;
    }

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

  useEffect(() => {
    if (!enabled) {
      void stopScanner();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setAutoDetectStatus("processing");
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      if (cancelled) return;

      const readerElement = document.getElementById(readerElementId);
      if (!readerElement) {
        onCameraErrorRef.current(
          "Camera view failed to load. Refresh and try again.",
        );
        setAutoDetectStatus("off");
        return;
      }

      await stopScanner();
      if (cancelled) return;

      const scanner = new Html5Qrcode(readerElementId);
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
            onDecodedRef.current(decoded);
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
          onCameraErrorRef.current(
            "Camera permission denied. Allow camera access in your browser, then try again.",
          );
        } else if (
          lower.includes("notfound") ||
          lower.includes("no camera") ||
          lower.includes("device")
        ) {
          onCameraErrorRef.current(
            "No camera is available on this device. Use Upload QR Image, or check camera access and try again.",
          );
        } else {
          onCameraErrorRef.current(message);
        }
        setAutoDetectStatus("off");
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, readerElementId, stopScanner]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  return {
    autoDetectStatus,
    stopScanner,
    setAutoDetectStatus,
  };
}
