import type { BillingCycle } from "@/app/components/landing/pricing-plans";
import { hasAuthSession } from "@/app/lib/auth-session";

export type SignupProgress = {
  step: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  accountCreated: boolean;
  emailVerified: boolean;
  selectedPlanId: string;
  billing: BillingCycle;
};

const STORAGE_KEY = "dealioo-signup-progress";

function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "annual";
}

export function readSignupProgress(): SignupProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SignupProgress>;
    if (typeof parsed.step !== "number") return null;

    return {
      step: parsed.step,
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      password: typeof parsed.password === "string" ? parsed.password : "",
      accountCreated: Boolean(parsed.accountCreated),
      emailVerified: Boolean(parsed.emailVerified),
      selectedPlanId:
        typeof parsed.selectedPlanId === "string" && parsed.selectedPlanId.trim()
          ? parsed.selectedPlanId
          : "starter",
      billing: isBillingCycle(parsed.billing) ? parsed.billing : "monthly",
    };
  } catch {
    return null;
  }
}

export function resolveSignupStep(progress: SignupProgress): {
  step: number;
  emailVerified: boolean;
} {
  const authed = hasAuthSession();
  let emailVerified = progress.emailVerified || authed;
  let step = Math.min(Math.max(Math.trunc(progress.step), 0), 3);

  if (step >= 3 && !emailVerified) {
    step = progress.accountCreated ? 2 : 1;
    emailVerified = false;
  }

  if (step >= 2 && !progress.accountCreated) {
    step = progress.email.trim() && progress.name.trim() ? 1 : 0;
  }

  if (step >= 1 && (!progress.email.trim() || !progress.name.trim())) {
    step = 0;
  }

  if (step >= 3 && emailVerified) {
    step = 3;
  }

  return { step, emailVerified };
}

export function saveSignupProgress(progress: SignupProgress): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearSignupProgress(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
