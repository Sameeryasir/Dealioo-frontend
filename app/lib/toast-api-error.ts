import { toast } from "@/app/lib/toast";
import { toUserFriendlyMessage } from "@/app/lib/user-friendly-message";
import { AutomationApiError } from "@/app/services/automation/automation-fetch";

export function getApiErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (err instanceof AutomationApiError) {
    return toUserFriendlyMessage(err.message, fallback);
  }
  return toUserFriendlyMessage(err, fallback);
}

export function toastApiError(err: unknown, fallback: string): void {
  toast.error(getApiErrorMessage(err, fallback));
}
