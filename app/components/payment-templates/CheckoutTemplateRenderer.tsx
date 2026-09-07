"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckoutTemplateType } from "@/app/components/crm-template-editor/checkout-template-types";
import { AppleCheckout } from "@/app/components/payment-templates/AppleCheckout";
import { BoldCheckout } from "@/app/components/payment-templates/BoldCheckout";
import { CardCheckout } from "@/app/components/payment-templates/CardCheckout";
import { CompactCheckout } from "@/app/components/payment-templates/CompactCheckout";
import { CrmCheckout } from "@/app/components/payment-templates/CrmCheckout";
import { DarkCheckout } from "@/app/components/payment-templates/DarkCheckout";
import { FloatingCheckout } from "@/app/components/payment-templates/FloatingCheckout";
import { GradientCheckout } from "@/app/components/payment-templates/GradientCheckout";
import { MinimalCheckout } from "@/app/components/payment-templates/MinimalCheckout";
import { PremiumCheckout } from "@/app/components/payment-templates/PremiumCheckout";
import { ShopifyCheckout } from "@/app/components/payment-templates/ShopifyCheckout";
import { SplitCheckout } from "@/app/components/payment-templates/SplitCheckout";
import { StripeStyleCheckout } from "@/app/components/payment-templates/StripeStyleCheckout";
import type { CheckoutTemplateProps } from "@/app/components/payment-templates/types";

function renderTemplate(props: CheckoutTemplateProps) {
  switch (props.page.checkoutTemplate) {
    case CheckoutTemplateType.SHOPIFY:
      return <ShopifyCheckout {...props} />;
    case CheckoutTemplateType.PREMIUM:
      return <PremiumCheckout {...props} />;
    case CheckoutTemplateType.MINIMAL:
      return <MinimalCheckout {...props} />;
    case CheckoutTemplateType.APPLE:
      return <AppleCheckout {...props} />;
    case CheckoutTemplateType.FLOATING:
      return <FloatingCheckout {...props} />;
    case CheckoutTemplateType.SPLIT:
      return <SplitCheckout {...props} />;
    case CheckoutTemplateType.DARK:
      return <DarkCheckout {...props} />;
    case CheckoutTemplateType.CRM:
      return <CrmCheckout {...props} />;
    case CheckoutTemplateType.COMPACT:
      return <CompactCheckout {...props} />;
    case CheckoutTemplateType.GRADIENT:
      return <GradientCheckout {...props} />;
    case CheckoutTemplateType.CARD:
      return <CardCheckout {...props} />;
    case CheckoutTemplateType.BOLD:
      return <BoldCheckout {...props} />;
    case CheckoutTemplateType.STRIPE:
    default:
      return <StripeStyleCheckout {...props} />;
  }
}

export function CheckoutTemplateRenderer(props: CheckoutTemplateProps) {
  const key = `${props.page.checkoutTemplate}|${props.page.formDesign}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {renderTemplate(props)}
      </motion.div>
    </AnimatePresence>
  );
}
