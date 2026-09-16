import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookPageEngagementPreview = {
  id: string;
  name: string | null;
  about: string | null;
  category: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  singleLineAddress: string | null;
  link: string | null;
  pictureUrl: string | null;
  detailsLoaded: boolean;
  errorCode: string | null;
  engagementError: string | null;
};

export async function getFacebookPageEngagementPreview(
  businessId: number,
  pageId: string,
): Promise<FacebookPageEngagementPreview> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const trimmedPageId = pageId.trim();
  if (!trimmedPageId) {
    throw new Error("Facebook Page is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/pages/${encodeURIComponent(String(businessId))}/${encodeURIComponent(trimmedPageId)}`,
    { method: "GET" },
    20_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load Facebook Page details.",
      ),
    );
  }

  return res.json() as Promise<FacebookPageEngagementPreview>;
}
