import {
  Clock,
  CreditCard,
  GitBranch,
  Mail,
  MessageSquare,
  Percent,
  ShoppingCart,
  Star,
  CalendarClock,
  Timer,
  UserPlus,
} from "lucide-react";
import type { BlockDefinition, WorkflowNode } from "@/app/components/automation/types";

export const AUTOMATION_BLOCKS: BlockDefinition[] = [
  {
    id: "signup_trigger",
    label: "Signup",
    section: "triggers",
    icon: UserPlus,
    tone: "blue",
    description: "Starts when a guest completes the signup form.",
    keywords: ["trigger", "form", "guest", "customer signed up"],
  },
  {
    id: "payment_trigger",
    label: "Payment",
    section: "triggers",
    icon: CreditCard,
    tone: "blue",
    description: "Starts when a guest completes payment.",
    keywords: ["trigger", "paid", "checkout", "stripe"],
  },
  {
    id: "abandoned_checkout_trigger",
    label: "Abandoned checkout",
    section: "triggers",
    icon: ShoppingCart,
    tone: "blue",
    description: "Starts when checkout begins but payment is incomplete.",
    keywords: ["trigger", "cart", "recovery", "unpaid"],
  },
  {
    id: "ask_review_trigger",
    label: "Ask Review",
    section: "triggers",
    icon: Star,
    tone: "blue",
    description: "Targets paid guests who have not left a review yet.",
    keywords: ["trigger", "feedback", "rating"],
  },
  {
    id: "cron_trigger",
    label: "Cron Job",
    section: "triggers",
    icon: CalendarClock,
    tone: "blue",
    description: "Runs on a schedule (for example daily payment reminders).",
    keywords: ["trigger", "schedule", "timer", "daily", "reminder"],
  },
  {
    id: "wait",
    label: "Wait",
    section: "flow",
    icon: Clock,
    tone: "blue",
    description: "Pause the journey for a specified duration.",
    keywords: ["delay", "pause", "hours", "days"],
  },
  {
    id: "parallel_split",
    label: "Branch",
    section: "flow",
    icon: GitBranch,
    tone: "blue",
    description: "Split the journey into parallel paths.",
    keywords: ["split", "fork", "paths", "parallel"],
  },
  {
    id: "send_email",
    label: "Send Email",
    section: "actions",
    icon: Mail,
    tone: "violet",
    description: "Send an email message to the customer.",
    keywords: ["message", "mail", "inbox", "subject"],
  },
  {
    id: "send_sms",
    label: "Send SMS",
    section: "actions",
    icon: MessageSquare,
    tone: "violet",
    description: "Deliver a text message to a customer.",
    keywords: ["message", "text", "sms", "phone"],
  },
  {
    id: "reviews",
    label: "Ask for Review",
    section: "actions",
    icon: Star,
    tone: "violet",
    description: "Send a review request with a call to action.",
    keywords: ["message", "feedback", "rating", "star"],
  },
  {
    id: "condition",
    label: "Condition",
    section: "conditions",
    icon: GitBranch,
    tone: "orange",
    description: "Route customers based on rules.",
    keywords: ["filter", "if", "paid", "visited", "rule"],
  },
];

const LEGACY_ACTION_BLOCKS: BlockDefinition[] = [
  {
    id: "delay",
    label: "Delay",
    section: "flow",
    icon: Timer,
    tone: "blue",
    description: "Legacy delay step (prefer Wait).",
    keywords: ["wait", "pause"],
  },
  {
    id: "create_coupon",
    label: "Create Coupon",
    section: "actions",
    icon: Percent,
    tone: "violet",
    description: "Create a reward coupon for the guest.",
    keywords: ["discount", "offer", "reward"],
  },
];

export function getBlockByKind(kind: WorkflowNode["kind"]): BlockDefinition {
  return (
    AUTOMATION_BLOCKS.find((b) => b.id === kind) ??
    LEGACY_ACTION_BLOCKS.find((b) => b.id === kind) ??
    AUTOMATION_BLOCKS[0]!
  );
}
