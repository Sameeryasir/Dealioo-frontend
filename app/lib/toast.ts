import { toUserFriendlyMessage } from "@/app/lib/user-friendly-message";
import {
  toast as sonnerToast,
  type ExternalToast,
} from "sonner";
import type { ReactNode } from "react";

type ToastMessage = string | ReactNode;

const recentToastAt = new Map<string, number>();
const DEDUPE_WINDOW_MS = 3000;

function asFriendlyText(message: ToastMessage, fallback?: string): ToastMessage {
  if (typeof message !== "string") return message;
  return toUserFriendlyMessage(message, fallback ?? message);
}

function toastDedupeKey(
  kind: string,
  message: ToastMessage,
  id?: string | number,
): string | null {
  if (id != null) return `id:${String(id)}`;
  if (typeof message !== "string") return null;
  return `${kind}:${message}`;
}

function isDuplicateToast(key: string | null): boolean {
  if (!key) return false;
  const now = Date.now();
  const previous = recentToastAt.get(key);
  if (previous != null && now - previous < DEDUPE_WINDOW_MS) {
    return true;
  }
  recentToastAt.set(key, now);
  if (recentToastAt.size > 80) {
    for (const [entryKey, at] of recentToastAt) {
      if (now - at > DEDUPE_WINDOW_MS) recentToastAt.delete(entryKey);
    }
  }
  return false;
}

function withReadableDefaults(
  data: ExternalToast | undefined,
  kind: "success" | "error" | "message",
  message: ToastMessage,
): ExternalToast {
  const duration =
    data?.duration ??
    (kind === "error" ? 5500 : kind === "success" ? 3500 : 4000);
  const stableId =
    data?.id ??
    (typeof message === "string" ? `dealioo-${kind}:${message}` : undefined);
  return {
    ...data,
    id: stableId,
    duration,
  };
}

function show(
  kind: "success" | "error" | "info" | "warning" | "message",
  message: ToastMessage,
  data: ExternalToast | undefined,
  fallback?: string,
) {
  const text = asFriendlyText(message, fallback);
  const options = withReadableDefaults(
    data,
    kind === "info" || kind === "warning" ? "message" : kind,
    text,
  );
  const key = toastDedupeKey(kind, text, options.id);
  if (isDuplicateToast(key)) {
    if (options.id == null) return;
  }

  switch (kind) {
    case "success":
      return sonnerToast.success(text, options);
    case "error":
      return sonnerToast.error(text, options);
    case "info":
      return sonnerToast.info(text, options);
    case "warning":
      return sonnerToast.warning(text, options);
    default:
      return sonnerToast.message(text, options);
  }
}

export const toast = {
  success(message: ToastMessage, data?: ExternalToast) {
    return show("success", message, data);
  },
  error(message: ToastMessage, data?: ExternalToast) {
    return show(
      "error",
      message,
      data,
      "Something went wrong. Please try again.",
    );
  },
  message(message: ToastMessage, data?: ExternalToast) {
    return show("message", message, data);
  },
  info(message: ToastMessage, data?: ExternalToast) {
    return show("info", message, data);
  },
  warning(message: ToastMessage, data?: ExternalToast) {
    return show("warning", message, data);
  },
  promise: sonnerToast.promise.bind(sonnerToast),
  dismiss: sonnerToast.dismiss.bind(sonnerToast),
  custom: sonnerToast.custom.bind(sonnerToast),
  loading: sonnerToast.loading.bind(sonnerToast),
};
