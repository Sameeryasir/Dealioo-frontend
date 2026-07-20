import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import {
  isPlanFitComplete,
  type PlanFitAnswers,
} from "@/app/lib/plan-fit-questionnaire";

export type SavePlanFitInput = {
  answers: PlanFitAnswers;
  recommendedPlanSlug: string;
};

export type SavePlanFitResponse = {
  planFitAnswers: PlanFitAnswers;
  planFitRecommendedPlan: string;
  planFitCompletedAt: string;
};

export type GetPlanFitResponse = {
  planFitAnswers: PlanFitAnswers | null;
  planFitRecommendedPlan: string | null;
  planFitCompletedAt: string | null;
};

async function parseApiMessageFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "message" in data) {
      return parseApiMessage(
        (data as { message: unknown }).message,
        fallback,
      );
    }
  } catch {
  }
  return fallback;
}

function parsePlanFitAnswers(raw: unknown): PlanFitAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const answers = raw as Partial<PlanFitAnswers>;
  return isPlanFitComplete(answers) ? answers : null;
}

export async function getPlanFit(): Promise<GetPlanFitResponse> {
  const url = `${getApiBaseUrl()}/onboarding/plan-fit`;

  const res = await authenticatedFetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not load your plan-fit answers.",
      ),
    );
  }

  const data: unknown = await res.json();
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    planFitAnswers: parsePlanFitAnswers(record.planFitAnswers),
    planFitRecommendedPlan:
      typeof record.planFitRecommendedPlan === "string"
        ? record.planFitRecommendedPlan
        : null,
    planFitCompletedAt:
      typeof record.planFitCompletedAt === "string"
        ? record.planFitCompletedAt
        : null,
  };
}

export async function savePlanFit(
  input: SavePlanFitInput,
): Promise<SavePlanFitResponse> {
  const url = `${getApiBaseUrl()}/onboarding/plan-fit`;

  const res = await authenticatedFetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answers: input.answers,
      recommendedPlanSlug: input.recommendedPlanSlug,
    }),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not save your plan-fit answers.",
      ),
    );
  }

  const data: unknown = await res.json();
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  return {
    planFitAnswers: input.answers,
    planFitRecommendedPlan:
      typeof record.planFitRecommendedPlan === "string"
        ? record.planFitRecommendedPlan
        : input.recommendedPlanSlug,
    planFitCompletedAt:
      typeof record.planFitCompletedAt === "string"
        ? record.planFitCompletedAt
        : new Date().toISOString(),
  };
}
