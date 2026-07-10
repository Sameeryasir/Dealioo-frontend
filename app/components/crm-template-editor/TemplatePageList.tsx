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

export function TemplatePageList({
  activeId,
  onSelect,
  onEditPage,
  onPreviewPage,
  compact = false,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onEditPage: (id: TemplatePageId) => void;
  onPreviewPage?: (id: TemplatePageId) => void;
  compact?: boolean;
}) {
  return (
    <nav className="w-full [&_button]:cursor-pointer">
      <ul
        className={`m-0 list-none p-0 ${
          compact
            ? "flex flex-col gap-2.5 px-0.5 py-1"
            : "space-y-2 px-2.5 py-2.5"
        }`}
      >
        {FUNNEL_STEP_META.map((step) => (
          <li key={step.id} className={compact ? "min-w-0 shrink-0" : ""}>
            <EditorPageItem
              title={step.title}
              description={step.description}
              icon={step.icon}
              thumbSrc={compact ? step.thumbSrc : undefined}
              selected={activeId === step.id}
              onSelect={() => onSelect(step.id)}
              onEdit={() => onEditPage(step.id)}
              onPreview={
                onPreviewPage ? () => onPreviewPage(step.id) : undefined
              }
              compact={compact}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
