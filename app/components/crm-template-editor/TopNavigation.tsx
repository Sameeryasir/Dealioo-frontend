"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Loader2,
  Redo2,
  Save,
  Undo2,
  Upload,
} from "lucide-react";
import {
  headerActionItemVariants,
  headerActionsVariants,
  headerBarVariants,
  headerLeftVariants,
  headerTextVariants,
} from "@/app/components/crm-template-editor/editor-animation";
import { StatusBadge } from "@/app/components/crm-template-editor/StatusBadge";
import type { EditorSaveStatus } from "@/app/components/crm-template-editor/editor-status";

export type TopNavigationProps = {
  campaignName?: string;
  pageLabel: string;
  saveStatus: EditorSaveStatus;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPreview?: () => void;
  isSaving?: boolean;
  saveError?: string | null;
};

export function TopNavigation({
  campaignName,
  pageLabel,
  saveStatus,
  isDirty,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPreview,
  isSaving = false,
  saveError,
}: TopNavigationProps) {
  const campaignLine = campaignName
    ? `Campaign, ${campaignName}`
    : "Funnel builder";

  return (
    <header className="relative z-20 flex w-full min-w-0 flex-col">
      <motion.div
        className="flex w-full min-h-[3.25rem] items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 py-2.5 sm:gap-4 sm:px-4 lg:min-h-[3.5rem] lg:px-5"
        variants={headerBarVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          className="min-w-0 flex-1"
          variants={headerLeftVariants}
          initial="hidden"
          animate="show"
        >
          <motion.p
            className="truncate text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#6B7280]"
            variants={headerTextVariants}
          >
            {campaignLine}
          </motion.p>
          <motion.h1
            key={pageLabel}
            className="truncate text-[0.9375rem] font-semibold leading-tight tracking-tight text-[#111827] sm:text-base"
            variants={headerTextVariants}
            initial="hidden"
            animate="show"
          >
            {pageLabel}
          </motion.h1>
        </motion.div>

        <motion.div
          className="flex shrink-0 items-center gap-1.5 sm:gap-2"
          variants={headerActionsVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={headerActionItemVariants}>
            <StatusBadge status={saveStatus} isDirty={isDirty} />
          </motion.div>

          <motion.div
            variants={headerActionItemVariants}
            className="hidden items-center gap-0.5 rounded-full border border-slate-200/90 bg-slate-50/90 p-0.5 sm:flex"
          >
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-35"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-35"
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 className="size-3.5" />
            </button>
          </motion.div>

          {onPreview ? (
            <motion.button
              type="button"
              variants={headerActionItemVariants}
              onClick={onPreview}
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
            >
              <Eye className="size-3.5" />
              Preview
            </motion.button>
          ) : null}

          <motion.button
            type="button"
            variants={headerActionItemVariants}
            onClick={onSave}
            disabled={isSaving}
            title="Save changes (Ctrl+S)"
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition hover:bg-zinc-900 hover:shadow-[0_4px_14px_rgba(0,0,0,0.22)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="size-3.5" aria-hidden />
            )}
            Save
          </motion.button>

          <motion.button
            type="button"
            variants={headerActionItemVariants}
            onClick={onSave}
            disabled={isSaving}
            title="Publish (saves to server)"
            className="hidden items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition hover:bg-zinc-900 hover:shadow-[0_4px_14px_rgba(0,0,0,0.22)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
          >
            <Upload className="size-3.5" />
            Publish
          </motion.button>
        </motion.div>
      </motion.div>

      {saveError ? (
        <motion.p
          className="mt-1 truncate px-2 text-center text-[0.65rem] font-medium text-rose-600"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {saveError}
        </motion.p>
      ) : null}
    </header>
  );
}
