"use client";

import dynamic from "next/dynamic";
import type { CrmTemplateEditorProps } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import { warmupFunnelEditorChunk } from "@/app/lib/funnel-editor-warmup";

export const LazyCrmTemplateEditor = dynamic<CrmTemplateEditorProps>(
  () =>
    warmupFunnelEditorChunk().then((mod) => {
      const { CrmTemplateEditor } = mod as typeof import(
        "@/app/components/crm-template-editor/CrmTemplateEditor"
      );
      return CrmTemplateEditor;
    }),
  {
    ssr: false,
    loading: () => null,
  },
);

export type { CrmTemplateEditorProps };
