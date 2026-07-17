import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export async function deleteCampaign(campaignId: number): Promise<void> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(campaignId) || campaignId < 1) {
    throw new Error("Campaign id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/campaign/${encodeURIComponent(String(campaignId))}`,
    {
      method: "DELETE",
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not delete campaign."),
    );
  }
}
