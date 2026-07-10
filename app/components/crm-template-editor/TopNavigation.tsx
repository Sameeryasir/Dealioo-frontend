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
  embedded?: boolean;
  docked?: boolean;
  showPreview?: boolean;
};

const primaryActionClass =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#1877f2] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const compactPrimaryActionClass =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-[#1877f2] px-2.5 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const ghostActionClass =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#e8edf5] bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] hover:text-[#1877f2]";

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
  embedded = false,
  docked = false,
  showPreview = true,
}: TopNavigationProps) {
  const campaignLine = campaignName ? campaignName : "Your campaign";
  const compact = embedded || docked;
  const ctaClass = compact ? compactPrimaryActionClass : primaryActionClass;

  if (embedded && docked) {
    return (
      <div className="editor-panel-top-inner flex h-full min-h-0 w-full flex-col justify-between">
        <div className="editor-panel-top-head shrink-0">
          <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
            Editor
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p
              className="m-0 min-w-0 truncate text-[0.9rem] font-extrabold tracking-tight text-[#07111f]"
              title={pageLabel}
            >
              {pageLabel}
            </p>
            <StatusBadge status={saveStatus} isDirty={isDirty} />
          </div>
        </div>

        <div className="editor-panel-top-foot flex flex-nowrap items-center gap-1.5 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-[#e8edf5] bg-[#f8fafc] p-0.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex size-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#1877f2] disabled:opacity-35"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex size-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#1877f2] disabled:opacity-35"
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title="Save changes (Ctrl+S)"
            className={compactPrimaryActionClass}
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="size-3.5" aria-hidden />
            )}
            Save
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title="Publish (saves to server)"
            className={compactPrimaryActionClass}
          >
            <Upload className="size-3.5" />
            Publish
          </button>
        </div>

        {saveError ? (
          <p
            className="editor-panel-top-error absolute bottom-1 left-3 right-3 m-0 truncate text-[0.65rem] font-semibold text-red-600"
            role="status"
          >
            {saveError}
          </p>
        ) : null}
      </div>
    );
  }

  const actionButtons = (
    <>
      <motion.div variants={headerActionItemVariants}>
        <StatusBadge status={saveStatus} isDirty={isDirty} />
      </motion.div>

      <motion.div
        variants={headerActionItemVariants}
        className="hidden items-center gap-0.5 rounded-full border border-[#e8edf5] bg-[#f8fafc] p-0.5 sm:flex"
      >
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex size-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#1877f2] disabled:opacity-35"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex size-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-[#1877f2] disabled:opacity-35"
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 className="size-3.5" />
        </button>
      </motion.div>

      {showPreview && onPreview ? (
        <motion.button
          type="button"
          variants={headerActionItemVariants}
          onClick={onPreview}
          className={`hidden sm:inline-flex ${ghostActionClass}`}
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
        className={ctaClass}
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
        className={`hidden md:inline-flex ${ctaClass}`}
      >
        <Upload className="size-3.5" />
        Publish
      </motion.button>
    </>
  );

  if (embedded) {
    return (
      <div className="relative z-20 flex w-full min-w-0 flex-col bg-white">
        <div className="flex min-h-[2.35rem] w-full items-center justify-between gap-2 py-1 sm:min-h-[2.5rem] sm:gap-3">
          <p
            key={pageLabel}
            className="m-0 min-w-0 truncate text-[0.85rem] font-extrabold tracking-tight text-[#07111f] sm:text-[0.9rem]"
            title={pageLabel}
          >
            {pageLabel}
          </p>
          <motion.div
            className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2"
            variants={headerActionsVariants}
            initial="hidden"
            animate="show"
          >
            {actionButtons}
          </motion.div>
        </div>
        {saveError ? (
          <p
            className="truncate pb-1 text-center text-[0.65rem] font-semibold text-red-600"
            role="status"
          >
            {saveError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <header className="relative z-20 flex w-full min-w-0 flex-col">
      <motion.div
        className="flex w-full min-h-[2.75rem] items-center justify-between gap-2 border-b border-[#e8edf5] bg-white px-2.5 py-1.5 sm:gap-3 sm:min-h-[3rem] sm:px-3 lg:px-4"
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
            className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]"
            variants={headerTextVariants}
          >
            {campaignLine}
          </motion.p>
          <motion.h1
            key={pageLabel}
            className="truncate text-[0.9rem] font-extrabold leading-tight tracking-tight text-[#07111f] sm:text-[0.95rem]"
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
          {actionButtons}
        </motion.div>
      </motion.div>

      {saveError ? (
        <motion.p
          className="mt-1 truncate px-2 text-center text-[0.65rem] font-semibold text-red-600"
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
