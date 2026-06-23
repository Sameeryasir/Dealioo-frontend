export type MetaCampaignObjective =
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_AWARENESS";

export type MetaSpecialAdCategory =
  | "HOUSING"
  | "EMPLOYMENT"
  | "CREDIT"
  | "ISSUES_ELECTIONS_POLITICS"
  | "FINANCIAL_PRODUCTS_SERVICES";

export type MetaCampaignStatus = "PAUSED" | "ACTIVE";

export type MetaAdSetBudgetType = "daily" | "lifetime";

export type MetaBidStrategy =
  | "LOWEST_COST_WITHOUT_CAP"
  | "LOWEST_COST_WITH_BID_CAP"
  | "COST_CAP";

export type MetaBillingEvent = "IMPRESSIONS" | "LINK_CLICKS";

export type MetaOptimizationGoal =
  | "LINK_CLICKS"
  | "LANDING_PAGE_VIEWS"
  | "LEAD_GENERATION"
  | "OFFSITE_CONVERSIONS"
  | "POST_ENGAGEMENT"
  | "REACH"
  | "IMPRESSIONS";

export type MetaDestinationType =
  | "WEBSITE"
  | "MESSENGER"
  | "WHATSAPP"
  | "INSTAGRAM_DIRECT";

export type MetaGender = "all" | "male" | "female";

export type MetaDistanceUnit = "mile" | "kilometer";

export type MetaLocationTargetMode = "include" | "exclude";

export type AdSetLocationTarget = {
  id: string;
  mode: MetaLocationTargetMode;
  type: "country" | "address";
  countryCode: string;
  countryName: string;
  label: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  distanceUnit?: MetaDistanceUnit;
};

export type MetaCampaignBudgetType = "daily" | "lifetime";

export type MetaBudgetStrategy = "campaign" | "adset";

export type CampaignStepData = {
  name: string;
  buyingType: "AUCTION";
  objective: MetaCampaignObjective;
  specialAdCategories: MetaSpecialAdCategory[];
  campaignBudgetOptimization: boolean;
  budgetStrategy: MetaBudgetStrategy;
  campaignBudgetType?: MetaCampaignBudgetType;
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  campaignBidStrategy?: MetaBidStrategy;
  budgetScheduling?: "none";
  campaignSpendLimit?: number;
  status: MetaCampaignStatus;
};

export type AdSetPromotedObject = {
  pixelId?: string;
  customEventType?: string;
  pageId?: string;
};

export type AdSetAudience = {
  country: string;
  region?: string;
  city?: string;
  radius?: number;
  distanceUnit?: MetaDistanceUnit;
  latitude?: number;
  longitude?: number;
  locations?: AdSetLocationTarget[];
  ageMin: number;
  ageMax: number;
  gender: MetaGender;
  languages?: string[];
  interests?: string[];
  behaviors?: string[];
  demographics?: string[];
  customAudiences?: string[];
  excludedCustomAudiences?: string[];
};

export type AdSetPlacements = {
  advantagePlusPlacements: boolean;
  devicePlatforms: { mobile: boolean; desktop: boolean };
  publisherPlatforms: {
    facebook: boolean;
    instagram: boolean;
    audienceNetwork?: boolean;
    messenger?: boolean;
  };
  facebookPositions: {
    feed: boolean;
    story: boolean;
    reels: boolean;
    marketplace: boolean;
    videoFeeds: boolean;
    rightHandColumn?: boolean;
  };
  instagramPositions: {
    stream: boolean;
    story: boolean;
    reels: boolean;
    explore: boolean;
  };
};

export type AdSetStepData = {
  name: string;
  draftId: string;
  status: MetaCampaignStatus;
  budgetType?: MetaAdSetBudgetType;
  dailyBudget?: number;
  lifetimeBudget?: number;
  dailyBudgetMinor?: string;
  lifetimeBudgetMinor?: string;
  bidStrategy: MetaBidStrategy;
  bidAmount?: number;
  billingEvent: MetaBillingEvent;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  startDateTime: string;
  endDateTime: string;
  optimizationGoal: MetaOptimizationGoal;
  destinationType: MetaDestinationType;
  promotedObject?: AdSetPromotedObject;
  audience: AdSetAudience;
  placements: AdSetPlacements;
};

export type MetaCallToAction =
  | "LEARN_MORE"
  | "SIGN_UP"
  | "GET_OFFER"
  | "ORDER_NOW"
  | "BOOK_NOW"
  | "CALL_NOW"
  | "SEND_MESSAGE"
  | "CONTACT_US";

export type MetaCreativeFormat = "SINGLE_IMAGE" | "SINGLE_VIDEO" | "CAROUSEL";

export type CarouselCard = {
  mediaType?: "image" | "video";
  imageUrl?: string;
  videoUrl?: string;
  headline: string;
  description?: string;
  destinationUrl: string;
  callToAction: MetaCallToAction;
};

export type AdCreativeStepData = {
  name: string;
  draftId: string;
  facebookPageId: string;
  instagramActorId?: string;
  status: MetaCampaignStatus;
  creativeFormat: MetaCreativeFormat;
  imageUrl?: string;
  imageAltText?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  carouselCards?: CarouselCard[];
  primaryText: string;
  headline?: string;
  description?: string;
  displayLink?: string;
  destinationUrl?: string;
  urlParameters?: string;
  callToAction?: MetaCallToAction;
  pixelId?: string;
  conversionEvent?: string;
  brandingEnabled?: boolean;
  brandName?: string;
  brandLogoUrl?: string;
};
export type MetaCampaignDraft = {
  id: string;
  restaurantId: number;
  currentStep: number;
  status: string;
  campaignData: CampaignStepData | null;
  adSetData: AdSetStepData | null;
  adCreativeData: AdCreativeStepData | null;
  metaCampaignId: string | null;
  metaAdsetId: string | null;
  metaCreativeId: string | null;
  metaAdId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveCampaignStepPayload = CampaignStepData & {
  draftId?: string;
};

export type SaveAdSetStepPayload = Omit<
  AdSetStepData,
  "startDateTime" | "endDateTime" | "dailyBudgetMinor" | "lifetimeBudgetMinor"
>;

export type SaveAdCreativeStepPayload = AdCreativeStepData;

export const BUILDER_STEPS = [
  { id: 1, label: "Campaign" },
  { id: 2, label: "Ad Set" },
  { id: 3, label: "Ad / Creative" },
  { id: 4, label: "Review & Publish" },
] as const;

/** Ads Manager deep link for the restaurant's linked ad account. */
export function buildMetaAdsManagerUrl(adAccountId: string): string {
  const numeric = adAccountId.replace(/^act_/, "").trim();
  if (!numeric) {
    return "https://www.facebook.com/adsmanager";
  }
  return `https://www.facebook.com/adsmanager/manage/campaigns?act=${numeric}`;
}

/** Open Ads Manager after publish when the owner chose Active delivery in the builder. */
export function shouldOpenMetaAdsManagerAfterPublish(
  campaign: Pick<CampaignStepData, "status">,
): boolean {
  return campaign.status === "ACTIVE";
}

export function openMetaAdsManager(url: string): void {
  const trimmed = url.trim();
  if (!trimmed) return;
  window.open(trimmed, "_blank", "noopener,noreferrer");
}
