import {
  CheckCircle2,
  CreditCard,
  Home,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

export type FunnelStepMeta = {
  id: TemplatePageId;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const FUNNEL_STEP_META: FunnelStepMeta[] = [
  {
    id: "landing",
    title: "Landing",
    description: "Offer page, hero & CTA",
    icon: Home,
  },
  {
    id: "signup",
    title: "Signup",
    description: "Lead capture form",
    icon: UserPlus,
  },
  {
    id: "payment",
    title: "Payment",
    description: "Checkout & order summary",
    icon: CreditCard,
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "Thank-you & next steps",
    icon: CheckCircle2,
  },
];
