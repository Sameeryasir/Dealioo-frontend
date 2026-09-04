"use client";

/**
 * What changed: Polish the edit-automation dialog to match Edit Campaign modal styling.
 * Why: Keep edit dialogs visually consistent across the product.
 * Related: EditCampaignModal, AutomationListPage, AutomationBuilderPage.
 */

import {
  Check,
  FileText,
  Loader2,
  Pencil,
  Workflow,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

const inputClassName =
  "w-full rounded-xl border border-[#dbeafe] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/55 focus:ring-2 focus:ring-[#1877f2]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldLabel({
  icon: Icon,
  htmlFor,
  children,
}: {
  icon: LucideIcon;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700"
    >
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#dbeafe] bg-white text-[#1877f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      {children}
    </label>
  );
}

export function EditAutomationDetailsDialog({
  open,
  initialName,
  initialDescription,
  isSaving,
  onClose,
  onSave,
}: {
  open: boolean;
  initialName: string;
  initialDescription: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    description: string;
  }) => void | Promise<void>;
}) {
  const titleId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Reset fields when the dialog opens ---
  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription);
  }, [open, initialName, initialDescription]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isSaving, onClose]);

  if (!mounted || !open) return null;

  const canSubmit = name.trim().length > 0 && !isSaving;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    void onSave({
      name: name.trim(),
      description: description.trim(),
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/55 p-3 backdrop-blur-[6px]"
      role="presentation"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden rounded-[1.25rem] border border-[#e2eaf5] bg-white shadow-[0_24px_56px_rgba(7,17,31,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header (matches Edit Campaign) --- */}
        <div className="relative overflow-hidden border-b border-[#eef2f8] bg-white px-5 py-4">
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_10px_22px_rgba(24,119,242,0.28)]">
                <Pencil className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-base font-extrabold tracking-tight text-[#07111f]"
                >
                  Edit automation
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update name and description
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              disabled={isSaving}
              onClick={onClose}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#eef5ff] hover:text-[#1877f2] disabled:opacity-50"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 bg-white px-5 py-4">
            <div>
              <FieldLabel htmlFor={nameId} icon={Workflow}>
                Automation name
              </FieldLabel>
              <input
                id={nameId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome New Signups"
                maxLength={255}
                disabled={isSaving}
                className={inputClassName}
                autoFocus
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor={descriptionId} icon={FileText}>
                Description
              </FieldLabel>
              <textarea
                id={descriptionId}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClassName} min-h-[5.5rem] resize-y leading-relaxed`}
                placeholder="What should this automation do?"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* --- Footer actions --- */}
          <div className="flex justify-end gap-2 border-t border-[#eef2f8] bg-white px-5 py-3.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] hover:text-[#1877f2] disabled:opacity-50"
            >
              <X className="size-4" aria-hidden />
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )}
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
