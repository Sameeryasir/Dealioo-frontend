export type MeetingFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  businessRole: string;
  businessCategory: string;
  businessName: string;
  cityLocation: string;
  monthlyRevenue: string;
  marketingActivities: string[];
  currentSituation: string;
  startTimeline: string;
  meetingCommitment: string;
};

export const BUSINESS_ROLE_OPTIONS = [
  {
    value: "business_owner",
    label: "Business owner",
    description: "I own or run a business.",
  },
  {
    value: "in_house_marketer",
    label: "In-house marketer",
    description: "I handle marketing for a business or brand.",
  },
  {
    value: "marketing_agency",
    label: "Marketing agency",
    description: "I run a marketing agency.",
  },
  {
    value: "consultant_partner",
    label: "Consultant or partner",
    description: "I advise or partner with businesses.",
  },
] as const;

export const MONTHLY_REVENUE_OPTIONS = [
  { value: "under_50k", amount: "Under $50,000", label: "Under $50,000 monthly" },
  { value: "50k_100k", amount: "$50,000 to $100,000", label: "$50,000 to $100,000 monthly" },
  { value: "100k_250k", amount: "$100,000 to $250,000", label: "$100,000 to $250,000 monthly" },
  { value: "250k_plus", amount: "Over $250,000", label: "Over $250,000 monthly" },
  { value: "1m_plus", amount: "Over $1 million", label: "Over $1 million monthly" },
  { value: "10m_plus", amount: "Over $10 million", label: "Over $10 million monthly" },
] as const;

export const MARKETING_ACTIVITY_OPTIONS = [
  { value: "paid_ads", label: "Paid ads on Meta, Google, or TikTok" },
  { value: "organic_social", label: "Organic social content" },
  { value: "influencer", label: "Influencer marketing" },
  { value: "sms_email", label: "SMS or email marketing" },
  { value: "loyalty_program", label: "Loyalty program" },
  { value: "other", label: "Other" },
] as const;

export const START_TIMELINE_OPTIONS = [
  { value: "immediately", label: "Start right away" },
  { value: "one_to_three_months", label: "Start in 1 to 3 months" },
  { value: "just_exploring", label: "Just exploring" },
] as const;

export const MEETING_COMMITMENT_OPTIONS = [
  {
    value: "yes",
    label: "Yes, I will come prepared",
  },
  {
    value: "not_sure",
    label: "No, I am not sure yet",
  },
] as const;

export const BOOK_MEETING_STEPS = [
  {
    id: "contact",
    number: 1,
    title: "How can we reach you?",
    required: true,
    hint: "We keep your details private and use them only to prepare for your call.",
  },
  {
    id: "business",
    number: 2,
    title: "Tell us about your business",
    required: true,
    hint: "Pick what describes you best, then add your details.",
  },
  {
    id: "revenue",
    number: 3,
    title: "What is your monthly revenue?",
    required: true,
    hint: "Approximate total across all locations or brands.",
  },
  {
    id: "marketing",
    number: 4,
    title: "What marketing have you tried?",
    required: true,
    hint: "Select all channels you have tried.",
    multiHint: "You can pick more than one.",
  },
  {
    id: "situation",
    number: 5,
    title: "What is your biggest challenge right now?",
    required: true,
    hint: "Share a few honest sentences about your challenge.",
  },
  {
    id: "readiness",
    number: 6,
    title: "You are almost done",
    required: true,
    hint: "When you want to start and if you will come prepared.",
  },
] as const;

export const DEFAULT_MEETING_FORM_VALUES: MeetingFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  businessRole: "",
  businessCategory: "",
  businessName: "",
  cityLocation: "",
  monthlyRevenue: "",
  marketingActivities: [],
  currentSituation: "",
  startTimeline: "",
  meetingCommitment: "",
};
