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
    // Maps to Starter "One location" vs Enterprise "Unlimited location / Multi-location & franchise"
    id: "businesses",
    lead: "How many ",
    accent: "locations?",
    subtitle: "Starter is built for one location; Enterprise for multi-location brands.",
    options: [
      {
        value: "one",
        label: "Just one location",
        hint: "One location",
      },
      {
        value: "few",
        label: "A few locations (2–5)",
        hint: "Growing brand",
      },
      {
        value: "many",
        label: "Many locations or a franchise",
        hint: "Multi-location or franchise",
      },
    ],
  },
  {
    // Maps to DIY Campaign Builder vs AI Campaign Builder / automation (not image generation)
    id: "paidMarketing",
    lead: "What kind of ",
    accent: "campaign tools do you want?",
    subtitle: "Matches DIY tools on Starter vs AI campaign tools on Growth AI.",
    options: [
      {
        value: "yes",
        label: "AI Campaign Builder + follow-ups",
        hint: "AI campaigns and automation",
      },
      {
        value: "somewhat",
        label: "Some AI help, but keep it simple",
        hint: "Light AI support",
      },
      {
        value: "no",
        label: "DIY Campaign Builder is enough",
        hint: "In-house DIY tools",
      },
    ],
  },
  {
    // Maps to Starter DIY / Growth AI / Growth Expert dedicated marketing expert
    id: "helpStyle",
    lead: "How do you want to run ",
    accent: "campaigns?",
    subtitle: "Pick DIY, AI help, or a dedicated marketing expert.",
    options: [
      {
        value: "diy",
        label: "I’ll do it myself (DIY)",
        hint: "DIY Campaign Builder",
      },
      {
        value: "ai",
        label: "I want AI to help",
        hint: "AI Campaign Builder, chat, automation",
      },
      {
        value: "expert",
        label: "I want a dedicated marketing expert",
        hint: "Strategy calls and campaign reviews",
      },
    ],
  },
  {
    // Maps to Starter QR/landing / Growth AI automation / Growth Expert guidance / Enterprise scale
    id: "priority",
    lead: "What’s your top ",
    accent: "priority?",
    subtitle: "We’ll match this to what each plan includes.",
    options: [
      {
        value: "simple",
        label: "Landing pages, QR offers & Stripe checkout",
        hint: "Starter essentials",
      },
      {
        value: "automation",
        label: "AI follow-ups + email / SMS / WhatsApp",
        hint: "Growth AI automation",
      },
      {
        value: "guidance",
        label: "Strategy calls & campaign reviews",
        hint: "Growth Expert services",
      },
      {
        value: "scale",
        label: "Multi-location, white label & custom setup",
        hint: "Enterprise scale",
      },
    ],
  },
] as const;

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

export function isPlanFitPlanId(value: string): value is PlanFitPlanId {
  return (
    value === "starter" ||
    value === "growth-ai" ||
    value === "growth-expert" ||
    value === "enterprise"
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

export function clearPlanFitProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PLAN_FIT_STORAGE_KEY);
  } catch {
  }
}
