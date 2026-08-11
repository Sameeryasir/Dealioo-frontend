"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import logoStyles from "@/app/components/register-business/RegisterBusinessForm.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import {
  PLAN_FIT_QUESTIONS,
  clearPlanFitProgress,
  createEmptyPlanFitAnswers,
  isPlanFitComplete,
  type PlanFitAnswers,
  type PlanFitPlanId,
  type PlanFitQuestionId,
} from "@/app/lib/plan-fit-questionnaire";
import { savePlanFitProgress } from "@/app/services/onboarding/save-plan-fit";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Check,
  Clock3,
  Headphones,
  Lightbulb,
  MapPin,
  Megaphone,
  PenLine,
  Rocket,
  Sparkles,
  Store,
  Target,
  Trophy,
  TrendingUp,
  WandSparkles,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";

export type PlanFitResult = {
  planId: PlanFitPlanId;
  reason: string;
  answers: PlanFitAnswers;
  confidence?: string;
  scores?: Record<string, number>;
};

type PlanFitQuestionnaireProps = {
  onComplete: (answers: PlanFitAnswers) => void | Promise<void>;
  submitting?: boolean;
  initialDraftAnswers?: Partial<PlanFitAnswers> | null;
  initialDraftQuestionIndex?: number | null;
};

const OPTION_ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  one: MapPin,
  few: Building2,
  many: Store,
  yes: WandSparkles,
  somewhat: Sparkles,
  no: PenLine,
  diy: PenLine,
  ai: Bot,
  expert: Headphones,
  simple: Target,
  automation: Megaphone,
  guidance: Headphones,
  scale: TrendingUp,
};

const STEP_ASIDE: Record<
  PlanFitQuestionId,
  {
    title: string;
    text: string;
    tip: string;
    benefits: readonly { title: string; hint: string; icon: typeof Clock3 }[];
  }
> = {
  businesses: {
    title: "We'll match the right plan",
    text: "One location usually fits Starter. Multi-location brands line up with Enterprise.",
    tip: "You can still pick a different plan on the next screen.",
    benefits: [
      { icon: Clock3, title: "Takes under a minute", hint: "Four short questions" },
      { icon: Rocket, title: "Built around your setup", hint: "Location count shapes the plan" },
    ],
  },
  paidMarketing: {
    title: "Campaign tools that fit you",
    text: "Tell us if you want AI campaign help or a simple DIY builder.",
    tip: "This maps to Starter DIY tools vs Growth AI campaign tools.",
    benefits: [
      { icon: WandSparkles, title: "AI when you want it", hint: "Campaigns and follow-ups" },
      { icon: PenLine, title: "DIY if you prefer", hint: "Keep full control" },
    ],
  },
  helpStyle: {
    title: "How you want to run ads",
    text: "Pick DIY, AI help, or a dedicated marketing expert.",
    tip: "Growth Expert includes strategy calls and campaign reviews.",
    benefits: [
      { icon: Bot, title: "AI can draft and follow up", hint: "Faster campaign setup" },
      { icon: Headphones, title: "Experts when you need them", hint: "Reviews and guidance" },
    ],
  },
  priority: {
    title: "What matters most right now",
    text: "We'll highlight the plan that matches your top priority.",
    tip: "You can still compare every plan before you pay.",
    benefits: [
      { icon: Target, title: "Clear recommendation", hint: "Based on your answers" },
      { icon: TrendingUp, title: "Room to grow later", hint: "Upgrade any time" },
    ],
  },
};

function LocationPinAsideArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 168"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="110" cy="148" rx="58" ry="8" fill="rgba(255,255,255,0.1)" />
      <ellipse
        cx="110"
        cy="142"
        rx="46"
        ry="11"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />
      <ellipse
        cx="110"
        cy="136"
        rx="34"
        ry="8"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="1.5"
      />
      <ellipse
        cx="110"
        cy="131"
        rx="22"
        ry="5.5"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.4"
      />
      <path
        d="M110 18c-24.3 0-44 19.4-44 43.4 0 32.2 44 76.6 44 76.6s44-44.4 44-76.6C154 37.4 134.3 18 110 18Z"
        fill="url(#fitPinBody)"
        filter="url(#fitPinGlow)"
      />
      <path
        d="M110 26c-19.4 0-35.2 15.5-35.2 34.7 0 25.4 35.2 62.3 35.2 62.3s35.2-36.9 35.2-62.3C145.2 41.5 129.4 26 110 26Z"
        fill="url(#fitPinSheen)"
      />
      <circle cx="110" cy="58" r="16" fill="#1877F2" />
      <circle cx="110" cy="58" r="8.5" fill="#ffffff" />
      <defs>
        <linearGradient id="fitPinBody" x1="66" y1="18" x2="154" y2="138">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="fitPinSheen" x1="90" y1="26" x2="132" y2="118">
          <stop stopColor="rgba(255,255,255,0.95)" />
          <stop offset="1" stopColor="rgba(219,234,254,0.2)" />
        </linearGradient>
        <filter id="fitPinGlow" x="40" y="0" width="140" height="160">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

