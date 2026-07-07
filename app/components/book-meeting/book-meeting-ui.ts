import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  Megaphone,
  MessageSquareText,
  TrendingUp,
  User,
} from "lucide-react";

export type BookMeetingStepId =
  | "contact"
  | "business"
  | "revenue"
  | "marketing"
  | "situation"
  | "readiness";

export type BookMeetingStepUi = {
  lead: string;
  accent: string;
  subtitle?: string;
  icon: LucideIcon;
  iconClass: string;
  accentClass: string;
};

export const BOOK_MEETING_STEP_UI: Record<BookMeetingStepId, BookMeetingStepUi> = {
  contact: {
    lead: "How can we ",
    accent: "reach you?",
    subtitle: "We keep your details private and use them only to prepare for your call.",
    icon: User,
    iconClass: "bg-brand-primary text-white",
    accentClass: "landing-hero-accent-blue",
  },
  business: {
    lead: "Tell us about your ",
    accent: "business",
    subtitle: "Your role, business name, and location.",
    icon: Building2,
    iconClass: "bg-brand-convert text-white",
    accentClass: "landing-hero-accent-pink",
  },
  revenue: {
    lead: "What is your ",
    accent: "monthly revenue?",
    subtitle: "Approximate total across all locations or brands.",
    icon: TrendingUp,
    iconClass: "bg-brand-retain text-white",
    accentClass: "landing-hero-accent-green",
  },
  marketing: {
    lead: "What marketing have ",
    accent: "you tried?",
    subtitle: "Select all that apply. You can pick more than one.",
    icon: Megaphone,
    iconClass: "bg-brand-primary text-white",
    accentClass: "landing-hero-accent-pink",
  },
  situation: {
    lead: "What is your biggest ",
    accent: "challenge?",
    subtitle: "A few honest sentences help us prepare for your call.",
    icon: MessageSquareText,
    iconClass: "bg-brand-convert text-white",
    accentClass: "landing-hero-accent-blue",
  },
  readiness: {
    lead: "You are almost ",
    accent: "done",
    subtitle: "When you want to start and if you will come prepared.",
    icon: CalendarDays,
    iconClass: "bg-brand-offer text-white",
    accentClass: "landing-hero-accent-green",
  },
};

export const MEETING_PREVIEW_PHASES = [
  { label: "Contact", color: "#1877F2" },
  { label: "Business", color: "#e1306c" },
  { label: "Marketing", color: "#833aba" },
  { label: "Your call", color: "#34a853" },
] as const;

export function meetingPreviewPhaseIndex(stepIndex: number): number {
  if (stepIndex <= 1) return 0;
  if (stepIndex <= 2) return 1;
  if (stepIndex <= 3) return 2;
  return 3;
}

export function roleLabel(value: string): string {
  const labels: Record<string, string> = {
    business_owner: "Business owner",
    in_house_marketer: "In-house marketer",
    marketing_agency: "Marketing agency",
    consultant_partner: "Consultant or partner",
  };
  return labels[value] ?? "Your role";
}
