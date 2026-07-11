"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { editorMotion } from "@/app/components/crm-template-editor/editor-animation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import {
  editorPreviewStageClass,
  editorPreviewStageEmbeddedClass,
  previewPhoneFrameClass,
  previewPhoneFrameEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-layout";

export function CanvasWorkspace({
  isLoading,
  loadError,
  children,
  embedded = false,
}: {
  isLoading?: boolean;
  loadError?: string | null;
  children: ReactNode;
  embedded?: boolean;
}) {
  const stageClass = embedded
    ? editorPreviewStageEmbeddedClass
    : editorPreviewStageClass;
  const frameClass = embedded
    ? previewPhoneFrameEmbeddedClass
    : previewPhoneFrameClass;

  if (embedded) {
    return (
      <main className="relative flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden bg-transparent">
        <div className={stageClass}>
          {loadError ? (
            <motion.p
              {...editorMotion.slideUp}
              className="absolute left-0 right-0 top-0 z-10 mx-auto w-full max-w-[min(390px,100%)] shrink-0 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950"
              role="status"
            >
              {loadError}
            </motion.p>
          ) : null}

          {isLoading ? (
            <div className={`${frameClass} h-full w-full`}>
              <FunnelPreviewSkeleton />
            </div>
          ) : (
            <motion.div
              className={`${frameClass} h-full w-full`}
              {...editorMotion.scaleIn}
            >
              {children}
            </motion.div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#eef2f7]">
      <div className={stageClass}>
        {loadError ? (
          <motion.p
            {...editorMotion.slideUp}
            className="absolute left-2 right-2 top-2 z-10 mx-auto w-full max-w-[min(390px,100%)] shrink-0 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950"
            role="status"
          >
            {loadError}
          </motion.p>
        ) : null}

        {isLoading ? (
          <div className={frameClass}>
            <FunnelPreviewSkeleton />
          </div>
        ) : (
          <motion.div className={frameClass} {...editorMotion.scaleIn}>
            {children}
          </motion.div>
        )}
      </div>
    </main>
  );
}
