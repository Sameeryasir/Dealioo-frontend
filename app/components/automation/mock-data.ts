import {
  Clock,
  CreditCard,
  GitBranch,
  Mail,
  MessageSquare,
  Percent,
  RotateCcw,
  ShoppingCart,
  Sparkles,
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
  },
  {
    id: "payment_trigger",
    label: "Payment",
    section: "triggers",
    icon: CreditCard,
    tone: "blue",
  },
  {
    id: "abandoned_checkout_trigger",
    label: "Abandoned checkout",
    section: "triggers",
    icon: ShoppingCart,
    tone: "blue",
  },
  {
    id: "first_purchase_trigger",
    label: "First purchase",
    section: "triggers",
    icon: Sparkles,
    tone: "blue",
  },
  {
    id: "funnel_complete",
    label: "Funnel completed",
    section: "triggers",
    icon: GitBranch,
    tone: "blue",
  },
  {
    id: "win_back_trigger",
    label: "Win-back",
    section: "triggers",
    icon: RotateCcw,
    tone: "blue",
  },
  {
    id: "cron_trigger",
    label: "Cron Job",
    section: "triggers",
    icon: CalendarClock,
    tone: "blue",
  },
  {
    id: "wait",
    label: "Wait",
    section: "flow",
    icon: Clock,
    tone: "blue",
  },
  {
    id: "parallel_split",
    label: "Branch",
    section: "flow",
    icon: GitBranch,
    tone: "blue",
  },
  {
    id: "send_email",
    label: "Send Email",
    section: "actions",
    icon: Mail,
    tone: "violet",
  },
  {
    id: "send_sms",
    label: "Send SMS",
    section: "actions",
    icon: MessageSquare,
    tone: "violet",
  },
  {
    id: "create_coupon",
    label: "Create Coupon",
    section: "actions",
    icon: Percent,
    tone: "violet",
  },
  {
    id: "reviews",
    label: "Ask for Review",
    section: "actions",
    icon: Star,
    tone: "violet",
  },
  {
    id: "condition",
    label: "Condition",
    section: "conditions",
    icon: GitBranch,
    tone: "orange",
  },
];

const LEGACY_ACTION_BLOCKS: BlockDefinition[] = [
  {
    id: "delay",
    label: "Delay",
    section: "flow",
    icon: Timer,
    tone: "blue",
  },
];

export function getBlockByKind(kind: WorkflowNode["kind"]): BlockDefinition {
  return (
    AUTOMATION_BLOCKS.find((b) => b.id === kind) ??
    LEGACY_ACTION_BLOCKS.find((b) => b.id === kind) ??
    AUTOMATION_BLOCKS[0]!
  );
}
