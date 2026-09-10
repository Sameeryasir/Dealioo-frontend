const STORAGE_KEY = "dealioo.post-create-onboarding";

export type PostCreateStep = "facebook" | "stripe" | "google" | "invite";

export type PostCreateOnboardingProgress = {
  businessId: number;
  businessName: string;
  step: PostCreateStep;
};

const STEPS = new Set<PostCreateStep>([
  "facebook",
  "stripe",
  "google",
  "invite",
]);

const LEGACY_STEP_MAP: Record<string, PostCreateStep> = {
  metaQuestion: "facebook",
  metaCreate: "facebook",
  facebook: "facebook",
  stripeQuestion: "stripe",
  stripeCreate: "stripe",
  stripe: "stripe",
  google: "google",
  invite: "invite",
};

function normalizeStep(step: unknown): PostCreateStep | null {
  if (typeof step !== "string") return null;
  const mapped = LEGACY_STEP_MAP[step];
  if (!mapped || !STEPS.has(mapped)) return null;
  return mapped;
}

export function readPostCreateOnboarding(): PostCreateOnboardingProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PostCreateOnboardingProgress>;
    const businessId = Number(parsed.businessId);
    const businessName =
      typeof parsed.businessName === "string" ? parsed.businessName.trim() : "";
    const step = normalizeStep(parsed.step);
    if (!Number.isFinite(businessId) || businessId < 1 || !businessName) {
      return null;
    }
    if (!step) return null;
    return { businessId, businessName, step };
  } catch {
    return null;
  }
}

export function writePostCreateOnboarding(
  progress: PostCreateOnboardingProgress,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearPostCreateOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
