import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import {
  isPlanFitComplete,
  isPlanFitPlanId,
  type PlanFitAnswers,
  type PlanFitPlanId,
} from "@/app/lib/plan-fit-questionnaire";

export type PlanFitRecommendation = {
  planSlug: PlanFitPlanId;
  reason: string;
  confidence: string;
  scores: Record<string, number>;
  version: string;
};

export type SavePlanFitResponse = {
  answers: PlanFitAnswers;
  recommendation: PlanFitRecommendation;
  planFitCompletedAt: string;
};

export type GetPlanFitResponse = {
  answers: PlanFitAnswers | null;
  recommendation: PlanFitRecommendation | null;
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

function parseRecommendation(raw: unknown): PlanFitRecommendation | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const planSlug = typeof row.planSlug === "string" ? row.planSlug : "";
  if (!isPlanFitPlanId(planSlug)) return null;
  return {
    planSlug,
    reason: typeof row.reason === "string" ? row.reason : "",
    confidence: typeof row.confidence === "string" ? row.confidence : "LOW",
    scores:
      row.scores && typeof row.scores === "object"
        ? (row.scores as Record<string, number>)
        : {},
    version: typeof row.version === "string" ? row.version : "2026-v1",
  };
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

  const answers =
    parsePlanFitAnswers(record.answers) ??
    parsePlanFitAnswers(record.planFitAnswers);
  const recommendation = parseRecommendation(record.recommendation);

  return {
    answers,
    recommendation,
    planFitAnswers: answers,
    planFitRecommendedPlan:
      recommendation?.planSlug ??
      (typeof record.planFitRecommendedPlan === "string"
        ? record.planFitRecommendedPlan
        : null),
    planFitCompletedAt:
      typeof record.planFitCompletedAt === "string"
        ? record.planFitCompletedAt
        : null,
  };
}

export async function savePlanFit(
  answers: PlanFitAnswers,
): Promise<SavePlanFitResponse> {
  const url = `${getApiBaseUrl()}/onboarding/plan-fit`;

  const res = await authenticatedFetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
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

  const recommendation = parseRecommendation(record.recommendation);
  if (!recommendation) {
    throw new Error("Plan recommendation was missing from the server response.");
  }

  return {
    answers: parsePlanFitAnswers(record.answers) ?? answers,
    recommendation,
    planFitCompletedAt:
      typeof record.planFitCompletedAt === "string"
        ? record.planFitCompletedAt
        : new Date().toISOString(),
  };
}
