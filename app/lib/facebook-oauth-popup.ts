import { connectFacebook } from "@/app/services/facebook/connect-facebook";

/** postMessage type sent from the OAuth popup when connect + ad account step finishes. */
export const FACEBOOK_OAUTH_COMPLETE_MESSAGE = "facebook-oauth-complete" as const;

export type FacebookOAuthResult =
  | { status: "connected"; restaurantId: number }
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

  // Do not use noopener — the popup must postMessage back to this window.
  return window.open(
    oauthUrl,
    "feastalytics_facebook_oauth",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
  );
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
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== FACEBOOK_OAUTH_COMPLETE_MESSAGE) {
        return;
      }

      const restaurantId = (data as { restaurantId?: unknown }).restaurantId;
      if (typeof restaurantId !== "number" || restaurantId < 1) return;

      try {
        popup.close();
      } catch {
        /* popup may already be closed */
      }
      finish({ status: "connected", restaurantId });
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
  restaurantId: number,
): Promise<FacebookOAuthResult> {
  const { url } = await connectFacebook(accessToken, restaurantId);
  const popup = openFacebookConnectPopup(url);

  if (!popup) {
    throw new Error(
      "Pop-up was blocked. Allow pop-ups for Only Deals, then try again.",
    );
  }

  return waitForFacebookOAuthPopup(popup);
}

/** Notify the opener window and close when OAuth finished inside a popup. */
export function notifyFacebookOAuthComplete(restaurantId: number): boolean {
  if (typeof window === "undefined") return false;
  const opener = window.opener;
  if (!opener || opener.closed) return false;

  opener.postMessage(
    { type: FACEBOOK_OAUTH_COMPLETE_MESSAGE, restaurantId },
    window.location.origin,
  );
  window.close();
  return true;
}
