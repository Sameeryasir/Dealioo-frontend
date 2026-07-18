"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import {
  PLAN_FIT_QUESTIONS,
  createEmptyPlanFitAnswers,
  isPlanFitComplete,
  readPlanFitProgress,
  recommendPlanFromAnswers,
  writePlanFitProgress,
  type PlanFitAnswers,
  type PlanFitPlanId,
  type PlanFitQuestionId,
} from "@/app/lib/plan-fit-questionnaire";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

export type PlanFitResult = {
  planId: PlanFitPlanId;
  reason: string;
  answers: PlanFitAnswers;
};

type PlanFitQuestionnaireProps = {
  onComplete: (result: PlanFitResult) => void;
  initialAnswers?: Partial<PlanFitAnswers> | null;
};

function loadInitialState(initialAnswers?: Partial<PlanFitAnswers> | null): {
  stepIndex: number;
  answers: Partial<PlanFitAnswers>;
} {
  const saved = readPlanFitProgress();
  const answers = {
    ...createEmptyPlanFitAnswers(),
    ...(saved?.answers ?? {}),
    ...(initialAnswers ?? {}),
  };

  let stepIndex = saved?.stepIndex ?? 0;
  if (initialAnswers && isPlanFitComplete(initialAnswers)) {
    stepIndex = 0;
  }

  const maxIndex = Math.max(0, PLAN_FIT_QUESTIONS.length - 1);
  return {
    stepIndex: Math.min(maxIndex, Math.max(0, stepIndex)),
    answers,
  };
}

export function PlanFitQuestionnaire({
  onComplete,
  initialAnswers = null,
}: PlanFitQuestionnaireProps) {
  const reduced = useReducedMotion();
  const [initial] = useState(() => loadInitialState(initialAnswers));
  const [stepIndex, setStepIndex] = useState(initial.stepIndex);
  const [answers, setAnswers] = useState<Partial<PlanFitAnswers>>(
    initial.answers,
  );

  useEffect(() => {
    writePlanFitProgress({ stepIndex, answers });
  }, [answers, stepIndex]);

  const question = PLAN_FIT_QUESTIONS[stepIndex];
  const totalSteps = PLAN_FIT_QUESTIONS.length;
  const currentValue = question
    ? answers[question.id as PlanFitQuestionId]
    : undefined;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const canContinue = currentValue != null;
  const isLastStep = stepIndex >= totalSteps - 1;

  const handleSelect = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }));
  };

  const handleNext = () => {
    if (!canContinue || !question) return;

    if (!isLastStep) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    if (!isPlanFitComplete(answers)) return;
    writePlanFitProgress({ stepIndex, answers });
    const recommendation = recommendPlanFromAnswers(answers);
    onComplete({
      ...recommendation,
      answers,
    });
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  if (!question) return null;

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

                      <p className={bookStyles.hint}>{question.subtitle}</p>

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
                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "0.15rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    color: "var(--bm-muted, #64748b)",
                                  }}
                                >
                                  {option.hint}
                                </span>
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
                        {isLastStep ? "See my plan" : "Next"}
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
