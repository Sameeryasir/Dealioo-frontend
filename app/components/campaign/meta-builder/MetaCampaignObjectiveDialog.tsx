"use client";

import { useEffect, useId, useState } from "react";
import {
  Check,
  Filter,
  Footprints,
  Heart,
  Info,
  MessageCircle,
  Megaphone,
  MousePointer2,
  Phone,
  Play,
  ShoppingBag,
  ShoppingCart,
  Tag,
  ThumbsUp,
  User,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import type { MetaCampaignObjective } from "@/app/lib/meta-campaign-builder-types";

export type MetaBuyingType = "AUCTION";

type ObjectiveOption = {
  id: MetaCampaignObjective;
  label: string;
  description: string;
  aboutLabel?: string;
  aboutHref?: string;
  icon: LucideIcon;
  goodFor: string[];
  supported: boolean;
};

const OBJECTIVES: ObjectiveOption[] = [
  {
    id: "OUTCOME_AWARENESS",
    label: "Awareness",
    description:
      "Show your ads to people who are most likely to remember them.",
    icon: Megaphone,
    goodFor: ["Reach", "Brand awareness", "Video views"],
    supported: true,
  },
  {
    id: "OUTCOME_TRAFFIC",
    label: "Traffic",
    description:
      "Send people to a destination, such as your website, app, Instagram profile or Facebook event.",
    aboutLabel: "About traffic",
    aboutHref:
      "https://www.facebook.com/business/help/1671992669756740",
    icon: MousePointer2,
    goodFor: [
      "Link clicks",
      "Landing page views",
      "Instagram profile visits",
      "Messenger, Instagram and WhatsApp",
      "Calls",
    ],
    supported: true,
  },
  {
    id: "OUTCOME_ENGAGEMENT",
    label: "Engagement",
    description:
      "Get more messages, purchases through messaging, video views, interactions, Page likes or event responses.",
    icon: MessageCircle,
    goodFor: [
      "Messenger, Instagram and WhatsApp",
      "Video views",
      "Interactions",
      "Conversions",
      "Calls",
    ],
    supported: true,
  },
  {
    id: "OUTCOME_LEADS",
    label: "Leads",
    description: "Collect leads for your business or brand.",
    icon: Filter,
    goodFor: [
      "Website and instant forms",
      "Instant forms",
      "Messenger, Instagram and WhatsApp",
      "Conversions",
      "Calls",
    ],
    supported: true,
  },
  {
    id: "OUTCOME_SALES",
    label: "Sales",
    description: "Find people who are likely to purchase your product or service.",
    icon: ShoppingBag,
    goodFor: [
      "Conversions",
      "Catalogue sales",
      "Messenger, Instagram and WhatsApp",
      "Calls",
    ],
    supported: true,
  },
];

type MetaCampaignObjectiveDialogProps = {
  open: boolean;
  initialObjective?: MetaCampaignObjective | null;
  campaignLabel?: string | null;
  onClose: () => void;
  onContinue: (objective: MetaCampaignObjective) => void;
};

function ObjectiveDetailArt({
  option,
}: {
  option: ObjectiveOption;
}) {
  const Icon = option.icon;

  if (option.id === "OUTCOME_AWARENESS") {
    return (
      <div
        className="relative mx-auto mb-6 flex h-40 w-full max-w-[260px] items-center justify-center"
        aria-hidden
      >
        <span className="absolute left-6 top-6 size-9 rounded-full bg-[#9bb8e8]" />
        <span className="absolute left-2 top-16 size-11 rounded-full bg-[#07111f]" />
        <span className="absolute bottom-8 left-10 size-8 rounded-full bg-[#c5d8f5]" />
        <span className="absolute right-4 top-8 size-10 rounded-full bg-[#2a3a52]" />
        <span className="absolute bottom-10 right-8 size-9 rounded-full bg-[#7aa2e0]" />
        <span className="absolute right-14 top-4 size-7 rounded-full bg-[#4a6fa5]" />
        <span className="relative z-[1] flex size-20 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-md">
          <Megaphone className="size-10" strokeWidth={1.75} />
        </span>
      </div>
    );
  }

  if (option.id === "OUTCOME_SALES") {
    return (
      <div
        className="relative mx-auto mb-6 flex h-44 w-full max-w-[280px] items-center justify-center"
        aria-hidden
      >
        <span className="absolute left-8 top-6 flex size-14 items-center justify-center rounded-2xl bg-[#a8e6cf] text-[#0b6e4f] shadow-md">
          <Wrench className="size-7" strokeWidth={1.75} />
        </span>
        <span className="absolute right-8 top-8 flex size-16 items-center justify-center rounded-2xl bg-[#d4f1e8] text-[#1b4332] shadow-sm ring-1 ring-[#b7e4c7]">
          <Footprints className="size-8" strokeWidth={1.75} />
        </span>
        <span className="absolute bottom-10 left-14 flex size-12 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-md">
          <Tag className="size-6" strokeWidth={1.75} />
        </span>
        <span className="absolute bottom-8 right-12 z-[1] flex size-11 items-center justify-center rounded-xl bg-[#2d6a4f] text-white shadow-md ring-4 ring-white">
          <ShoppingCart className="size-5" strokeWidth={2} />
        </span>
      </div>
    );
  }

  if (option.id === "OUTCOME_LEADS") {
    return (
      <div
        className="relative mx-auto mb-6 flex h-44 w-full max-w-[280px] items-center justify-center"
        aria-hidden
      >
        <div className="absolute left-10 top-8 h-28 w-[150px] rotate-[-8deg] rounded-xl bg-[#f5a623] shadow-md" />
        <div className="absolute left-14 top-10 h-28 w-[150px] rotate-[-3deg] rounded-xl bg-[#f7b84b] shadow-md" />
        <div className="relative z-[1] h-28 w-[160px] rotate-[2deg] rounded-xl bg-[#ffcc66] p-4 shadow-lg">
          <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-white/80 text-[#8a5a00]">
            <User className="size-4" strokeWidth={2} />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-20 rounded bg-[#8a5a00]/25" />
            <div className="h-2 w-28 rounded bg-[#8a5a00]/20" />
            <div className="h-2 w-16 rounded bg-[#8a5a00]/15" />
          </div>
        </div>
        <span className="absolute bottom-8 right-12 z-[2] flex size-10 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-md ring-4 ring-white">
          <Check className="size-5" strokeWidth={3} />
        </span>
      </div>
    );
  }

  if (option.id === "OUTCOME_ENGAGEMENT") {
    return (
      <div
        className="relative mx-auto mb-6 flex h-44 w-full max-w-[280px] items-center justify-center"
        aria-hidden
      >
        <span className="absolute left-8 top-6 flex size-12 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-md">
          <Play className="size-6 fill-white" strokeWidth={0} />
        </span>
        <span className="absolute right-6 top-10 flex size-14 items-center justify-center rounded-2xl bg-[#e7f3ff] text-[#1877f2] shadow-sm ring-1 ring-[#cce0f5]">
          <Phone className="size-7" strokeWidth={1.75} />
        </span>
        <span className="absolute bottom-8 left-10 flex size-11 items-center justify-center rounded-2xl bg-white text-[#f02849] shadow-md ring-1 ring-[#e4e6eb]">
          <Heart className="size-5 fill-[#f02849]" strokeWidth={0} />
        </span>
        <span className="absolute bottom-6 right-12 flex size-12 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-md">
          <ThumbsUp className="size-6" strokeWidth={1.75} />
        </span>
        <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d0d7de]" />
      </div>
    );
  }

  if (option.id === "OUTCOME_TRAFFIC") {
    return (
      <div
        className="relative mx-auto mb-6 flex h-44 w-full max-w-[280px] items-center justify-center"
        aria-hidden
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-[#1877f2]/45"
          viewBox="0 0 280 176"
          fill="none"
        >
          <path
            d="M70 40 C110 55, 120 70, 140 88"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M210 36 C180 55, 165 70, 150 88"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M55 130 C95 120, 120 110, 140 100"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M230 128 C190 118, 170 108, 152 100"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        <span className="absolute left-3 top-4 h-10 w-14 rounded-md border border-[#cce0f5] bg-[#e8f2ff] shadow-sm" />
        <span className="absolute right-4 top-3 h-11 w-12 rounded-md bg-[#1877f2] shadow-sm" />
        <span className="absolute bottom-5 left-5 h-9 w-11 rounded-md bg-[#07111f] shadow-sm" />
        <span className="absolute bottom-6 right-4 h-10 w-14 rounded-md border border-[#cce0f5] bg-white shadow-sm" />

        <MousePointer2 className="absolute left-16 top-14 size-4 rotate-[-18deg] text-[#07111f]" strokeWidth={2.25} />
        <MousePointer2 className="absolute right-[4.5rem] top-16 size-4 rotate-[12deg] text-[#1877f2]" strokeWidth={2.25} />

        <div className="relative z-[1] w-[150px] overflow-hidden rounded-lg border border-[#1877f2]/35 bg-[#1877f2] shadow-[0_8px_18px_rgba(24,119,242,0.28)]">
          <div className="flex items-center gap-1 bg-[#166fe5] px-2.5 py-1.5">
            <span className="size-1.5 rounded-full bg-white/40" />
            <span className="size-1.5 rounded-full bg-white/40" />
            <span className="size-1.5 rounded-full bg-white/40" />
          </div>
          <div className="space-y-2 px-3 py-3">
            <div className="h-2 w-16 rounded bg-white/45" />
            <div className="h-2 w-24 rounded bg-white/30" />
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              <span className="h-7 rounded bg-white/55" />
              <span className="h-7 rounded bg-white/55" />
              <span className="h-7 rounded bg-white/55" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto mb-6 flex h-40 w-full max-w-[260px] items-center justify-center"
      aria-hidden
    >
      <span className="absolute left-8 top-10 size-8 rounded-full bg-[#d0d7de]" />
      <span className="absolute right-10 top-12 size-10 rounded-full bg-[#9aa8b5]" />
      <span className="absolute bottom-10 left-12 size-9 rounded-full bg-[#b7c2cc]" />
      <span className="absolute bottom-12 right-8 size-7 rounded-full bg-[#7d8d9b]" />
      <span className="relative z-[1] flex size-20 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-md">
        <Icon className="size-10" strokeWidth={1.75} />
      </span>
    </div>
  );
}

export function MetaCampaignObjectiveDialog({
  open,
  initialObjective = null,
  campaignLabel = null,
  onClose,
  onContinue,
}: MetaCampaignObjectiveDialogProps) {
  const titleId = useId();
  const [selected, setSelected] = useState<MetaCampaignObjective>(
    initialObjective ?? "OUTCOME_AWARENESS",
  );

  useEffect(() => {
    if (!open) return;
    setSelected(initialObjective ?? "OUTCOME_AWARENESS");
  }, [open, initialObjective]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
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

  const selectedOption =
    OBJECTIVES.find((item) => item.id === selected) ?? null;
  const activeOption = selectedOption;
  const canContinue =
    selectedOption != null && selectedOption.supported;

  const handleContinue = () => {
    if (!canContinue || selectedOption == null || !selectedOption.supported) {
      return;
    }
    onContinue(selectedOption.id);
  };

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
        className="relative z-[1] flex max-h-[min(92dvh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e8edf5] px-6 py-5 sm:px-8">
          <div>
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-[#07111f] sm:text-2xl"
            >
              Create new campaign
            </h2>
            {campaignLabel ? (
              <p className="mt-1 text-sm text-slate-500">
                Starting from{" "}
                <span className="font-medium text-[#07111f]">{campaignLabel}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Choose how you want to buy ads and what you want to achieve.
              </p>
            )}
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.9fr)] sm:px-8">
            <div className="space-y-8">
              <section>
                <div className="mb-2 flex items-center gap-1.5">
                  <label className="text-sm font-semibold text-[#07111f]">
                    Choose a buying type
                  </label>
                  <span
                    className="inline-flex text-slate-400"
                    title="Auction lets Meta find the best people for your budget in real time."
                  >
                    <Info className="size-3.5" aria-hidden />
                  </span>
                </div>
                <div className="rounded-2xl border border-[#ccd0d5] bg-[#f4f8ff] px-4 py-2.5 text-sm font-medium text-slate-500">
                  Auction
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#07111f]">
                  Choose a campaign objective
                </h3>
                <div
                  role="radiogroup"
                  aria-label="Campaign objective"
                  className="divide-y divide-[#e4e6eb] overflow-hidden rounded-lg border border-[#e4e6eb]"
                >
                  {OBJECTIVES.map((objective) => {
                    const Icon = objective.icon;
                    const isSelected = selected === objective.id;
                    const usesBrandIconColor =
                      objective.id === "OUTCOME_AWARENESS" ||
                      objective.id === "OUTCOME_TRAFFIC";
                    return (
                      <button
                        key={objective.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-disabled={!objective.supported}
                        onClick={() => setSelected(objective.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                          isSelected
                            ? "bg-[#e7f3ff]"
                            : "bg-white hover:bg-[#f7f8fa]"
                        }`}
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? "border-[#1877f2]"
                              : "border-[#8a8d91]"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? (
                            <span className="size-2 rounded-full bg-[#1877f2]" />
                          ) : null}
                        </span>
                        <span
                          className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md ${
                            isSelected
                              ? "bg-[#1877f2] text-white"
                              : usesBrandIconColor
                                ? "bg-[#e8f2ff] text-[#1877f2]"
                                : "bg-[#f0f2f5] text-[#07111f]"
                          }`}
                        >
                          <Icon className="size-4" aria-hidden strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-[#1c1e21]">
                            {objective.label}
                          </span>
                          {!objective.supported ? (
                            <span className="mt-0.5 block text-xs text-slate-400">
                              Coming soon
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="rounded-xl bg-white px-2 py-2 lg:sticky lg:top-0 lg:self-start">
              {activeOption ? (
                <div className="px-2 py-2 text-left">
                  <ObjectiveDetailArt option={activeOption} />
                  <h4 className="text-base font-bold text-[#1c1e21]">
                    {activeOption.label}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#1c1e21]/90">
                    {activeOption.description}{" "}
                    {activeOption.aboutLabel && activeOption.aboutHref ? (
                      <a
                        href={activeOption.aboutHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#1877f2] hover:underline"
                      >
                        {activeOption.aboutLabel}
                      </a>
                    ) : null}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-[#1c1e21]">
                    Good for:
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {activeOption.goodFor.map((tag) => (
                      <li key={tag}>
                        <span className="inline-flex rounded-md bg-[#e4e6eb] px-3 py-1.5 text-xs font-medium text-[#1c1e21]">
                          {tag}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <div
                    className="relative mb-5 flex h-36 w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#dbeafe] via-[#e8f2ff] to-[#f0f7ff]"
                    aria-hidden
                  >
                    <Info className="size-10 text-[#1877f2]" strokeWidth={1.5} />
                  </div>
                  <p className="max-w-xs text-sm leading-relaxed text-[#1c1e21]">
                    Your campaign objective is the business goal you hope to
                    achieve by running your ads. Tap each one for more
                    information.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e8edf5] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-medium text-[#1c1e21] transition hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={handleContinue}
            className="rounded-lg bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#166fe0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
