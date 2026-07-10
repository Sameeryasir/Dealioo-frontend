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
  compact = false,
}: {
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onEditPage: (id: TemplatePageId) => void;
  compact?: boolean;
}) {
  return (
    <nav className="relative [&_button]:cursor-pointer">
      {compact ? null : (
        <span
          className="pointer-events-none absolute top-8 bottom-8 left-[1.7rem] w-px bg-gradient-to-b from-[#1877f2]/30 via-[#e8edf5] to-[#1877f2]/15"
          aria-hidden
        />
      )}
      <ul
        className={`relative ${
          compact
            ? "flex flex-row gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:thin] lg:grid lg:grid-cols-2 lg:gap-2.5 lg:overflow-x-visible lg:pb-0 xl:gap-3"
            : "space-y-2 px-2.5 py-2.5"
        }`}
      >
        {FUNNEL_STEP_META.map((step, index) => (
          <li
            key={step.id}
            className={`relative z-[1] ${compact ? "min-w-[6.75rem] shrink-0 lg:min-w-0 lg:w-full" : ""}`}
          >
            <EditorPageItem
              title={step.title}
              description={step.description}
              icon={step.icon}
              stepNumber={index + 1}
              selected={activeId === step.id}
              onSelect={() => onSelect(step.id)}
              onEdit={() => onEditPage(step.id)}
              compact={compact}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
