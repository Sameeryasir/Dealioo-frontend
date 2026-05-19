import type { LucideIcon } from "lucide-react";

export type AutomationStatus = "draft" | "published" | "active" | "paused";

export type AutomationFilter = "all" | AutomationStatus;

export type AutomationListItem = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: AutomationStatus;
  restaurant: string;
  lastUpdated: string;
  customersEntered: number;
};

export type BlockSection = "triggers" | "actions" | "conditions" | "flow";

export type WorkflowNodeKind =
  | "signup_trigger"
  | "payment_trigger"
  | "funnel_complete"
  | "wait"
  | "send_email"
  | "send_sms"
  | "send_whatsapp"
  | "condition"
  | "create_coupon"
  | "tag_customer"
  | "delay"
  | "reviews";

export type BlockDefinition = {
  id: WorkflowNodeKind;
  label: string;
  section: BlockSection;
  icon: LucideIcon;
  tone: "emerald" | "blue" | "violet" | "orange" | "zinc" | "amber";
};

export type WorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
};

export type BuilderNodeSettings =
  | { type: "wait"; value: number; unit: "minutes" | "hours" | "days" }
  | { type: "email"; template: string; subject: string }
  | { type: "condition"; conditionType: string; value: string }
  | { type: "default" };
