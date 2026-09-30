import { connectGoogleAds } from "@/app/services/google-ads/connect-google-ads";
import { getGoogleAdsConnectionStatus } from "@/app/services/google-ads/get-google-ads-connection-status";

export const GOOGLE_OAUTH_COMPLETE_MESSAGE = "google-oauth-complete" as const;

export const GOOGLE_OAUTH_AUTHENTICATED_MESSAGE =
  "google-oauth-authenticated" as const;

export const GOOGLE_OAUTH_STATUS_SYNC_KEY = "dealioo-google-oauth-status-sync";

export type GoogleOAuthResult =
  | { status: "connected"; businessId: number }
  | { status: "cancelled" };

function signalGoogleOAuthStatusSync(
  businessId: number,
  phase: "authenticated" | "complete",
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      GOOGLE_OAUTH_STATUS_SYNC_KEY,
      JSON.stringify({ businessId, phase, at: Date.now() }),
    );
  } catch {
    /* private mode / quota — ignore */
  }
}

function readBusinessIdFromSyncPayload(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { businessId?: unknown };
    if (typeof parsed.businessId !== "number" || parsed.businessId < 1) {
      return null;
    }
    return parsed.businessId;
  } catch {
    return null;
  }
}

export function consumeGoogleOAuthStatusSync(businessId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(GOOGLE_OAUTH_STATUS_SYNC_KEY);
    const id = readBusinessIdFromSyncPayload(raw);
    if (id !== businessId) return false;
    window.localStorage.removeItem(GOOGLE_OAUTH_STATUS_SYNC_KEY);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function openGoogleConnectPopup(oauthUrl: string): Window | null {
  const width = 560;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  return window.open(
    oauthUrl,
    "dealioo_google_oauth",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
  );
}

function readBusinessIdFromMessage(data: object): number | null {
  const record = data as { businessId?: unknown; restaurantId?: unknown };
  const raw = record.businessId ?? record.restaurantId;
  if (typeof raw !== "number" || raw < 1) return null;
  return raw;
}

async function isGoogleConnectedForBusiness(
  accessToken: string,
  businessId: number,
): Promise<boolean> {
  try {
    const status = await getGoogleAdsConnectionStatus(accessToken, businessId);
    return Boolean(status.connected);
  } catch {
    return false;
  }
}

function waitForGoogleOAuthPopup(
  popup: Window,
  accessToken: string,
  businessId: number,
  timeoutMs = 10 * 60 * 1000,
): Promise<GoogleOAuthResult> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: GoogleOAuthResult) => {
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

      if (event.origin !== window.location.origin) return;

      if (type === GOOGLE_OAUTH_AUTHENTICATED_MESSAGE) {
        const id = readBusinessIdFromMessage(data);
        if (id == null) return;
        finish({ status: "connected", businessId: id });
        return;
      }

      if (type !== GOOGLE_OAUTH_COMPLETE_MESSAGE) return;

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
        await sleep(400);
        if (settled) return;

        const connected = await isGoogleConnectedForBusiness(
          accessToken,
          businessId,
        );
        finish(
          connected
            ? { status: "connected", businessId }
            : { status: "cancelled" },
        );
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

        const connected = await isGoogleConnectedForBusiness(
          accessToken,
          businessId,
        );
        finish(
          connected
            ? { status: "connected", businessId }
            : { status: "cancelled" },
        );
      })();
    }, timeoutMs);
  });
}

export async function connectGoogleAdsInPopup(
  accessToken: string,
  businessId: number,
): Promise<GoogleOAuthResult> {
  const { url } = await connectGoogleAds(accessToken, businessId);
  const popup = openGoogleConnectPopup(url);

  if (!popup) {
    throw new Error(
      "Pop-up was blocked. Allow pop-ups for Dealioo, then try again.",
    );
  }

  return waitForGoogleOAuthPopup(popup, accessToken, businessId);
}

export function notifyGoogleOAuthAuthenticated(businessId: number): boolean {
  if (typeof window === "undefined") return false;
  signalGoogleOAuthStatusSync(businessId, "authenticated");

  const opener = window.opener;
  if (!opener || opener.closed) return false;

  opener.postMessage(
    { type: GOOGLE_OAUTH_AUTHENTICATED_MESSAGE, businessId },
    window.location.origin,
  );
  return true;
}

export function notifyGoogleOAuthComplete(
  businessId: number,
  redirectHref?: string,
): boolean {
  if (typeof window === "undefined") return false;

  signalGoogleOAuthStatusSync(businessId, "complete");

  const opener = window.opener;
  if (!opener || opener.closed) return false;

  opener.postMessage(
    { type: GOOGLE_OAUTH_COMPLETE_MESSAGE, businessId },
    window.location.origin,
  );

  if (redirectHref?.trim()) {
    try {
      opener.location.assign(redirectHref.trim());
    } catch {
      /* cross-origin opener — ignore */
    }
  }

  window.close();
  return true;
}
