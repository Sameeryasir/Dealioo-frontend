import {
  Clock,
  CreditCard,
  GitBranch,
  Mail,
  MessageCircle,
  MessageSquare,
  Percent,
  Star,
  Tag,
  CalendarClock,
  Timer,
  UserPlus,
  Workflow,
} from "lucide-react";
import type { BlockDefinition, WorkflowNode } from "@/app/components/automation/types";

export const AUTOMATION_BLOCKS: BlockDefinition[] = [
  {
    id: "signup_trigger",
    label: "Signup Trigger",
    section: "triggers",
    icon: UserPlus,
    tone: "emerald",
  },
  {
    id: "payment_trigger",
    label: "Payment Trigger",
    section: "triggers",
    icon: CreditCard,
    tone: "emerald",
  },
  {
    id: "funnel_complete",
    label: "Funnel Complete",
    section: "triggers",
    icon: Workflow,
    tone: "emerald",
  },
  {
    id: "cron_trigger",
    label: "Cron Job",
    section: "triggers",
    icon: CalendarClock,
    tone: "violet",
  },
  {
    id: "wait",
    label: "Wait",
    section: "flow",
    icon: Clock,
    tone: "blue",
  },
  {
    id: "delay",
    label: "Delay",
    section: "flow",
    icon: Timer,
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
    id: "send_whatsapp",
    label: "Send WhatsApp",
    section: "actions",
    icon: MessageCircle,
    tone: "violet",
  },
  {
    id: "condition",
    label: "Condition",
    section: "conditions",
    icon: GitBranch,
    tone: "orange",
  },
  {
    id: "create_coupon",
    label: "Create Coupon",
    section: "actions",
    icon: Percent,
    tone: "zinc",
  },
  {
    id: "tag_customer",
    label: "Tag Customer",
    section: "actions",
    icon: Tag,
    tone: "zinc",
  },
  {
    id: "reviews",
    label: "Reviews",
    section: "actions",
    icon: Star,
    tone: "amber",
  },
];

export function getBlockByKind(kind: WorkflowNode["kind"]): BlockDefinition {
  return (
    AUTOMATION_BLOCKS.find((b) => b.id === kind) ?? AUTOMATION_BLOCKS[0]!
  );
}
