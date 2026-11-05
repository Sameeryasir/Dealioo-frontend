export type BusinessHealthIssueKey = "setup" | "stripe" | "twilio";

export type BusinessHealthIssue = {
  key: BusinessHealthIssueKey;
  label: string;
};

export type BusinessHealthInput = {
  setupComplete?: boolean;
  onboardingCompleted?: boolean;
  stripeConnected?: boolean;
  twilioConnected?: boolean;
};

export function getBusinessHealthIssues(
  business: BusinessHealthInput,
): BusinessHealthIssue[] {
  const issues: BusinessHealthIssue[] = [];
  const setupOk =
    typeof business.setupComplete === "boolean"
      ? business.setupComplete
      : Boolean(business.onboardingCompleted);

  if (!setupOk) {
    issues.push({ key: "setup", label: "Setup incomplete" });
  }
  if (!business.stripeConnected) {
    issues.push({ key: "stripe", label: "No Stripe" });
  }
  if (!business.twilioConnected) {
    issues.push({ key: "twilio", label: "No SMS" });
  }
  return issues;
}

export function businessNeedsAttention(
  business: BusinessHealthInput,
): boolean {
  return getBusinessHealthIssues(business).length > 0;
}
