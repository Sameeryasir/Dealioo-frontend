"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
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
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

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
  /** Server draft so users resume at the last unanswered question. */
  initialDraftAnswers?: Partial<PlanFitAnswers> | null;
  initialDraftQuestionIndex?: number | null;
};

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

  // If parent restores draft after first paint, apply once without a loader flash.
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

  const persistProgress = (
    nextAnswers: Partial<PlanFitAnswers>,
    nextIndex: number,
  ) => {
    // Fire-and-forget: UX must not block on draft save failures.
    void savePlanFitProgress({
      answers: nextAnswers,
      questionIndex: nextIndex,
    }).catch(() => {
      /* keep local answers; user can retry */
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

  if (!question) {
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
          <div className={bookStyles.formZone}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Step {stepIndex + 1} of {totalSteps}
              </span>
              <span className={bookStyles.progressPct}>
                {Math.round(progress)}% · {totalSteps} steps total
              </span>
            </div>

            <div className={bookStyles.progressTrack} aria-hidden>
              <motion.div
                className={bookStyles.progressFill}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            <div className={bookStyles.sheet} data-book-meeting-sheet>
              <div className={bookStyles.sheetAccent} aria-hidden />
              <div className={bookStyles.sheetBody}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={question.id}
                    className={bookStyles.sheetStep}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: easeOut }}
                  >
                    <div className={bookStyles.sheetStepContent}>
                      <span className={bookStyles.stepBadge}>
                        {stepIndex + 1}
                      </span>

                      <h2 className={bookStyles.question}>
                        {question.lead}
                        <span className="landing-hero-accent-blue">
                          {question.accent}
                        </span>
                      </h2>

                      <div
                        className={bookStyles.choiceStack}
                        role="radiogroup"
                        aria-label={`${question.lead}${question.accent}`}
                      >
                        {question.options.map((option) => {
                          const selected = currentValue === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => handleSelect(option.value)}
                              className={`${bookStyles.choiceTile}${
                                selected
                                  ? ` ${bookStyles.choiceTileSelected}`
                                  : ""
                              }`}
                            >
                              <span className={bookStyles.choiceTileLabel}>
                                {option.label}
                              </span>
                              <span
                                className={`${bookStyles.choiceTileCheck}${
                                  selected
                                    ? ` ${bookStyles.choiceTileCheckVisible}`
                                    : ""
                                }`}
                                aria-hidden
                              >
                                <Check className="size-3" strokeWidth={3} />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      className={`${bookStyles.actions}${
                        stepIndex > 0 ? ` ${bookStyles.actionsDuo}` : ""
                      }`}
                      data-book-meeting-actions
                    >
                      {stepIndex > 0 ? (
                        <button
                          type="button"
                          className={bookStyles.back}
                          onClick={handleBack}
                        >
                          Back
                        </button>
                      ) : (
                        <span className={bookStyles.actionsSpacer} aria-hidden />
                      )}

                      <button
                        type="button"
                        className={bookStyles.nextBtn}
                        onClick={handleNext}
                        disabled={!canContinue}
                      >
                        {isLastStep
                          ? submitting
                            ? "Finding your plan…"
                            : "See my plan"
                          : "Next"}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
