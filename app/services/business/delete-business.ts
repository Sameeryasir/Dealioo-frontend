import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export async function deleteBusiness(businessId: number): Promise<void> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Invalid business.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not delete this business."),
    );
  }
}
