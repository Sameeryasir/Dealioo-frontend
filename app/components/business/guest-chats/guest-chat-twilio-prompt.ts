const STORAGE_PREFIX = "dealio:guest-chat-twilio-prompt-dismissed:";

function storageKey(businessId: number): string {
  return `${STORAGE_PREFIX}${businessId}`;
}

export function wasTwilioPromptDismissed(businessId: number): boolean {
  if (typeof window === "undefined" || businessId <= 0) {
    return false;
  }
  try {
    return window.sessionStorage.getItem(storageKey(businessId)) === "1";
  } catch {
    return false;
  }
}

export function markTwilioPromptDismissed(businessId: number): void {
  if (typeof window === "undefined" || businessId <= 0) {
    return;
  }
  try {
    window.sessionStorage.setItem(storageKey(businessId), "1");
  } catch {}
}
