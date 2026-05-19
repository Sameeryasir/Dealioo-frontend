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
  Timer,
  UserPlus,
  Workflow,
} from "lucide-react";
import type {
  AutomationListItem,
  BlockDefinition,
  WorkflowNode,
} from "@/app/components/automation/types";

export const MOCK_AUTOMATIONS: AutomationListItem[] = [
  {
    id: "recover-abandoned-checkout",
    name: "Recover Abandoned Checkout",
    description: "Re-engage guests who signed up but did not complete payment.",
    trigger: "Signup",
    status: "active",
    restaurant: "Feastalytics Demo",
    lastUpdated: "2 hours ago",
    customersEntered: 122,
  },
  {
    id: "post-payment-thank-you",
    name: "Post-Payment Thank You",
    description: "Send a thank-you email and review request after successful payment.",
    trigger: "Payment",
    status: "published",
    restaurant: "Feastalytics Demo",
    lastUpdated: "Yesterday",
    customersEntered: 89,
  },
  {
    id: "win-back-lapsed",
    name: "Win Back Lapsed Guests",
    description: "Coupon offer for guests inactive for 30 days.",
    trigger: "Funnel Complete",
    status: "draft",
    restaurant: "Feastalytics Demo",
    lastUpdated: "3 days ago",
    customersEntered: 0,
  },
  {
    id: "vip-tag-flow",
    name: "VIP Tag & SMS",
    description: "Tag high-value customers and send a personal SMS.",
    trigger: "Payment",
    status: "paused",
    restaurant: "Downtown Bistro",
    lastUpdated: "1 week ago",
    customersEntered: 41,
  },
];

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

export const DEFAULT_WORKFLOW_NODES: WorkflowNode[] = [
  { id: "n1", kind: "signup_trigger", label: "Signup" },
  { id: "n2", kind: "wait", label: "Wait 30 mins" },
  { id: "n3", kind: "condition", label: "Condition" },
  { id: "n4", kind: "send_email", label: "Email" },
  { id: "n5", kind: "send_sms", label: "SMS" },
];

export function getAutomationById(id: string): AutomationListItem | undefined {
  return MOCK_AUTOMATIONS.find((a) => a.id === id);
}

export function getBlockByKind(kind: WorkflowNode["kind"]): BlockDefinition {
  return (
    AUTOMATION_BLOCKS.find((b) => b.id === kind) ?? AUTOMATION_BLOCKS[0]!
  );
}
