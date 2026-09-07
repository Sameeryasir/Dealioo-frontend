import type { FormFieldId } from "@/app/components/crm-template-editor/template-types";

export const CRM_REQUIRED_SIGNUP_FIELDS: FormFieldId[] = ["email", "phone"];

const FIELD_ERROR_LABEL: Record<FormFieldId, string> = {
  firstName: "first name",
  lastName: "last name",
  email: "email",
  phone: "phone number",
};

export type FunnelSignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  name: string;
};

export type FunnelSignupValidationResult =
  | { ok: true; values: FunnelSignupFormValues }
  | { ok: false; message: string };

export function validateFunnelSignupFormData(
  fd: FormData,
  formFieldIds: FormFieldId[],
): FunnelSignupValidationResult {
  const enabled = new Set<FormFieldId>(
    formFieldIds.length > 0 ? formFieldIds : CRM_REQUIRED_SIGNUP_FIELDS,
  );

  for (const id of CRM_REQUIRED_SIGNUP_FIELDS) {
    enabled.add(id);
  }

  const firstName = String(fd.get("firstName") ?? "").trim();
  const lastName = String(fd.get("lastName") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").trim();

  const valuesById: Record<FormFieldId, string> = {
    firstName,
    lastName,
    email,
    phone,
  };

  for (const id of enabled) {
    if (!valuesById[id]) {
      return {
        ok: false,
        message: `Please enter your ${FIELD_ERROR_LABEL[id]}.`,
      };
    }
  }

  const nameFromFields = [firstName, lastName].filter(Boolean).join(" ").trim();
  const nameFallback = email.includes("@")
    ? email.slice(0, email.indexOf("@")).trim()
    : "";
  const name = nameFromFields || nameFallback || "Guest";

  return {
    ok: true,
    values: { firstName, lastName, email, phone, name },
  };
}

export function isSignupFormFieldRemovable(fieldId: FormFieldId): boolean {
  return !CRM_REQUIRED_SIGNUP_FIELDS.includes(fieldId);
}
