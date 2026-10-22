"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Globe,
  GlobeLock,
  Link2,
  Loader2,
  Redo2,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
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
  onSave: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  published?: boolean;
  onPreview?: () => void;
  onTrackingLink?: () => void;
  trackingLinkDisabled?: boolean;
  isSaving?: boolean;
  saveError?: string | null;
  embedded?: boolean;
  docked?: boolean;
  showPreview?: boolean;
  onBack?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  zoomPercent?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
};

const primaryActionClass =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#1877f2] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const ghostActionClass =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const iconToolClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40";

const publishActionClass =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50";

export function TopNavigation({
  campaignName,
  pageLabel,
  saveStatus,
  isDirty,
  onSave,
  onPublish,
  onUnpublish,
  published = false,
  onPreview,
  onTrackingLink,
  trackingLinkDisabled = false,
  isSaving = false,
  saveError,
  embedded = false,
  docked = false,
  showPreview = true,
  onBack,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}: TopNavigationProps) {
  const campaignLine = campaignName ? campaignName : "Your campaign";

  const trackingLinkButton = onTrackingLink ? (
    <button
      type="button"
      onClick={onTrackingLink}
      disabled={trackingLinkDisabled || isSaving}
      title={
        trackingLinkDisabled
          ? "Save the funnel first to generate a tracking link"
          : "Get link for Facebook / Google ads"
      }
      className={ghostActionClass}
    >
      <Link2 className="size-3.5 shrink-0" aria-hidden />
      <span className="hidden truncate lg:inline">Tracking link</span>
    </button>
  ) : null;

  const publishControls =
    onPublish || onUnpublish ? (
      published ? (
        <button
          type="button"
          onClick={onUnpublish}
          disabled={isSaving || !onUnpublish}
          title="Take this funnel offline for guests"
          className={ghostActionClass}
        >
          <GlobeLock className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">Unpublish</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onPublish}
          disabled={isSaving || !onPublish}
          title="Make this funnel live for guests and ads"
          className={publishActionClass}
        >
          <Globe className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">Publish</span>
        </button>
      )
    ) : null;

  const historyControls =
    onUndo || onRedo ? (
      <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || isSaving}
          className={iconToolClass}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="size-3.5" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo || isSaving}
          className={iconToolClass}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 className="size-3.5" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    ) : null;

  const zoomControls =
    onZoomIn || onZoomOut || onZoomFit ? (
      <div className="hidden items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 md:flex">
        <button
          type="button"
          onClick={onZoomOut}
          className={iconToolClass}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-3.5" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onZoomFit}
          className="min-w-[2.75rem] rounded-md px-1 py-1 text-[0.68rem] font-semibold tabular-nums text-slate-600 transition hover:bg-slate-50"
          title="Fit to canvas"
        >
          {zoomPercent != null ? `${zoomPercent}%` : "Fit"}
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className={iconToolClass}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-3.5" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    ) : null;

  if (embedded && docked) {
    const title = campaignName?.trim() || pageLabel;
    const liveTone = published
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
      : "bg-amber-50 text-amber-800 ring-amber-200/80";

    return (
      <div className="editor-panel-top-inner flex h-full min-h-0 w-full flex-col justify-between gap-2">
        <div className="editor-panel-top-head min-w-0 shrink-0">
          <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Editor
          </p>
          <h2
            className="mt-1.5 m-0 line-clamp-2 break-words text-[0.95rem] font-semibold leading-snug tracking-tight text-slate-900"
            title={title}
          >
            {title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.625rem] font-bold leading-none ring-1 ring-inset ${liveTone}`}
            >
              {published ? "Live" : "Draft"}
            </span>
            <StatusBadge status={saveStatus} isDirty={isDirty} compact />
          </div>
        </div>
        <div className="editor-panel-top-foot flex min-w-0 flex-col gap-1.5">
          {trackingLinkButton}
          {publishControls}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title="Save changes (Ctrl+S)"
            className={`${primaryActionClass} w-full`}
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="size-3.5" aria-hidden />
            )}
            Save Draft
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

  const liveTone = published
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
    : "bg-amber-50 text-amber-800 ring-amber-200/80";

  return (
    <header className="relative z-20 flex w-full min-w-0 flex-col bg-white">
      <motion.div
        className="flex w-full min-h-[2.85rem] items-center justify-between gap-2 border-b border-[#e8edf5] px-2.5 py-1.5 sm:gap-3 sm:min-h-[3.1rem] sm:px-3 lg:px-4"
        variants={headerBarVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          className="flex min-w-0 flex-1 items-center gap-2"
          variants={headerLeftVariants}
          initial="hidden"
          animate="show"
        >
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={iconToolClass}
              title="Back to campaign overview"
              aria-label="Back to campaign overview"
            >
              <ArrowLeft className="size-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
          <div className="min-w-0">
            <motion.p
              className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]"
              variants={headerTextVariants}
            >
              {campaignLine}
            </motion.p>
            <div className="flex min-w-0 items-center gap-2">
              <motion.h1
                key={pageLabel}
                className="truncate text-[0.9rem] font-extrabold leading-tight tracking-tight text-[#07111f] sm:text-[0.95rem]"
                variants={headerTextVariants}
                initial="hidden"
                animate="show"
              >
                {pageLabel}
              </motion.h1>
              <span
                className={`hidden shrink-0 items-center rounded-full px-2 py-0.5 text-[0.625rem] font-bold leading-none ring-1 ring-inset sm:inline-flex ${liveTone}`}
                title={
                  published
                    ? "Guests can open the public funnel link"
                    : "Publish before sharing ad or tracking links"
                }
              >
                {published ? "Live" : "Draft"}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-1.5"
          variants={headerActionsVariants}
          initial="hidden"
          animate="show"
        >
          {historyControls}
          {zoomControls}

          <motion.div variants={headerActionItemVariants}>
            <StatusBadge status={saveStatus} isDirty={isDirty} compact={embedded} />
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

          {trackingLinkButton ? (
            <motion.div variants={headerActionItemVariants}>
              {trackingLinkButton}
            </motion.div>
          ) : null}

          {publishControls ? (
            <motion.div variants={headerActionItemVariants}>
              {publishControls}
            </motion.div>
          ) : null}

          <motion.button
            type="button"
            variants={headerActionItemVariants}
            onClick={onSave}
            disabled={isSaving}
            title="Save draft (Ctrl+S)"
            className={primaryActionClass}
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="size-3.5" aria-hidden />
            )}
            Save Draft
          </motion.button>
        </motion.div>
      </motion.div>

      {saveError ? (
        <motion.p
          className="truncate border-b border-red-100 bg-red-50 px-3 py-1 text-center text-[0.65rem] font-semibold text-red-600"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
        >
          {saveError}
        </motion.p>
      ) : null}
    </header>
  );
}
