import { connectFacebook } from "@/app/services/facebook/connect-facebook";

/** postMessage type sent from the OAuth popup when connect + ad account step finishes. */
export const FACEBOOK_OAUTH_COMPLETE_MESSAGE = "facebook-oauth-complete" as const;

/** postMessage when user taps Not now (error=access_denied). */
export const FACEBOOK_OAUTH_CANCELLED_MESSAGE =
  "facebook-oauth-cancelled" as const;

export type FacebookOAuthResult =
  | { status: "connected"; businessId: number }
  | { status: "cancelled" };

function openFacebookConnectPopup(oauthUrl: string): Window | null {
  const width = 560;
  const height = 720;
  const left = Math.max(
    0,
    window.screenX + (window.outerWidth - width) / 2,
  );
  const top = Math.max(
    0,
    window.screenY + (window.outerHeight - height) / 2,
  );

  // Do not use noopener, the popup must postMessage back to this window.
  return window.open(
    oauthUrl,
    "dealioo_facebook_oauth",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
  );
}

function readBusinessIdFromMessage(data: object): number | null {
  const record = data as { businessId?: unknown; restaurantId?: unknown };
  const raw = record.businessId ?? record.restaurantId;
  if (typeof raw !== "number" || raw < 1) return null;
  return raw;
}

function waitForFacebookOAuthPopup(
  popup: Window,
  timeoutMs = 10 * 60 * 1000,
): Promise<FacebookOAuthResult> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: FacebookOAuthResult) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      const type = (data as { type?: string }).type;

      if (type === FACEBOOK_OAUTH_CANCELLED_MESSAGE) {
        try {
          popup.close();
        } catch {
          /* ignore */
        }
        finish({ status: "cancelled" });
        return;
      }

      if (event.origin !== window.location.origin) return;
      if (type !== FACEBOOK_OAUTH_COMPLETE_MESSAGE) return;

      const businessId = readBusinessIdFromMessage(data);
      if (businessId == null) return;

      try {
        popup.close();
      } catch {
        /* ignore */
      }
      finish({ status: "connected", businessId });
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

/** Opens Facebook OAuth in a popup so the dashboard stays open. */
export async function connectFacebookInPopup(
  accessToken: string,
  businessId: number,
): Promise<FacebookOAuthResult> {
  const { url } = await connectFacebook(accessToken, businessId);
  const popup = openFacebookConnectPopup(url);

  if (!popup) {
    throw new Error(
      "Pop-up was blocked. Allow pop-ups for Dealioo, then try again.",
    );
  }

  return waitForFacebookOAuthPopup(popup);
}

/** Notify the opener window and close when OAuth finished inside a popup. */
export function notifyFacebookOAuthComplete(businessId: number): boolean {
  if (typeof window === "undefined") return false;
  const opener = window.opener;
  if (!opener || opener.closed) return false;

  opener.postMessage(
    { type: FACEBOOK_OAUTH_COMPLETE_MESSAGE, businessId },
    window.location.origin,
  );
  window.close();
  return true;
}
