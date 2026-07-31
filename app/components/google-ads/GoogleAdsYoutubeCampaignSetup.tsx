"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Info,
  Play,
  Search,
  Shapes,
  type LucideIcon,
} from "lucide-react";

type YoutubeGoalId = "VIDEO_VIEWS" | "REACH" | "SUBSCRIPTIONS";

type YoutubeGoal = {
  id: YoutubeGoalId;
  title: string;
  description: string;
  suggested?: boolean;
  infoTitle?: string;
  infoBody?: string;
  goodFor: { icon: LucideIcon; text: string }[];
  optimizedLabel: string;
};

const GOALS: YoutubeGoal[] = [
  {
    id: "VIDEO_VIEWS",
    title: "Video views",
    description: "Get people to watch your video ads",
    suggested: true,
    infoTitle: "Build product consideration with TrueView views",
    infoBody:
      "People who choose to watch or engage with your video ads are more likely to search for your product or brand and actively consider it as they get closer to making a purchase.",
    goodFor: [
      {
        icon: Shapes,
        text: "Finding people who are more likely to be interested in your product or brand, and consider it when deciding to make a purchase",
      },
      {
        icon: Search,
        text: "Increasing the number of online searches for your product or brand",
      },
      {
        icon: Play,
        text: "Getting more people to watch your entire video ad",
      },
    ],
    optimizedLabel: "TrueView views",
  },
  {
    id: "REACH",
    title: "Reach",
    description: "Reach the maximum number of people",
    goodFor: [
      {
        icon: Shapes,
        text: "Getting your brand in front of as many people as possible",
      },
      {
        icon: Search,
        text: "Building awareness with broad audiences on YouTube",
      },
      {
        icon: Play,
        text: "Maximizing unique reach across devices",
      },
    ],
    optimizedLabel: "Reach",
  },
  {
    id: "SUBSCRIPTIONS",
    title: "YouTube subscriptions and engagements",
    description: "Get people to subscribe and engage with your YouTube channel",
    goodFor: [
      {
        icon: Shapes,
        text: "Growing your YouTube channel audience over time",
      },
      {
        icon: Search,
        text: "Encouraging likes, comments, and channel visits",
      },
      {
        icon: Play,
        text: "Driving more subscriptions from interested viewers",
      },
    ],
    optimizedLabel: "Subscriptions and engagements",
  },
];

type GoogleAdsYoutubeCampaignSetupProps = {
  onCancel: () => void;
  onContinue: () => void;
};

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8z"
      />
      <path fill="#fff" d="M9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
    </svg>
  );
}

export function GoogleAdsYoutubeCampaignSetup({
  onCancel,
  onContinue,
}: GoogleAdsYoutubeCampaignSetupProps) {
  const [goalId, setGoalId] = useState<YoutubeGoalId>("VIDEO_VIEWS");
  const selectedGoal = useMemo(
    () => GOALS.find((g) => g.id === goalId) ?? GOALS[0],
    [goalId],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fa]">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <section className="overflow-hidden rounded-xl border border-[#dadce0] bg-white">
            <div className="border-b border-[#dadce0] px-5 py-5 sm:px-7">
              <h2 className="text-xl font-light tracking-tight text-[#202124]">
                Choose a campaign goal
              </h2>
              <p className="mt-1 text-sm text-[#5f6368]">
                Each goal determines which metrics the campaign is optimized to
                deliver.
              </p>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
              <fieldset className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                <legend className="sr-only">Campaign goal</legend>
                {GOALS.map((goal) => {
                  const checked = goalId === goal.id;
                  return (
                    <div key={goal.id}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
                          <input
                            type="radio"
                            name="youtube-goal"
                            checked={checked}
                            onChange={() => setGoalId(goal.id)}
                            className="sr-only"
                          />
                          <span
                            className={`size-5 rounded-full border-2 ${
                              checked
                                ? "border-[#1877f2]"
                                : "border-[#5f6368]"
                            }`}
                          />
                          {checked ? (
                            <span className="absolute size-2.5 rounded-full bg-[#1877f2]" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-light text-[#202124]">
                              {goal.title}
                            </span>
                            {goal.suggested ? (
                              <span className="rounded bg-[#e8f0fe] px-1.5 py-0.5 text-[11px] font-light text-[#1967d2]">
                                Suggested
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-sm text-[#5f6368]">
                            {goal.description}
                          </span>
                        </span>
                      </label>

                      {checked && goal.infoTitle && goal.infoBody ? (
                        <div className="ml-8 mt-3 rounded-lg bg-[#e8f0fe] px-4 py-3">
                          <div className="flex gap-2.5">
                            <Info
                              className="mt-0.5 size-4 shrink-0 text-[#1967d2]"
                              aria-hidden
                            />
                            <div>
                              <p className="text-sm font-light text-[#202124]">
                                {goal.infoTitle}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-[#3c4043]">
                                {goal.infoBody}
                              </p>
                              <button
                                type="button"
                                className="mt-2 text-sm font-light text-[#1877f2] hover:underline"
                              >
                                Learn more
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </fieldset>

              <aside className="border-t border-[#dadce0] bg-white px-5 py-5 sm:px-7 lg:border-l lg:border-t-0">
                <p className="text-sm font-light text-[#202124]">Good for</p>
                <ul className="mt-4 space-y-4">
                  {selectedGoal.goodFor.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.text}
                        className="flex items-start gap-3 text-sm leading-relaxed text-[#3c4043]"
                      >
                        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[#5f6368]">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span>{item.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-8 text-sm font-light text-[#202124]">
                  Optimized to get more
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#3c4043]">
                  <li>
                    <span className="font-light underline decoration-dashed decoration-[#dadce0] underline-offset-4">
                      {selectedGoal.optimizedLabel}
                    </span>
                  </li>
                </ul>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-light text-[#1877f2] hover:underline"
                  >
                    Compare goals
                  </button>
                </div>
              </aside>
            </div>
          </section>

          <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
            <h2 className="text-lg font-light tracking-tight text-[#202124]">
              Select a campaign type
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div
                className="relative rounded-xl border border-[#1877f2] bg-white p-4 ring-1 ring-[#1877f2]"
                role="radio"
                aria-checked="true"
              >
                <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-[#1877f2] text-white">
                  <Check className="size-3.5" aria-hidden strokeWidth={3} />
                </span>
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="inline-flex size-6 items-center justify-center overflow-hidden rounded-sm">
                    <YoutubeIcon className="size-6" />
                  </span>
                  <span className="inline-flex size-6 items-center justify-center rounded-sm bg-[#34A853]/15 text-[#188038]">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5 fill-current"
                      aria-hidden
                    >
                      <rect x="3" y="4" width="18" height="4" rx="1" />
                      <rect x="3" y="10" width="8" height="10" rx="1" />
                      <rect x="13" y="10" width="8" height="10" rx="1" />
                    </svg>
                  </span>
                </div>
                <p className="text-sm font-light text-[#202124]">Video</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6368]">
                  Reach viewers on YouTube and get conversions
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e8edf5] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer px-2 py-2 text-sm font-light text-[#1877f2] transition hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer rounded-md bg-[#1877f2] px-5 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
