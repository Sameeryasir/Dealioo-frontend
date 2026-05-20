import { toast } from "sonner";
import { AutomationApiError } from "@/app/services/automation/automation-fetch";

export function getApiErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (err instanceof AutomationApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function toastApiError(err: unknown, fallback: string): void {
  toast.error(getApiErrorMessage(err, fallback));
}
