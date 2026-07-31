"use client";

import { useEffect, useId, useState } from "react";
import {
  Check,
  MapPin,
  Megaphone,
  MousePointerClick,
  Settings2,
  ShoppingBag,
  Smartphone,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

export type GoogleAdsObjectiveId =
  | "SALES"
  | "LEADS"
  | "WEBSITE_TRAFFIC"
  | "APP_PROMOTION"
  | "AWARENESS"
  | "LOCAL"
  | "NO_GUIDANCE";

type ObjectiveOption = {
  id: GoogleAdsObjectiveId;
  title: string;
  description: string;
  icon: LucideIcon;
};

const OBJECTIVES: ObjectiveOption[] = [
  {
    id: "SALES",
    title: "Sales",
    description: "Drive sales online, in app, by phone, or in store.",
    icon: ShoppingBag,
  },
  {
    id: "LEADS",
    title: "Leads",
    description:
      "Get leads and other conversions by encouraging customers to take action.",
    icon: Users,
  },
  {
    id: "WEBSITE_TRAFFIC",
    title: "Website traffic",
    description: "Get the right people to visit your website.",
    icon: MousePointerClick,
  },
  {
    id: "APP_PROMOTION",
    title: "App promotion",
    description:
      "Get more installs, engagement and pre-registration for your app.",
    icon: Smartphone,
  },
  {
    id: "AWARENESS",
    title: "YouTube reach, views, and engagements",
    description:
      "Drive awareness and consideration of your product or brand. Previously known as 'Awareness and consideration'.",
    icon: Megaphone,
  },
  {
    id: "LOCAL",
    title: "Local store visits and promotions",
    description:
      "Drive visits to local stores, including restaurants and dealerships.",
    icon: MapPin,
  },
  {
    id: "NO_GUIDANCE",
    title: "Create a campaign without guidance",
    description: "You'll choose a campaign next.",
    icon: Settings2,
  },
];

type GoogleAdsObjectiveDialogProps = {
  open: boolean;
  onClose: () => void;
  onContinue?: (objective: GoogleAdsObjectiveId) => void;
};

export function GoogleAdsObjectiveDialog({
  open,
  onClose,
  onContinue,
}: GoogleAdsObjectiveDialogProps) {
  const titleId = useId();
  const [selected, setSelected] = useState<GoogleAdsObjectiveId>("LEADS");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#07111f]/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(90dvh,860px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e8edf5] px-6 py-5 sm:px-8">
          <div>
            <h2
              id={titleId}
              className="text-xl font-light tracking-tight text-[#07111f] sm:text-2xl"
            >
              Choose your objective
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Select an objective to tailor your experience to the goals and
              settings that will work best for your campaign.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#e8edf5] text-slate-500 transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-5 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {OBJECTIVES.map((objective) => {
              const Icon = objective.icon;
              const isSelected = selected === objective.id;
              return (
                <button
                  key={objective.id}
                  type="button"
                  onClick={() => setSelected(objective.id)}
                  className={`relative rounded-xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-[#1877f2] bg-white text-[#1877f2] ring-1 ring-[#1877f2]"
                      : "border-[#e8edf5] bg-white text-[#07111f] hover:border-[#1877f2]"
                  }`}
                >
                  {isSelected ? (
                    <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                      <Check className="size-3.5" aria-hidden strokeWidth={3} />
                    </span>
                  ) : null}
                  <span
                    className={`mb-3 inline-flex size-10 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-[#e8f2ff] text-[#1877f2]"
                        : "bg-[#f4f8ff] text-slate-600"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p
                    className={`pr-8 text-sm font-light ${
                      isSelected ? "text-[#1877f2]" : "text-[#07111f]"
                    }`}
                  >
                    {objective.title}
                  </p>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      isSelected ? "text-[#1877f2]/90" : "text-slate-500"
                    }`}
                  >
                    {objective.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e8edf5] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8edf5] px-4 py-2.5 text-sm font-light text-slate-600 transition hover:bg-[#f4f8ff]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onContinue?.(selected)}
            className="rounded-xl bg-[#1877f2] px-5 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
