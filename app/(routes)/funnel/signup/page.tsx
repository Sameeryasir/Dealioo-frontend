"use client";

import { LazyCrmTemplateEditor } from "@/app/components/crm-template-editor/LazyCrmTemplateEditor";

export default function Page() {
  return (
    <div className="h-dvh min-h-0 w-full">
      <LazyCrmTemplateEditor initialPageId="signup" interactivePreview />
    </div>
  );
}