function resolveResumeIndex(
  draft: Partial<PlanFitAnswers> | null | undefined,
  questionIndex: number | null | undefined,
): number {
  if (
    typeof questionIndex === "number" &&
    questionIndex >= 0 &&
    questionIndex < PLAN_FIT_QUESTIONS.length
  ) {
    return questionIndex;
  }
  if (!draft) return 0;
  for (let i = 0; i < PLAN_FIT_QUESTIONS.length; i += 1) {
    const id = PLAN_FIT_QUESTIONS[i]?.id;
    if (id && draft[id] == null) return i;
  }
  return Math.max(0, PLAN_FIT_QUESTIONS.length - 1);
}

export function PlanFitQuestionnaire({
  onComplete,
  submitting = false,
  initialDraftAnswers = null,
  initialDraftQuestionIndex = null,
}: PlanFitQuestionnaireProps) {
  const reduced = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(() =>
    resolveResumeIndex(initialDraftAnswers, initialDraftQuestionIndex),
  );
  const [answers, setAnswers] = useState<Partial<PlanFitAnswers>>(() => ({
    ...createEmptyPlanFitAnswers(),
    ...(initialDraftAnswers ?? {}),
  }));

  useEffect(() => {
    clearPlanFitProgress();
  }, []);

  useEffect(() => {
    if (!initialDraftAnswers || Object.keys(initialDraftAnswers).length === 0) {
      return;
    }
    setAnswers((prev) => ({ ...prev, ...initialDraftAnswers }));
    setStepIndex(
      resolveResumeIndex(initialDraftAnswers, initialDraftQuestionIndex),
    );
  }, [initialDraftAnswers, initialDraftQuestionIndex]);

  const question = PLAN_FIT_QUESTIONS[stepIndex];
  const totalSteps = PLAN_FIT_QUESTIONS.length;
  const currentValue = question
    ? answers[question.id as PlanFitQuestionId]
    : undefined;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const canContinue = currentValue != null && !submitting;
  const isLastStep = stepIndex >= totalSteps - 1;
  const aside = question ? STEP_ASIDE[question.id] : null;

  const persistProgress = (
    nextAnswers: Partial<PlanFitAnswers>,
    nextIndex: number,
  ) => {
    void savePlanFitProgress({
      answers: nextAnswers,
      questionIndex: nextIndex,
    }).catch(() => {
    });
  };

  const handleSelect = (value: string) => {
    if (!question || submitting) return;
    const next = {
      ...answers,
      [question.id]: value,
    };
    setAnswers(next);
    persistProgress(next, stepIndex);
  };

  const handleNext = () => {
    if (!canContinue || !question) return;

    if (!isLastStep) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      persistProgress(answers, nextIndex);
      return;
    }

    if (!isPlanFitComplete(answers)) return;
    clearPlanFitProgress();
    void onComplete(answers);
  };

  const handleBack = () => {
    if (stepIndex === 0 || submitting) return;
    const nextIndex = stepIndex - 1;
    setStepIndex(nextIndex);
    persistProgress(answers, nextIndex);
  };

  if (!question || !aside) {
    return <OnboardingPageLoading />;
  }

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-plan-fit-page
      data-register-business-page
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main id="plan-fit-questionnaire" className={bookStyles.main}>
          <div className={`${bookStyles.formZone} ${logoStyles.basicsZone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Step {stepIndex + 1} of {totalSteps}
              </span>
              <span className={bookStyles.progressPct}>
                {Math.round(progress)}% Complete
              </span>
            </div>

            <div className={bookStyles.progressTrack} aria-hidden>
              <motion.div
                className={bookStyles.progressFill}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={question.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: easeOut }}
              >
                <div className={logoStyles.basicsSheet}>
                  <div className={logoStyles.basicsForm}>
                    <span className={logoStyles.basicsBadge} aria-hidden>
                      {stepIndex + 1}
                    </span>
                    <h2 className={logoStyles.basicsTitle}>
                      {question.lead}
                      <span className={logoStyles.basicsAccent}>
                        {question.accent}
                      </span>
                    </h2>
                    <p className={logoStyles.basicsSubtitle}>
                      <Sparkles
                        className={`${logoStyles.basicsSubtitleIcon} size-3.5`}
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      {question.subtitle}
                    </p>

                    <div
                      className={logoStyles.fitChoices}
                      role="radiogroup"
                      aria-label={`${question.lead}${question.accent}`}
                    >
                      {question.options.map((option) => {
                        const selected = currentValue === option.value;
                        const Icon = OPTION_ICONS[option.value] ?? MapPin;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => handleSelect(option.value)}
                            className={`${logoStyles.fitChoice}${
                              selected ? ` ${logoStyles.fitChoiceSelected}` : ""
                            }`}
                          >
                            <span className={logoStyles.fitChoiceIcon} aria-hidden>
                              <Icon className="size-4" strokeWidth={2.25} />
                            </span>
                            <span className={logoStyles.fitChoiceCopy}>
                              <span className={logoStyles.fitChoiceLabel}>
                                {option.label}
                              </span>
                              <span className={logoStyles.fitChoiceHint}>
                                {option.hint}
                              </span>
                            </span>
                            <span className={logoStyles.fitChoiceCheck} aria-hidden>
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {stepIndex > 0 ? (
                      <div className={logoStyles.basicsActions}>
                        <button
                          type="button"
                          className={logoStyles.basicsBack}
                          onClick={handleBack}
                          disabled={submitting}
                        >
                          <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
                          Back
                        </button>
                        <button
                          type="button"
                          className={logoStyles.basicsNext}
                          onClick={handleNext}
                          disabled={!canContinue}
                        >
                          {isLastStep
                            ? submitting
                              ? "Finding your plan…"
                              : "See my plan"
                            : "Next"}
                          <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={logoStyles.basicsNext}
                        onClick={handleNext}
                        disabled={!canContinue}
                      >
                        Next
                        <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                      </button>
                    )}
                  </div>

                  <aside
                    className={`${logoStyles.basicsAside} ${logoStyles.aboutAside}`}
                    aria-label="Why this question"
                  >
                    {question.id === "businesses" ? (
                      <LocationPinAsideArt className={logoStyles.fitPinArt} />
                    ) : null}
                    {question.id === "paidMarketing" ? (
                      <div className={logoStyles.fitWandHero} aria-hidden>
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleWide}`} />
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleMid}`} />
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleTight}`} />
                        <span className={logoStyles.fitWandIcon}>
                          <WandSparkles className="size-9" strokeWidth={2.1} />
                        </span>
                      </div>
                    ) : null}
                    {question.id === "helpStyle" ? (
                      <div className={logoStyles.fitWandHero} aria-hidden>
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleWide}`} />
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleMid}`} />
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleTight}`} />
                        <span className={`${logoStyles.fitWandIcon} ${logoStyles.fitWandIconLarge}`}>
                          <Target size={80} strokeWidth={1.5} />
                        </span>
                      </div>
                    ) : null}
                    {question.id === "priority" ? (
                      <div className={logoStyles.fitWandHero} aria-hidden>
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleWide}`} />
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleMid}`} />
                        <span className={`${logoStyles.fitWandRipple} ${logoStyles.fitWandRippleTight}`} />
                        <span className={`${logoStyles.fitWandIcon} ${logoStyles.fitWandIconLarge}`}>
                          <Trophy size={80} strokeWidth={1.5} />
                        </span>
                      </div>
                    ) : null}
                    <div className={logoStyles.basicsAsideCopy}>
                      <h3 className={logoStyles.basicsAsideTitle}>{aside.title}</h3>
                      <p className={logoStyles.basicsAsideText}>{aside.text}</p>
                    </div>
                    <ul className={logoStyles.basicsBenefits}>
                      {aside.benefits.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.title} className={logoStyles.basicsBenefit}>
                            <span className={logoStyles.basicsBenefitIcon} aria-hidden>
                              <Icon className="size-4" strokeWidth={2.25} />
                            </span>
                            <div>
                              <p className={logoStyles.basicsBenefitTitle}>{item.title}</p>
                              <p className={logoStyles.basicsBenefitHint}>{item.hint}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <div className={logoStyles.basicsTipCard}>
                      <span className={logoStyles.basicsTipIcon} aria-hidden>
                        <Lightbulb className="size-4" strokeWidth={2.25} />
                      </span>
                      <div>
                        <p className={logoStyles.basicsTipTitle}>Why this matters?</p>
                        <p className={logoStyles.basicsTipText}>{aside.tip}</p>
                      </div>
                    </div>
                  </aside>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
