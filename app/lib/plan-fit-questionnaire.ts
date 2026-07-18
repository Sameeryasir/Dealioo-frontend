export type PlanFitPlanId =
  | "starter"
  | "growth-ai"
  | "growth-expert"
  | "enterprise";

export type PlanFitAnswers = {
  businesses: "one" | "few" | "many";
  paidMarketing: "yes" | "somewhat" | "no";
  helpStyle: "diy" | "ai" | "expert";
  priority: "simple" | "automation" | "guidance" | "scale";
};

export type PlanFitQuestionId = keyof PlanFitAnswers;

export type PlanFitOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export type PlanFitQuestion = {
  id: PlanFitQuestionId;
  lead: string;
  accent: string;
  subtitle: string;
  options: readonly PlanFitOption<string>[];
};

export const PLAN_FIT_QUESTIONS: readonly PlanFitQuestion[] = [
  {
    id: "businesses",
    lead: "How many ",
    accent: "businesses?",
    subtitle: "This helps match single-business vs multi-business plans.",
    options: [
      {
        value: "one",
        label: "Just one",
        hint: "One business",
      },
      {
        value: "few",
        label: "2–5 businesses",
        hint: "Growing brand",
      },
      {
        value: "many",
        label: "6 or more",
        hint: "Multi-business or franchise",
      },
    ],
  },
  {
    id: "paidMarketing",
    lead: "Are you aware of paid marketing — ",
    accent: "Google or Meta ads?",
    subtitle: "This helps us recommend the right growth tools for you.",
    options: [
      {
        value: "yes",
        label: "Yes, I run Google or Meta ads",
        hint: "Already using paid ads",
      },
      {
        value: "somewhat",
        label: "I’ve heard of them, but don’t run ads yet",
        hint: "Aware, not advertising yet",
      },
      {
        value: "no",
        label: "Not really",
        hint: "New to paid marketing",
      },
    ],
  },
  {
    id: "helpStyle",
    lead: "How do you want to run ",
    accent: "campaigns?",
    subtitle: "Pick the level of help that fits your team.",
    options: [
      {
        value: "diy",
        label: "I’ll do it myself",
        hint: "DIY tools are enough",
      },
      {
        value: "ai",
        label: "I want AI to help",
        hint: "Copy, deals, and automation",
      },
      {
        value: "expert",
        label: "I want a marketing expert",
        hint: "Strategy calls and reviews",
      },
    ],
  },
  {
    id: "priority",
    lead: "What’s your top ",
    accent: "priority?",
    subtitle: "We’ll recommend the plan that matches this goal.",
    options: [
      {
        value: "simple",
        label: "Simple deals & QR offers",
        hint: "Get started quickly",
      },
      {
        value: "automation",
        label: "AI + email / SMS follow-ups",
        hint: "Grow without more busywork",
      },
      {
        value: "guidance",
        label: "Hands-on growth guidance",
        hint: "Expert support each month",
      },
      {
        value: "scale",
        label: "Scale across businesses",
        hint: "Custom / enterprise needs",
      },
    ],
  },
] as const;

const PLAN_REASONS: Record<PlanFitPlanId, string> = {
  starter: "Best fit for a single business that wants simple DIY campaigns.",
  "growth-ai": "Best fit when you want AI tools and automated follow-ups.",
  "growth-expert":
    "Best fit when you want AI plus a dedicated marketing expert.",
  enterprise: "Best fit for multi-business brands that need a custom plan.",
};

export function recommendPlanFromAnswers(
  answers: PlanFitAnswers,
): { planId: PlanFitPlanId; reason: string } {
  const scores: Record<PlanFitPlanId, number> = {
    starter: 0,
    "growth-ai": 0,
    "growth-expert": 0,
    enterprise: 0,
  };

  if (answers.businesses === "one") {
    scores.starter += 3;
    scores["growth-ai"] += 1;
  } else if (answers.businesses === "few") {
    scores["growth-ai"] += 2;
    scores["growth-expert"] += 2;
    scores.enterprise += 1;
  } else {
    scores.enterprise += 4;
    scores["growth-expert"] += 1;
  }

  if (answers.paidMarketing === "yes") {
    scores["growth-ai"] += 3;
    scores["growth-expert"] += 2;
  } else if (answers.paidMarketing === "somewhat") {
    scores["growth-ai"] += 2;
    scores.starter += 1;
  } else {
    scores.starter += 3;
  }

  if (answers.helpStyle === "diy") {
    scores.starter += 3;
    scores["growth-ai"] += 1;
  } else if (answers.helpStyle === "ai") {
    scores["growth-ai"] += 4;
    scores["growth-expert"] += 1;
  } else {
    scores["growth-expert"] += 4;
    scores.enterprise += 1;
  }

  if (answers.priority === "simple") {
    scores.starter += 4;
  } else if (answers.priority === "automation") {
    scores["growth-ai"] += 4;
  } else if (answers.priority === "guidance") {
    scores["growth-expert"] += 4;
  } else {
    scores.enterprise += 4;
  }

  const ranked = (
    Object.entries(scores) as [PlanFitPlanId, number][]
  ).sort((a, b) => b[1] - a[1]);

  const planId = ranked[0]?.[0] ?? "starter";
  return {
    planId,
    reason: PLAN_REASONS[planId],
  };
}

export function createEmptyPlanFitAnswers(): Partial<PlanFitAnswers> {
  return {};
}

export function isPlanFitComplete(
  answers: Partial<PlanFitAnswers>,
): answers is PlanFitAnswers {
  return (
    answers.businesses != null &&
    answers.paidMarketing != null &&
    answers.helpStyle != null &&
    answers.priority != null
  );
}

const PLAN_FIT_STORAGE_KEY = "dealioo.planFit.progress.v1";

export type PlanFitProgress = {
  stepIndex: number;
  answers: Partial<PlanFitAnswers>;
};

export function readPlanFitProgress(): PlanFitProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PLAN_FIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanFitProgress;
    if (!parsed || typeof parsed !== "object") return null;
    const maxIndex = Math.max(0, PLAN_FIT_QUESTIONS.length - 1);
    const stepIndex = Math.min(
      maxIndex,
      Math.max(0, Number(parsed.stepIndex) || 0),
    );
    return {
      stepIndex,
      answers:
        parsed.answers && typeof parsed.answers === "object"
          ? parsed.answers
          : {},
    };
  } catch {
    return null;
  }
}

export function writePlanFitProgress(progress: PlanFitProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PLAN_FIT_STORAGE_KEY, JSON.stringify(progress));
  } catch {
  }
}
