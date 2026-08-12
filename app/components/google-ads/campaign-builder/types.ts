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
  | "LOCAL_VISITS"
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
  | "GOOGLE_LEAD_FORM"
  | "PHONE_CALLS"
  | "WHATSAPP"
  | "APPOINTMENT_BOOKING";

export type TrafficActionId =
  | "LEARN_MORE"
  | "SHOP"
  | "READ_MORE"
  | "DOWNLOAD"
  | "CONTACT_US";

export type DestinationTypeId =
  | "dealioo_funnel"
  | "external_website"
  | "google_lead_form"
  | "phone"
  | "physical_location";

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
  businessLocationLat: number | null;
  businessLocationLng: number | null;
  leadContactMethods: LeadContactMethodId[];
  destinationType: DestinationTypeId | null;
  selectedFunnelId: number | null;
  selectedFunnelName: string;
  landingPageUrl: string;
  businessPhone: string;
  phoneCountryCode: string;
  whatsAppNumber: string;
  whatsAppMessage: string;
  bookingPageUrl: string;
  googleLeadFormHeadline: string;
  googleLeadFormDescription: string;
  googleLeadFormFields: string[];
  googleLeadFormCta: string;
  googleLeadFormCtaDescription: string;
  googleLeadFormPrivacyUrl: string;
  googleLeadFormThankYouHeadline: string;
  googleLeadFormThankYouMessage: string;
  googleLeadFormPostSubmitAction: string;
  googleLeadFormPostSubmitUrl: string;
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

function todayIsoDateLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function createDefaultDraft(): GoogleCampaignBuilderDraft {
  return {
    goal: null,
    goalDetailSubstep: 0,
    salesChannel: null,
    businessLocation: "",
    businessLocationLat: null,
    businessLocationLng: null,
    leadContactMethods: [],
    destinationType: null,
    selectedFunnelId: null,
    selectedFunnelName: "",
    landingPageUrl: "",
    businessPhone: "",
    phoneCountryCode: "+1",
    whatsAppNumber: "",
    whatsAppMessage: "",
    bookingPageUrl: "",
    googleLeadFormHeadline: "Get a Free Quote",
    googleLeadFormDescription:
      "Tell us what you need and our team will contact you.",
    googleLeadFormFields: ["FULL_NAME", "EMAIL", "PHONE"],
    googleLeadFormCta: "GET_QUOTE",
    googleLeadFormCtaDescription: "Get your free quote today",
    googleLeadFormPrivacyUrl: "",
    googleLeadFormThankYouHeadline: "Thank you!",
    googleLeadFormThankYouMessage: "We'll contact you shortly.",
    googleLeadFormPostSubmitAction: "VISIT_WEBSITE",
    googleLeadFormPostSubmitUrl: "",
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
    onboardingDone: true,
    dailyBudget: 20,
    startDate: todayIsoDateLocal(),
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
    description: "Get more purchases or orders from potential customers.",
  },
  {
    id: "LEADS",
    title: "Leads",
    description:
      "Get more calls, forms, bookings, or enquiries from potential customers.",
  },
  {
    id: "WEBSITE_TRAFFIC",
    title: "Website Traffic",
    description: "Send more potential customers to your funnel or website.",
  },
  {
    id: "AWARENESS",
    title: "Brand Awareness",
    description: "Reach more people and increase awareness of your business.",
  },
  {
    id: "LOCAL_VISITS",
    title: "Local Visits",
    description:
      "Get more people to visit or contact your physical business.",
  },
];

export const SALES_CHANNEL_OPTIONS: {
  id: Extract<SalesChannelId, "WEBSITE" | "PHONE_ORDERS" | "PHYSICAL_STORE">;
  title: string;
  description: string;
}[] = [
  {
    id: "WEBSITE",
    title: "Online",
    description: "Customers buy on your funnel or website.",
  },
  {
    id: "PHONE_ORDERS",
    title: "By Phone",
    description: "Customers call to buy or book.",
  },
  {
    id: "PHYSICAL_STORE",
    title: "At My Location",
    description: "Customers visit your physical business.",
  },
];

export const LEAD_CONTACT_OPTIONS: {
  id: Exclude<LeadContactMethodId, "WHATSAPP" | "APPOINTMENT_BOOKING">;
  title: string;
  description: string;
}[] = [
  {
    id: "CONTACT_FORM",
    title: "Dealioo / Website Form",
    description: "Send customers to a landing page with a lead form.",
  },
  {
    id: "GOOGLE_LEAD_FORM",
    title: "Google Lead Form",
    description: "Collect leads directly in Google without leaving search.",
  },
  {
    id: "PHONE_CALLS",
    title: "Phone Calls",
    description: "Encourage customers to call your business.",
  },
];

export const LEAD_PHONE_COUNTRY_CODES = [
  { code: "+1", label: "US/CA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "AU (+61)" },
  { code: "+91", label: "IN (+91)" },
  { code: "+971", label: "AE (+971)" },
  { code: "+92", label: "PK (+92)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+33", label: "FR (+33)" },
] as const;

export const GOOGLE_LEAD_FORM_FIELD_OPTIONS = [
  { id: "FULL_NAME", label: "Full name" },
  { id: "EMAIL", label: "Email" },
  { id: "PHONE", label: "Phone" },
  { id: "CITY", label: "City" },
  { id: "COMPANY_NAME", label: "Company name" },
] as const;

export const GOOGLE_LEAD_FORM_CTA_OPTIONS = [
  { id: "LEARN_MORE", label: "Learn more" },
  { id: "GET_QUOTE", label: "Get quote" },
  { id: "APPLY_NOW", label: "Apply now" },
  { id: "SIGN_UP", label: "Sign up" },
  { id: "CONTACT_US", label: "Contact us" },
] as const;

export const GOOGLE_LEAD_FORM_POST_SUBMIT_OPTIONS = [
  { id: "VISIT_WEBSITE", label: "Visit website" },
  { id: "DOWNLOAD", label: "Download" },
  { id: "LEARN_MORE", label: "Learn more" },
] as const;

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
  "Campaign Setup",
  "Budget",
  "Locations & Languages",
  "Target Customers",
  "Products & Services",
  "Create Ad",
  "Ad Enhancements",
  "Review & Publish",
] as const;
