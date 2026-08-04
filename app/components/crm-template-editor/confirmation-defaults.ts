import type { TemplatePageBase } from "@/app/components/crm-template-editor/template-types";

export const CONFIRMATION_DEFAULT_HEADING = "Thank you!";
export const CONFIRMATION_DEFAULT_SUBHEADING =
  "Your payment has been confirmed.";
export const CONFIRMATION_DEFAULT_BODY = `We're glad you're with us. You'll receive a confirmation email shortly with your receipt and any next steps.

If your bank needs extra verification, follow any prompts from Stripe.`;

export const CONFIRMATION_POSTPAID_DEFAULT_HEADING = "You're signed up!";
export const CONFIRMATION_POSTPAID_DEFAULT_SUBHEADING =
  "Thanks for registering — your offer is ready.";
export const CONFIRMATION_POSTPAID_DEFAULT_BODY = `We're glad you're with us. Check your email for your pass link and next steps.

You can pay when you visit — no payment was required to sign up.`;

const PLACEHOLDER_SNIPPET = "lorem ipsum";

function isPlaceholderCopy(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  return trimmed.toLowerCase().includes(PLACEHOLDER_SNIPPET);
}

function normalizeCopy(value: string | undefined | null): string {
  return (value?.trim() ?? "").replace(/\s+/g, " ").toLowerCase();
}

function isPrepaidPaymentDefaultCopy(
  page: Pick<TemplatePageBase, "heading" | "subheading" | "body">,
): boolean {
  const sub = normalizeCopy(page.subheading);
  const body = normalizeCopy(page.body);
  if (sub === normalizeCopy(CONFIRMATION_DEFAULT_SUBHEADING)) return true;
  if (body === normalizeCopy(CONFIRMATION_DEFAULT_BODY)) return true;
  if (sub.includes("payment has been confirmed")) return true;
  if (body.includes("receipt") && body.includes("stripe")) return true;
  return false;
}

export function resolveConfirmationContent(
  page: Pick<TemplatePageBase, "heading" | "subheading" | "body">,
  campaignType?: "prepaid" | "postpaid" | null,
): Pick<TemplatePageBase, "heading" | "subheading" | "body"> {
  const isPostpaid = campaignType === "postpaid";

  if (isPostpaid && isPrepaidPaymentDefaultCopy(page)) {
    return {
      heading: CONFIRMATION_POSTPAID_DEFAULT_HEADING,
      subheading: CONFIRMATION_POSTPAID_DEFAULT_SUBHEADING,
      body: CONFIRMATION_POSTPAID_DEFAULT_BODY,
    };
  }

  const defaultHeading = isPostpaid
    ? CONFIRMATION_POSTPAID_DEFAULT_HEADING
    : CONFIRMATION_DEFAULT_HEADING;
  const defaultSubheading = isPostpaid
    ? CONFIRMATION_POSTPAID_DEFAULT_SUBHEADING
    : CONFIRMATION_DEFAULT_SUBHEADING;
  const defaultBody = isPostpaid
    ? CONFIRMATION_POSTPAID_DEFAULT_BODY
    : CONFIRMATION_DEFAULT_BODY;

  return {
    heading: isPlaceholderCopy(page.heading)
      ? defaultHeading
      : page.heading.trim(),
    subheading: isPlaceholderCopy(page.subheading)
      ? defaultSubheading
      : page.subheading.trim(),
    body: isPlaceholderCopy(page.body) ? defaultBody : page.body.trim(),
  };
}
