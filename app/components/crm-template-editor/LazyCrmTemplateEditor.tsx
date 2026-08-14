"use client";

import dynamic from "next/dynamic";
import type { CrmTemplateEditorProps } from "@/app/components/crm-template-editor/CrmTemplateEditor";

function CrmTemplateEditorLoading() {
  return (
    <div
      className="flex h-full min-h-[20rem] w-full flex-1 items-center justify-center bg-[#f4f8ff] text-sm text-slate-500"
      aria-busy="true"
      aria-label="Loading funnel editor"
    >
      Loading funnel editor…
    </div>
  );
}

export const LazyCrmTemplateEditor = dynamic(
  () =>
    import("@/app/components/crm-template-editor/CrmTemplateEditor").then(
      (mod) => mod.CrmTemplateEditor,
    ),
  {
    ssr: false,
    loading: () => <CrmTemplateEditorLoading />,
  },
);

export type { CrmTemplateEditorProps };
