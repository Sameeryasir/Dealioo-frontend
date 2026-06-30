import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

/** Meta campaign create runs 5 Graph API calls, needs more than the default 5s. */
const CREATE_FACEBOOK_CAMPAIGN_TIMEOUT_MS = 120_000;

export type MetaCampaignObjective =
  | "OUTCOME_LEADS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_SALES"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_AWARENESS";

export type MetaCallToAction =
  | "LEARN_MORE"
  | "SIGN_UP"
  | "BOOK_NOW"
  | "SHOP_NOW"
  | "GET_OFFER"
  | "ORDER_NOW"
  | "CALL_NOW";

export type MetaGender = "all" | "male" | "female";

export type MetaDistanceUnit = "mile" | "kilometer";

export type MetaPlacements = {
  facebookFeed: boolean;
  instagramFeed: boolean;
  facebookStories: boolean;
  instagramStories: boolean;
  reels: boolean;
};

export type CreateFacebookCampaignPayload = {
  name: string;
  objective: MetaCampaignObjective;
  adSetName?: string;
  adName?: string;
  dailyBudget: number;
  startDate: string;
  endDate: string;
  country: string;
  city?: string;
  radius?: number;
  distanceUnit?: MetaDistanceUnit;
  ageMin: number;
  ageMax: number;
  gender: MetaGender;
  placements: MetaPlacements;
  facebookPageId: string;
  instagramActorId?: string;
  headline: string;
  primaryText: string;
  description?: string;
  destinationUrl: string;
  callToAction: MetaCallToAction;
  imageUrl?: string;
  videoUrl?: string;
  specialAdCategories?: string[];
};

export type CreateFacebookCampaignResult = {
  id: string;
  metaCampaignId: string;
  metaAdsetId: string;
  metaCreativeId: string;
  metaAdId: string;
  status: string;
  adsManagerUrl: string;
  message: string;
};

export async function createFacebookCampaign(
  restaurantId: number,
  payload: CreateFacebookCampaignPayload,
): Promise<CreateFacebookCampaignResult> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook-campaigns/restaurant/${encodeURIComponent(String(restaurantId))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    CREATE_FACEBOOK_CAMPAIGN_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not create Facebook campaign."),
    );
  }

  return res.json() as Promise<CreateFacebookCampaignResult>;
}
