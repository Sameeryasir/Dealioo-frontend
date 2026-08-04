import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type GenerateGoogleKeywordsRequest = {
  productsServices: string[];
  businessName?: string;
  businessCategory?: string;
  goal?: string | null;
  goalLabel?: string;
  idealCustomers?: string[];
  ageRanges?: string[];
  gender?: string;
  interests?: string[];
};

export type GenerateGoogleKeywordsResponse = {
  keywords: string[];
  negativeKeywords: string[];
};

export async function generateGoogleKeywordsWithAi(
  businessId: number,
  payload: GenerateGoogleKeywordsRequest,
): Promise<GenerateGoogleKeywordsResponse> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/google-ads/business/${encodeURIComponent(String(businessId))}/drafts/generate-keywords`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productsServices: payload.productsServices,
        businessName: payload.businessName,
        businessCategory: payload.businessCategory,
        goal: payload.goal ?? undefined,
        goalLabel: payload.goalLabel,
        idealCustomers: payload.idealCustomers,
        ageRanges: payload.ageRanges,
        gender: payload.gender,
        interests: payload.interests,
      }),
    },
    45_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not generate keywords with AI."),
    );
  }

  return (await res.json()) as GenerateGoogleKeywordsResponse;
}
