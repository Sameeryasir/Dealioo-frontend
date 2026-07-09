import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type FacebookPage = {
  id: string;
  name: string | null;
};

export async function getFacebookPages(
  restaurantId: number,
): Promise<FacebookPage[]> {
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/pages/${encodeURIComponent(String(restaurantId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Facebook pages."),
    );
  }

  return res.json() as Promise<FacebookPage[]>;
}
