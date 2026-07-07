"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { funnelFullPagePreviewFrameClass } from "@/app/components/crm-template-editor/editor-layout";
import { CheckoutProvider } from "@/app/contexts/checkout-context";

export function FunnelGuestPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-zinc-100">
      <main className="flex min-h-dvh flex-1 flex-col items-stretch overflow-y-auto sm:items-center sm:p-4">
        <div className={`${funnelFullPagePreviewFrameClass} min-h-0 flex-1`}>
          <Suspense fallback={<FunnelPreviewSkeleton />}>
            <CheckoutProvider>{children}</CheckoutProvider>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
