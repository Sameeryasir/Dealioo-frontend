import type {
  GoogleAdsLocationRef,
  PresenceOptionId,
  RadiusUnitId,
} from "@/app/components/google-ads/campaign-builder/location-targeting";

export type CampaignGoalId =
  | "SALES"
  | "LEADS"
  | "WEBSITE_TRAFFIC"
  | "AWARENESS"
  | "APP_PROMOTION";

export type {
  GoogleAdsLocationRef,
  PresenceOptionId,
  RadiusUnitId,
};

export type SalesChannelId =
  | "WEBSITE"
  | "ONLINE_STORE"
  | "PHYSICAL_STORE"
  | "PHONE_ORDERS"
  | "MULTIPLE";

export type LeadContactMethodId =
  | "CONTACT_FORM"
  | "PHONE_CALLS"
  | "WHATSAPP"
  | "APPOINTMENT_BOOKING";

export type TrafficActionId =
  | "LEARN_MORE"
  | "SHOP"
  | "READ_MORE"
  | "DOWNLOAD"
  | "CONTACT_US";

export type AgeRangeId = "18-24" | "25-34" | "35-44" | "45-54" | "55+";

export type KeywordMatchType = "BROAD" | "PHRASE" | "EXACT";

export type BidStrategyId =
  | "MAXIMIZE_CLICKS"
  | "MAXIMIZE_CONVERSIONS"
  | "MANUAL_CPC"
  | "TARGET_CPA"
  | "TARGET_ROAS";

export type CampaignTypeId = "SEARCH" | "DISPLAY" | "PERFORMANCE_MAX";

export type CallToActionId =
  | "LEARN_MORE"
  | "BOOK_NOW"
  | "CALL_NOW"
  | "SHOP_NOW"
  | "ORDER_ONLINE"
  | "GET_QUOTE"
  | "SIGN_UP"
  | "CONTACT_US";

export type GenderId = "ALL" | "MALE" | "FEMALE";

export type SuggestedKeyword = {
  id: string;
  text: string;
  enabled: boolean;
};

export type AdCreativeDraft = {
  id: string;
  finalUrl: string;
  headlines: string[];
  descriptions: string[];
  path1: string;
  path2: string;
  callToAction: CallToActionId;
};

export type SitelinkDraft = {
  id: string;
  text: string;
  url: string;
  description1: string;
  description2: string;
  enabled: boolean;
};

export type GoogleCampaignBuilderDraft = {
  goal: CampaignGoalId | null;
  goalDetailSubstep: number;

  salesChannel: SalesChannelId | null;
  businessLocation: string;
  leadContactMethods: LeadContactMethodId[];
  landingPageUrl: string;
  businessPhone: string;
  trafficAction: TrafficActionId | null;
  businessAddress: string;
  businessHours: string;
  appName: string;

  campaignName: string;
  businessName: string;
  websiteUrl: string;
  businessCategory: string;
  logoPreviewUrl: string;
  logoFileName: string;

  businessDescription: string;
  onboardingDone: boolean;

  dailyBudget: number;
  startDate: string;
  endDate: string;

  countries: string[];
  regions: string[];
  cities: string[];
  targetLocations: GoogleAdsLocationRef[];
  excludedLocationTargets: GoogleAdsLocationRef[];
  radiusTargeting: string;
  radiusEnabled: boolean;
  radiusCenter: GoogleAdsLocationRef | null;
  radiusLat: number | null;
  radiusLng: number | null;
  radiusValue: number;
  radiusUnit: RadiusUnitId;
  excludedLocations: string[];
  presenceOption: PresenceOptionId;

  languages: string[];

  idealCustomers: string[];
  ageRanges: AgeRangeId[];
  gender: GenderId;
  householdIncome: string;
  interests: string[];

  productsServices: string[];
  businessType: string;
  suggestedKeywords: SuggestedKeyword[];
  customKeywords: string[];
  negativeKeywords: string[];
  keywordMatchType: KeywordMatchType;

  ads: AdCreativeDraft[];
  adsGenerated: boolean;

  extensionBusinessName: string;
  phoneNumber: string;
  callouts: string[];
  structuredSnippetHeader: string;
  structuredSnippetValues: string[];
  useLocationExtension: boolean;
  sitelinks: SitelinkDraft[];
  assetsGenerated: boolean;

  campaignType: CampaignTypeId;
  bidStrategy: BidStrategyId;
  targetCpa: string;
  targetRoas: string;
  adSchedule: string;
  deviceTargeting: string[];
  networkSelection: string[];
  ipExclusions: string;
  urlTrackingParams: string;
  conversionGoals: string;
  brandExclusions: string;
  frequencyCapping: string;
  contentExclusions: string;
  audienceExpansion: boolean;

  savedAt: string | null;
  currentStep: number;
  wizardVersion: number;
};

