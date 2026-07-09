import { isPositiveInt } from "@/app/lib/numbers";
import { triggerToApi } from "@/app/services/automation/automation-api";
import type {
  AutomationPurpose,
  CreateAutomationBody,
} from "@/app/services/automation/types";

/** IDs sent on POST /automation (from route pathname). */
export type AutomationCreateContextIds = {
  businessId: number;
  campaignId: number;
};

export type ValidateAutomationCreateContextInput = {
  businessId: unknown;
  campaignId?: unknown;
};

export type ValidateAutomationCreateContextResult =
  | { ok: true; ids: AutomationCreateContextIds }
  | { ok: false; message: string };

export function validateAutomationCreateContext(
  input: ValidateAutomationCreateContextInput,
): ValidateAutomationCreateContextResult {
  if (!isPositiveInt(input.businessId)) {
    return {
      ok: false,
      message: "Business is required to create an automation.",
    };
  }

  if (!isPositiveInt(input.campaignId)) {
    return {
      ok: false,
      message: "Campaign is required to create an automation.",
    };
  }

  return {
    ok: true,
    ids: {
      businessId: input.businessId,
      campaignId: input.campaignId,
    },
  };
}

export function canCreateAutomation(
  input: ValidateAutomationCreateContextInput,
): boolean {
  return validateAutomationCreateContext(input).ok;
}

export type BuildCreateAutomationBodyInput = {
  name: string;
  description?: string;
  trigger: string;
  purpose: AutomationPurpose;
  ids: AutomationCreateContextIds;
};

export function buildCreateAutomationBody(
  input: BuildCreateAutomationBodyInput,
): CreateAutomationBody {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    trigger: triggerToApi(input.trigger),
    purpose: input.purpose,
    businessId: input.ids.businessId,
    campaignId: input.ids.campaignId,
  };
}
