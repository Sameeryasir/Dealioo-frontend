"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { automationEase } from "@/app/components/automation/automation-ui";

const TRIGGERS = ["Signup", "Payment", "Funnel Complete", "Tag Added"];

export function CreateAutomationModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string;
    trigger: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0]!);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setTrigger(TRIGGERS[0]!);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-zinc-950/40 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-automation-title"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl ring-1 ring-zinc-950/5"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: automationEase }}
          >
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2
                  id="create-automation-title"
                  className="text-lg font-bold tracking-tight text-zinc-900"
                >
                  Create automation
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Name your workflow and choose a starting trigger.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form
              className="space-y-4 px-6 py-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                onCreate({
                  name: name.trim(),
                  description: description.trim(),
                  trigger,
                });
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                  Automation name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Recover Abandoned Checkout"
                  className="h-11 w-full rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What should this automation do?"
                  className="w-full resize-none rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
                  Trigger
                </label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}