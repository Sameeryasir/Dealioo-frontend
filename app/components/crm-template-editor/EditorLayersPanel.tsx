"use client";

import {
  LANDING_SECTION_LABELS,
  landingSectionOrder,
  type LandingContentSectionId,
} from "@/app/components/crm-template-editor/landing-sections";
import { SortableSectionList } from "@/app/components/crm-template-editor/SortableSectionList";
import type {
  LandingTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";
import { Layers } from "lucide-react";

export function EditorLayersPanel({
  page,
  selectedSectionId,
  onSelectSection,
  onReorderSections,
}: {
  page: TemplatePage;
  selectedSectionId: LandingContentSectionId | null;
  onSelectSection: (sectionId: LandingContentSectionId) => void;
  onReorderSections?: (next: LandingContentSectionId[]) => void;
}) {
  if (page.id !== "landing") {
    return (
      <div className="flex flex-col gap-2 p-1">
        <p className="m-0 text-[0.75rem] font-medium leading-relaxed text-slate-500">
          Layers for this step map to page fields in the inspector. Landing
          pages expose reorderable content sections here.
        </p>
        <p className="m-0 rounded-lg border border-[#e8edf5] bg-[#f8fafc] px-3 py-2 text-[0.72rem] font-semibold text-slate-600">
          Active page: {page.label}
        </p>
      </div>
    );
  }

  const landing = page as LandingTemplatePage;
  const items = landingSectionOrder(landing);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1877f2]">
          <Layers className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <p className="m-0 text-[0.72rem] font-extrabold text-[#0e182b]">
            Page layers
          </p>
          <p className="m-0 text-[0.65rem] font-medium text-slate-500">
            Stable section IDs — click to select
          </p>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-1 p-0" role="listbox">
        {items.map((sectionId) => {
          const selected = selectedSectionId === sectionId;
          return (
            <li key={sectionId}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelectSection(sectionId)}
                className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                  selected
                    ? "border-[#1877f2]/40 bg-[#e8f1ff] text-[#1877f2] shadow-sm"
                    : "border-[#e8edf5] bg-white text-[#07111f] hover:border-[#1877f2]/25 hover:bg-[#f4f8ff]/50"
                }`}
              >
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {LANDING_SECTION_LABELS[sectionId]}
                </span>
                <span className="text-[0.58rem] font-bold uppercase tracking-wide text-slate-400">
                  {sectionId}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {onReorderSections ? (
        <div className="border-t border-[#eef2f7] pt-3">
          <p className="m-0 mb-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-400">
            Reorder
          </p>
          <SortableSectionList
            items={items}
            labels={LANDING_SECTION_LABELS}
            onReorder={onReorderSections}
          />
        </div>
      ) : null}
    </div>
  );
}
