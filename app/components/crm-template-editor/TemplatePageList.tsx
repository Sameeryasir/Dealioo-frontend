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
  pages,
  activeId,
  onSelect,
  onEditPage,
}: {
  pages: { id: TemplatePageId; label: string }[];
  activeId: TemplatePageId;
  onSelect: (id: TemplatePageId) => void;
  onEditPage: (id: TemplatePageId) => void;
}) {
  const labelById = Object.fromEntries(pages.map((p) => [p.id, p.label])) as Partial<
    Record<TemplatePageId, string>
  >;

  return (
    <nav className="px-2.5 py-3 [&_button]:cursor-pointer">
      <p className="px-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        Funnel steps
      </p>
      <p className="mt-0.5 px-1 pb-3 text-[0.65rem] text-zinc-500">
        Select a step to preview
      </p>

      <ul className="space-y-3">
        {FUNNEL_STEP_META.map((step) => {
          const pageLabel = labelById[step.id]?.trim();
          return (
            <li key={step.id}>
              <EditorPageItem
                title={step.title}
                description={step.description}
                icon={step.icon}
                selected={activeId === step.id}
                onSelect={() => onSelect(step.id)}
                onEdit={() => onEditPage(step.id)}
              />
              {pageLabel ? (
                <p className="mt-1 truncate px-1 text-[0.65rem] text-zinc-400">
                  {pageLabel}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
