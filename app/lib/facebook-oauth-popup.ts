import { connectFacebook } from "@/app/services/facebook/connect-facebook";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";

export const FACEBOOK_OAUTH_COMPLETE_MESSAGE = "facebook-oauth-complete" as const;

export const FACEBOOK_OAUTH_AUTHENTICATED_MESSAGE =
  "facebook-oauth-authenticated" as const;

export const FACEBOOK_OAUTH_CANCELLED_MESSAGE =
  "facebook-oauth-cancelled" as const;

export type FacebookOAuthResult =
  | { status: "connected"; businessId: number }
  | { status: "cancelled" };

function openFacebookConnectPopup(oauthUrl?: string): Window | null {
  return window.open(
    oauthUrl && oauthUrl.trim() ? oauthUrl : "about:blank",
    "dealioo_facebook_oauth",
  );
}

function readBusinessIdFromMessage(data: object): number | null {
  const record = data as { businessId?: unknown; restaurantId?: unknown };
  const raw = record.businessId ?? record.restaurantId;
  if (typeof raw !== "number" || raw < 1) return null;
  return raw;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function isFacebookConnectedForBusiness(
  accessToken: string,
  businessId: number,
): Promise<boolean> {
  try {
    const status = await getFacebookConnectionStatus(accessToken, businessId);
    return Boolean(status.connected);
  } catch {
    return false;
  }
}

function waitForFacebookOAuthPopup(
  popup: Window,
  accessToken: string,
  businessId: number,
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

      // Token saved successfully — do not close popup (user may still pick ad account).
      if (type === FACEBOOK_OAUTH_AUTHENTICATED_MESSAGE) {
        const id = readBusinessIdFromMessage(data);
        if (id == null) return;
        finish({ status: "connected", businessId: id });
        return;
      }

      if (type !== FACEBOOK_OAUTH_COMPLETE_MESSAGE) return;

      const id = readBusinessIdFromMessage(data);
      if (id == null) return;

      try {
        popup.close();
      } catch {
        /* ignore */
      }
      finish({ status: "connected", businessId: id });
    };

    window.addEventListener("message", onMessage);

    let closedCheckStarted = false;
    const pollTimer = window.setInterval(() => {
      if (!popup.closed || closedCheckStarted || settled) return;
      closedCheckStarted = true;
      window.clearInterval(pollTimer);

      void (async () => {
        // Give a late postMessage a moment to arrive before checking the API.
        await sleep(400);
        if (settled) return;

        const connected = await isFacebookConnectedForBusiness(
          accessToken,
          businessId,
        );
        if (connected) {
          finish({ status: "connected", businessId });
          return;
        }

        finish({ status: "cancelled" });
      })();
    }, 400);

    const timeoutTimer = window.setTimeout(() => {
      void (async () => {
        try {
          popup.close();
        } catch {
          /* ignore */
        }
        if (settled) return;

        const connected = await isFacebookConnectedForBusiness(
          accessToken,
          businessId,
        );
        if (connected) {
          finish({ status: "connected", businessId });
          return;
        }

        finish({ status: "cancelled" });
      })();
    }, timeoutMs);
  });
}

export async function connectFacebookInPopup(
  accessToken: string,
  businessId: number,
  scopes: string[],
): Promise<FacebookOAuthResult> {
  if (!scopes.length) {
    throw new Error("Select at least one Meta Ads permission before connecting.");
  }

  // Open during the click gesture so the browser does not block the tab.
  const popup = openFacebookConnectPopup();
  if (!popup) {
    throw new Error(
      "The new tab was blocked. Allow pop-ups for Dealioo, then try again.",
    );
  }

  try {
    const { url } = await connectFacebook(accessToken, businessId, scopes);
    popup.location.href = url;
  } catch (error) {
    try {
      popup.close();
    } catch {
      /* ignore */
    }
    throw error;
  }

  return waitForFacebookOAuthPopup(popup, accessToken, businessId);
}

/** Notify opener that Meta OAuth succeeded (token saved). Keeps the popup open. */
export function notifyFacebookOAuthAuthenticated(businessId: number): boolean {
  if (typeof window === "undefined") return false;
  const opener = window.opener;
  if (!opener || opener.closed) return false;

  opener.postMessage(
    { type: FACEBOOK_OAUTH_AUTHENTICATED_MESSAGE, businessId },
    window.location.origin,
  );
  return true;
}

/** Notify opener and close when connect + ad account step finished in a popup. */
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
