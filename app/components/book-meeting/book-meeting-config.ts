export type MeetingFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  businessRole: string;
  businessCategory: string;
  businessName: string;
  cityLocation: string;
  businessPhone: string;
  currency: string;
  businessEmail: string;
  description: string;
  website: string;
  state: string;
  postalCode: string;
  country: string;
  monthlyRevenue: string;
  marketingActivities: string[];
  currentSituation: string;
  startTimeline: string;
  meetingCommitment: string;
  selectedPlanSlug: string;
  selectedPlanName: string;
  selectedBillingCycle: "monthly" | "annual" | "";
  meetingDate: string;
  meetingTime: string;
  meetingDuration: 15 | 30;
  meetingTimeZone: string;
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
    title: "About the business",
    required: true,
    hint: "Name, contact, type, email, description, and website.",
  },
  {
    id: "location",
    number: 3,
    title: "Where the business is located",
    required: true,
    hint: "Search, map, and address, the same way a business is created.",
  },
  {
    id: "plan",
    number: 4,
    title: "Which plan are you interested in?",
    required: true,
    hint: "Pick the plan you want to talk about on the call.",
  },
  {
    id: "readiness",
    number: 5,
    title: "Schedule the meeting",
    required: true,
    hint: "Pick a day and time. We will save your request.",
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
  businessPhone: "",
  currency: "",
  businessEmail: "",
  description: "",
  website: "",
  state: "",
  postalCode: "",
  country: "",
  monthlyRevenue: "",
  marketingActivities: [],
  currentSituation: "",
  startTimeline: "",
  meetingCommitment: "",
  selectedPlanSlug: "",
  selectedPlanName: "",
  selectedBillingCycle: "",
  meetingDate: "",
  meetingTime: "",
  meetingDuration: 30,
  meetingTimeZone: "",
};

export const MEETING_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

export const MEETING_HORIZON_DAYS = 60;

export function meetingDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function meetingSlotMinutes(slot: string) {
  const [hourText, minuteText] = slot.split(":");
  return Number(hourText) * 60 + Number(minuteText);
}

export function isMeetingWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function latestBookableMeetingDay(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  last.setDate(last.getDate() + MEETING_HORIZON_DAYS);
  return last;
}

export function isBookableMeetingDay(date: Date, now = new Date()) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day < today || day > latestBookableMeetingDay(now)) return false;
  return !isMeetingWeekend(day);
}

export function nextOpenMeeting(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let offset = 0; offset <= MEETING_HORIZON_DAYS; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    if (!isBookableMeetingDay(day, now)) continue;
    const minutes = offset === 0 ? now.getHours() * 60 + now.getMinutes() : -1;
    const time = MEETING_TIME_SLOTS.find((slot) => meetingSlotMinutes(slot) >= minutes);
    if (time) return { date: meetingDateKey(day), time };
  }
  return { date: "", time: "" };
}

export function meetingSlotStillOpen(date: string, time: string, now = new Date()) {
  if (!date || !time) return false;
  const [yearText, monthText, dayText] = date.split("-");
  const day = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  if (!isBookableMeetingDay(day, now)) return false;
  if (meetingDateKey(day) !== meetingDateKey(now)) return true;
  return meetingSlotMinutes(time) >= now.getHours() * 60 + now.getMinutes();
}

export function upcomingMeetingDays(count = 10, from = new Date()) {
  const days: { value: string; weekday: string; label: string }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (days.length < count) {
    const value = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, "0"),
      String(cursor.getDate()).padStart(2, "0"),
    ].join("-");
    days.push({
      value,
      weekday: cursor.toLocaleDateString(undefined, { weekday: "short" }),
      label: cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatMeetingDate(value: string) {
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatMeetingTime(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour) || !minuteText) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteText} ${suffix}`;
}
