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
  thumbSrc: string;
};

export const FUNNEL_STEP_META: FunnelStepMeta[] = [
  {
    id: "landing",
    title: "Landing",
    description: "Offer page, hero & CTA",
    icon: Home,
    thumbSrc: "/dashboard/funnel-steps/funnel-step-landing-3d.png",
  },
  {
    id: "signup",
    title: "Signup",
    description: "Lead capture form",
    icon: UserPlus,
    thumbSrc: "/dashboard/funnel-steps/funnel-step-signup-3d.png",
  },
  {
    id: "payment",
    title: "Payment",
    description: "Checkout & order summary",
    icon: CreditCard,
    thumbSrc: "/dashboard/funnel-steps/funnel-step-payment-3d.png",
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "Thank-you page & next steps",
    icon: CheckCircle2,
    thumbSrc: "/dashboard/funnel-steps/funnel-step-confirmation-3d.png",
  },
];
