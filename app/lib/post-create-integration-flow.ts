import type { PostCreateStep } from "@/app/lib/post-create-onboarding";

export type PostCreateIntegrationId =
  | "facebook"
  | "stripe"
  | "google"
  | "twilio";

export type PostCreateConnectionMap = Record<PostCreateIntegrationId, boolean>;

type IntegrationFlow = {
  id: PostCreateIntegrationId;
  why: PostCreateStep;
  question: PostCreateStep;
  create: PostCreateStep;
  connect: PostCreateStep;
  steps: PostCreateStep[];
};

export const POST_CREATE_INTEGRATION_FLOWS: readonly IntegrationFlow[] = [
  {
    id: "facebook",
    why: "facebookWhy",
    question: "facebookQuestion",
    create: "facebookCreate",
    connect: "facebook",
    steps: [
      "facebookWhy",
      "facebookQuestion",
      "facebookCreate",
      "facebook",
    ],
  },
  {
    id: "stripe",
    why: "stripeWhy",
    question: "stripeQuestion",
    create: "stripeCreate",
    connect: "stripe",
    steps: ["stripeWhy", "stripeQuestion", "stripeCreate", "stripe"],
  },
  {
    id: "google",
    why: "googleWhy",
    question: "googleQuestion",
    create: "googleCreate",
    connect: "google",
    steps: ["googleWhy", "googleQuestion", "googleCreate", "google"],
  },
  {
    id: "twilio",
    why: "twilioWhy",
    question: "twilioQuestion",
    create: "twilioCreate",
    connect: "twilio",
    steps: ["twilioWhy", "twilioQuestion", "twilioCreate", "twilio"],
  },
] as const;

function flowForStep(step: PostCreateStep): IntegrationFlow | null {
  return (
    POST_CREATE_INTEGRATION_FLOWS.find((flow) =>
      flow.steps.includes(step),
    ) ?? null
  );
}

function flowIndex(id: PostCreateIntegrationId): number {
  return POST_CREATE_INTEGRATION_FLOWS.findIndex((flow) => flow.id === id);
}

export function isIntegrationConnected(
  id: PostCreateIntegrationId,
  connected: PostCreateConnectionMap | null | undefined,
): boolean {
  return Boolean(connected?.[id]);
}

/** First why-step for an integration that is not connected yet. */
export function firstOpenIntegrationWhy(
  connected: PostCreateConnectionMap | null | undefined,
): PostCreateStep | null {
  for (const flow of POST_CREATE_INTEGRATION_FLOWS) {
    if (!isIntegrationConnected(flow.id, connected)) return flow.why;
  }
  return null;
}

/**
 * If the current step belongs to an already-connected integration,
 * jump to the next open why (or null = dashboard).
 */
export function resolveStepForConnections(
  step: PostCreateStep,
  connected: PostCreateConnectionMap | null | undefined,
): PostCreateStep | null {
  const current = flowForStep(step);
  if (!current) return step;
  if (!isIntegrationConnected(current.id, connected)) return step;

  const start = flowIndex(current.id) + 1;
  for (let i = start; i < POST_CREATE_INTEGRATION_FLOWS.length; i += 1) {
    const next = POST_CREATE_INTEGRATION_FLOWS[i];
    if (!isIntegrationConnected(next.id, connected)) return next.why;
  }
  return null;
}

/** Skip: leave this integration and go to the next open one. */
export function skipTargetForStep(
  step: PostCreateStep,
  connected: PostCreateConnectionMap | null | undefined,
): PostCreateStep | null {
  const current = flowForStep(step);
  if (!current) return firstOpenIntegrationWhy(connected);

  const start = flowIndex(current.id) + 1;
  for (let i = start; i < POST_CREATE_INTEGRATION_FLOWS.length; i += 1) {
    const next = POST_CREATE_INTEGRATION_FLOWS[i];
    if (!isIntegrationConnected(next.id, connected)) return next.why;
  }
  return null;
}

/**
 * Back within the same integration, or to the previous open integration why.
 * Create → Question → Why → previous integration Why.
 */
export function backTargetForStep(
  step: PostCreateStep,
  connected: PostCreateConnectionMap | null | undefined,
): PostCreateStep | null {
  const current = flowForStep(step);
  if (!current) return null;

  if (step === current.connect || step === current.create) {
    return current.question;
  }
  if (step === current.question) {
    return current.why;
  }

  // From why: previous open integration
  for (let i = flowIndex(current.id) - 1; i >= 0; i -= 1) {
    const prev = POST_CREATE_INTEGRATION_FLOWS[i];
    if (!isIntegrationConnected(prev.id, connected)) return prev.why;
  }
  return null;
}

/** After finishing connect (or saying yes I have account → connect done): next open why. */
export function nextIntegrationWhyAfter(
  step: PostCreateStep,
  connected: PostCreateConnectionMap | null | undefined,
): PostCreateStep | null {
  return skipTargetForStep(step, connected);
}