export function createEmptyAd(finalUrl = ""): AdCreativeDraft {
  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    finalUrl,
    headlines: ["", "", ""],
    descriptions: ["", ""],
    path1: "",
    path2: "",
    callToAction: "LEARN_MORE",
  };
}

export function createEmptySitelink(
  text = "",
  url = "",
): SitelinkDraft {
  return {
    id: `sl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    url,
    description1: "",
    description2: "",
    enabled: true,
  };
}

export function createDefaultDraft(): GoogleCampaignBuilderDraft {
  return {
    goal: null,
    goalDetailSubstep: 0,
    salesChannel: null,
    businessLocation: "",
    leadContactMethods: [],
    landingPageUrl: "",
    businessPhone: "",
    trafficAction: null,
    businessAddress: "",
    businessHours: "",
    appName: "",
    campaignName: "",
    businessName: "",
    websiteUrl: "",
    businessCategory: "",
    logoPreviewUrl: "",
    logoFileName: "",
    businessDescription: "",
    // Skip opening "describe your business" screen — start on campaign goal.
    onboardingDone: true,
    dailyBudget: 40,
    startDate: "",
    endDate: "",
    countries: [],
    regions: [],
    cities: [],
    targetLocations: [],
    excludedLocationTargets: [],
    radiusTargeting: "",
    radiusEnabled: false,
    radiusCenter: null,
    radiusLat: null,
    radiusLng: null,
    radiusValue: 16,
    radiusUnit: "KILOMETERS",
    excludedLocations: [],
    presenceOption: "PRESENCE",
    languages: ["English"],
    idealCustomers: [],
    ageRanges: ["25-34", "35-44"],
    gender: "ALL",
    householdIncome: "",
    interests: [],
    productsServices: [],
    businessType: "",
    suggestedKeywords: [],
    customKeywords: [],
    negativeKeywords: [],
    keywordMatchType: "BROAD",
    ads: [createEmptyAd()],
    adsGenerated: false,
    extensionBusinessName: "",
    phoneNumber: "",
    callouts: [],
    structuredSnippetHeader: "Services",
    structuredSnippetValues: [],
    useLocationExtension: false,
    sitelinks: [],
    assetsGenerated: false,
    campaignType: "SEARCH",
    bidStrategy: "MAXIMIZE_CLICKS",
    targetCpa: "",
    targetRoas: "",
    adSchedule: "",
    deviceTargeting: ["Mobile", "Desktop", "Tablet"],
    networkSelection: ["Google Search"],
    ipExclusions: "",
    urlTrackingParams: "",
    conversionGoals: "",
    brandExclusions: "",
    frequencyCapping: "",
    contentExclusions: "",
    audienceExpansion: false,
    savedAt: null,
    currentStep: 1,
    wizardVersion: 2,
  };
}

export const GOAL_OPTIONS: {
  id: CampaignGoalId;
  title: string;
  description: string;
}[] = [
  {
    id: "SALES",
    title: "Sales",
    description: "Increase online purchases and revenue.",
  },
  {
    id: "LEADS",
    title: "Leads",
    description:
      "Generate enquiries, form submissions, phone calls, or bookings.",
  },
  {
    id: "WEBSITE_TRAFFIC",
    title: "Website Traffic",
    description: "Drive more visitors to a website or landing page.",
  },
  {
    id: "AWARENESS",
    title: "Brand Awareness",
    description: "Reach more people and increase visibility.",
  },
];

export const SALES_CHANNEL_OPTIONS: {
  id: SalesChannelId;
  title: string;
  description: string;
}[] = [
  {
    id: "WEBSITE",
    title: "Website",
    description: "Customers buy on your website.",
  },
  {
    id: "ONLINE_STORE",
    title: "Online Store",
    description: "Customers shop in your ecommerce store.",
  },
  {
    id: "PHYSICAL_STORE",
    title: "Physical Store",
    description: "Customers visit your location.",
  },
  {
    id: "PHONE_ORDERS",
    title: "Phone Orders",
    description: "Customers call to buy or book.",
  },
  {
    id: "MULTIPLE",
    title: "Multiple",
    description: "A mix of website and store sales.",
  },
];

export const LEAD_CONTACT_OPTIONS: {
  id: LeadContactMethodId;
  title: string;
}[] = [
  { id: "CONTACT_FORM", title: "Contact Form" },
  { id: "PHONE_CALLS", title: "Phone Calls" },
  { id: "WHATSAPP", title: "WhatsApp" },
  { id: "APPOINTMENT_BOOKING", title: "Appointment Booking" },
];

export const TRAFFIC_ACTION_OPTIONS: {
  id: TrafficActionId;
  label: string;
}[] = [
  { id: "LEARN_MORE", label: "Learn More" },
  { id: "SHOP", label: "Shop" },
  { id: "READ_MORE", label: "Read More" },
  { id: "DOWNLOAD", label: "Download" },
  { id: "CONTACT_US", label: "Contact Us" },
];

export const CTA_OPTIONS: { id: CallToActionId; label: string }[] = [
  { id: "LEARN_MORE", label: "Learn More" },
  { id: "BOOK_NOW", label: "Book Now" },
  { id: "CALL_NOW", label: "Call Now" },
  { id: "SHOP_NOW", label: "Shop Now" },
  { id: "ORDER_ONLINE", label: "Order Online" },
  { id: "GET_QUOTE", label: "Get Quote" },
  { id: "SIGN_UP", label: "Sign Up" },
  { id: "CONTACT_US", label: "Contact Us" },
];

export const AGE_RANGE_OPTIONS: AgeRangeId[] = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
];

export const LANGUAGE_OPTIONS = [
  "Arabic",
  "Bengali",
  "Bulgarian",
  "Catalan",
  "Chinese (simplified)",
  "Chinese (traditional)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Estonian",
  "Filipino",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Gujarati",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Indonesian",
  "Italian",
  "Japanese",
  "Kannada",
  "Korean",
  "Latvian",
  "Lithuanian",
  "Malay",
  "Malayalam",
  "Marathi",
  "Norwegian",
  "Persian",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Serbian",
  "Slovak",
  "Slovenian",
  "Spanish",
  "Swedish",
  "Tamil",
  "Telugu",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese",
];

export const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "United Arab Emirates",
  "Saudi Arabia",
  "Germany",
  "France",
  "Pakistan",
];

export const INTEREST_OPTIONS = [
  "Restaurant",
  "Coffee",
  "Travel",
  "Technology",
  "Beauty",
  "Fitness",
  "Cars",
  "Shopping",
  "Pets",
  "Gaming",
  "Business",
  "Education",
  "Health",
];

export const BUSINESS_TYPE_OPTIONS = [
  "Restaurant",
  "Cafe",
  "Salon",
  "Dentist",
  "Gym",
  "Hotel",
  "Law Firm",
  "Real Estate",
  "Retail Store",
  "Plumber",
  "Electrician",
  "Doctor",
  "Automotive",
  "Bakery",
  "Spa",
  "Clinic",
];

export const BUSINESS_CATEGORY_OPTIONS = [
  "Food & Dining",
  "Retail",
  "Health & Wellness",
  "Beauty & Personal Care",
  "Home Services",
  "Professional Services",
  "Travel & Hospitality",
  "Automotive",
  "Education",
  "Technology",
  "Other",
];

export const HOUSEHOLD_INCOME_OPTIONS = [
  "Top 10%",
  "Top 20%",
  "Top 30%",
  "Top 40%",
  "Top 50%",
  "Lower 50%",
];

export const TOTAL_WIZARD_STEPS = 9;

export const STEP_TITLES = [
  "Campaign Goal",
  "Campaign Details",
  "Budget",
  "Locations & Languages",
  "Target Customers",
  "Products & Services",
  "Ads",
  "Business Details",
  "Review & Publish",
] as const;

export const IDEAL_CUSTOMER_OPTIONS = [
  "Homeowners",
  "Restaurant owners",
  "Parents",
  "Small businesses",
  "Students",
  "Professionals",
  "Local shoppers",
  "Property managers",
  "Healthcare patients",
  "Travelers",
] as const;
