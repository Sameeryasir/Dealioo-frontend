"use client";

import { EditorPageItem } from "@/app/components/crm-template-editor/editor-ui/EditorPageItem";
import { FUNNEL_STEP_META } from "@/app/components/crm-template-editor/editor-ui/funnel-step-meta";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

export const FUNNEL_PAGE_ORDER: TemplatePageId[] = [
  "landing",
  "signup",
  "payment",
  "confirmation",
];

export const FUNNEL_PAGE_ORDER_WITHOUT_PAYMENT: TemplatePageId[] = [
  "landing",
  "signup",
  "confirmation",
];

export function funnelPageOrderForCampaignType(
  campaignType?: "prepaid" | "postpaid" | null,
): TemplatePageId[] {
  return campaignType === "postpaid"
    ? FUNNEL_PAGE_ORDER_WITHOUT_PAYMENT
    : FUNNEL_PAGE_ORDER;
}

export function TemplatePageList({
  activeId,
  onSelect,
  onPreviewPage,
  compact = false,
  pageOrder = FUNNEL_PAGE_ORDER,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onPreviewPage?: (id: TemplatePageId) => void;
  compact?: boolean;
  pageOrder?: TemplatePageId[];
}) {
  const steps = FUNNEL_STEP_META.filter((step) => pageOrder.includes(step.id));

  return (
    <nav className="w-full [&_button]:cursor-pointer">
      <ul className="m-0 list-none p-0">
        {steps.map((step, index) => (
          <li key={step.id} className={compact ? "min-w-0 shrink-0" : ""}>
            <EditorPageItem
              title={step.title}
              subtitle={step.subtitle}
              description={step.description}
              icon={step.icon}
              iconWrapClass={step.iconWrapClass}
              selected={activeId === step.id}
              onSelect={() => onSelect(step.id)}
              onPreview={
                onPreviewPage ? () => onPreviewPage(step.id) : undefined
              }
              compact={compact}
              isLast={index === steps.length - 1}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
