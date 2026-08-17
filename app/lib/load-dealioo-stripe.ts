import { loadStripe, type Stripe } from "@stripe/stripe-js";

const ASSISTANT_SELECTOR = [
  'iframe[title*="assistant" i]',
  'iframe[title*="easel" i]',
  'iframe[name*="assistant" i]',
  "[data-stripe-assistant]",
  "#stripe-assistant",
].join(",");

export function loadDealiooStripe(
  publishableKey: string,
  options?: { stripeAccount?: string },
): Promise<Stripe | null> {
  return loadStripe(publishableKey, {
    ...(options?.stripeAccount
      ? { stripeAccount: options.stripeAccount }
      : {}),
    developerTools: {
      assistant: { enabled: false },
    },
  });
}

export function hideStripeTestingAssistant(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll(ASSISTANT_SELECTOR).forEach((node) => {
    node.remove();
  });
}
