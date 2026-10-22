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
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconWrapClass: string;
  thumbSrc: string;
};

export const FUNNEL_STEP_META: FunnelStepMeta[] = [
  {
    id: "landing",
    title: "Landing",
    subtitle: "Offer page",
    description: "Introduce the offer",
    icon: Home,
    iconWrapClass:
      "bg-gradient-to-br from-[#3b82f6] to-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]",
    thumbSrc: "/dashboard/funnel-steps/funnel-step-landing-3d.png",
  },
  {
    id: "signup",
    title: "Signup",
    subtitle: "Guest details",
    description: "Collect customer info",
    icon: UserPlus,
    iconWrapClass: "bg-[#e8f1ff] text-[#1877f2] ring-1 ring-[#dbeafe]",
    thumbSrc: "/dashboard/funnel-steps/funnel-step-signup-3d.png",
  },
  {
    id: "payment",
    title: "Payment",
    subtitle: "Checkout",
    description: "Secure Stripe payment",
    icon: CreditCard,
    iconWrapClass: "bg-[#f3e8ff] text-[#7e22ce] ring-1 ring-[#e9d5ff]",
    thumbSrc: "/dashboard/funnel-steps/funnel-step-payment-3d.png",
  },
  {
    id: "confirmation",
    title: "Confirmation",
    subtitle: "Thank you",
    description: "Complete the journey",
    icon: CheckCircle2,
    iconWrapClass: "bg-[#ecfdf5] text-[#059669] ring-1 ring-[#a7f3d0]",
    thumbSrc: "/dashboard/funnel-steps/funnel-step-confirmation-3d.png",
  },
];
