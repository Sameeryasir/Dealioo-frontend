import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export async function abortFacebookConnect(businessId: number): Promise<void> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/connect-abort/${encodeURIComponent(String(businessId))}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not record Meta connect cancelled."),
    );
  }
}
