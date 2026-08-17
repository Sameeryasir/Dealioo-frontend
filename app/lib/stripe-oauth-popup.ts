import { connectStripe } from "@/app/services/stripe/connect-stripe";

export const STRIPE_CONNECT_COMPLETE_MESSAGE = "stripe-connect-complete" as const;
export const STRIPE_CONNECT_CANCELLED_MESSAGE =
  "stripe-connect-cancelled" as const;

export type StripeOAuthResult =
  | { status: "connected" }
  | { status: "cancelled" };

function openStripeConnectPopup(oauthUrl: string): Window | null {
  const width = 560;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  return window.open(
    oauthUrl,
    "dealioo_stripe_connect",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
  );
}

function waitForStripeOAuthPopup(
  popup: Window,
  timeoutMs = 10 * 60 * 1000,
): Promise<StripeOAuthResult> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: StripeOAuthResult) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === STRIPE_CONNECT_COMPLETE_MESSAGE) {
        try {
          popup.close();
        } catch {
          /* popup may already be closed */
        }
        finish({ status: "connected" });
        return;
      }
      if (type === STRIPE_CONNECT_CANCELLED_MESSAGE) {
        try {
          popup.close();
        } catch {
          /* ignore */
        }
        finish({ status: "cancelled" });
      }
    };

    window.addEventListener("message", onMessage);

    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        finish({ status: "cancelled" });
      }
    }, 400);

    const timeoutTimer = window.setTimeout(() => {
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      finish({ status: "cancelled" });
    }, timeoutMs);
  });
}

export async function connectStripeInPopup(
  accessToken: string,
  businessId: number,
): Promise<StripeOAuthResult> {
  const { url } = await connectStripe(accessToken, businessId);
  const popup = openStripeConnectPopup(url);

  if (!popup) {
    throw new Error(
      "Pop-up was blocked. Allow pop-ups for Dealioo, then try again.",
    );
  }

  return waitForStripeOAuthPopup(popup);
}
