"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CrmTemplateEditor } from "@/app/components/crm-template-editor/CrmTemplateEditor";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";

function parsePositiveIntParam(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
}

function FunnelPaymentPreviewInner() {
  const searchParams = useSearchParams();
  const businessId = useMemo(
    () => parsePositiveIntParam(
      readBusinessIdFromSearchParams(searchParams)?.toString() ?? null,
    ),
    [searchParams],
  );
  const campaignId = useMemo(
    () => parsePositiveIntParam(searchParams.get("campaignId")),
    [searchParams],
  );

  return (
    <div className="h-dvh min-h-0 w-full">
      <CrmTemplateEditor
        initialPageId="payment"
        interactivePreview
        businessId={businessId}
        campaignId={campaignId}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-zinc-100 text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <FunnelPaymentPreviewInner />
    </Suspense>
  );
}
