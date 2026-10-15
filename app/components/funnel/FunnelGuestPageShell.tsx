"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import { funnelFullPagePreviewFrameClass } from "@/app/components/crm-template-editor/editor-layout";
import { CheckoutProvider } from "@/app/contexts/checkout-context";

export function FunnelGuestPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="funnel-guest-shell flex min-h-dvh w-full min-w-0 flex-col overflow-x-hidden bg-zinc-100">
      <main className="funnel-guest-shell__main flex min-h-dvh w-full min-w-0 flex-1 flex-col items-stretch overflow-x-hidden overflow-y-auto sm:items-center sm:px-4 sm:py-4 md:px-6">
        <div
          className={`${funnelFullPagePreviewFrameClass} funnel-guest-shell__frame min-h-0 w-full min-w-0 flex-1`}
        >
          <Suspense fallback={<FunnelPreviewSkeleton />}>
            <CheckoutProvider>{children}</CheckoutProvider>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
