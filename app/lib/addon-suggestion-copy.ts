export type AddonTopStatus = "clear" | "tied" | "emerging";

export const ADDON_TIP_MIN_TRUSTED_VISITS = 3;

export const PERFORMANCE_ADDON_TIP_FETCH_LIMIT = 24;

export type AddonPreviewTipInput = {
  campaignName: string;
  addonName: string;
  timesPurchased: number;
  topStatus: AddonTopStatus;
  totalAddonVisits?: number;
  extraAddonCount?: number;
};

export type AddonPreviewTipCopy = {
  actionLabel: string;
  headline: string;
  tip: string;
  evidence: string;
  isEarlySignal: boolean;
  caution: string | null;
  moreLabel: string | null;
};

export const ADDON_TIPS_SECTION = {
  title: "What else you can add",
  legacyTitle: "Bundle opportunities",
  subtitle: (monthLabel: string) =>
    `Add-on tips from guest purchases with each deal in ${monthLabel}. Suggestions only — not guarantees.`,
  detailsSubtitle: (monthLabel: string) =>
    `Ranked add-ons to offer with this deal in ${monthLabel}. Based on real purchases — not guarantees.`,
  emptyTitle: "No add-on tips yet",
  emptyBody:
    "Tips appear after guests redeem deals with add-ons. Add add-ons to your deals, then check back after redemptions in this period.",
  emptyDetailsTitle: "No add-on tips for this deal",
  emptyDetailsBody:
    "Try another campaign or month. Tips need guest redemptions that include add-ons.",
  chooseCampaignTitle: "Choose a deal",
  chooseCampaignBody:
    "Pick a deal above to see what else guests often add with it.",
  detailsCta: "See what else to add",
  viewAllCta: "View all tips",
  earlySignalBadge: "Early signal",
  dealCountLabel: (count: number) =>
    `${count} deal${count === 1 ? "" : "s"} with tips`,
} as const;

export function formatAddonDisplayName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function isEarlyAddonSignal(
  topStatus: AddonTopStatus,
  totalAddonVisits?: number,
): boolean {
  if (topStatus === "emerging") return true;
  if (
    totalAddonVisits != null &&
    totalAddonVisits < ADDON_TIP_MIN_TRUSTED_VISITS
  ) {
    return true;
  }
  return false;
}

function timesTogetherLabel(timesPurchased: number): string {
  const safe = Math.max(0, Math.round(timesPurchased) || 0);
  return safe === 1 ? "Bought together 1 time" : `Bought together ${safe} times`;
}

function moreAddonsLabel(extraAddonCount?: number): string | null {
  const extra = Math.max(0, Math.round(extraAddonCount ?? 0) || 0);
  if (extra <= 0) return null;
  return extra === 1
    ? "and 1 more tip for this deal"
    : `and ${extra} more tips for this deal`;
}

export function buildAddonPreviewTip(
  input: AddonPreviewTipInput,
): AddonPreviewTipCopy {
  const deal =
    formatAddonDisplayName(input.campaignName) ||
    input.campaignName.trim() ||
    "this deal";
  const addon =
    formatAddonDisplayName(input.addonName) ||
    input.addonName.trim() ||
    "this add-on";
  const evidence = timesTogetherLabel(input.timesPurchased);
  const moreLabel = moreAddonsLabel(input.extraAddonCount);
  const early = isEarlyAddonSignal(input.topStatus, input.totalAddonVisits);

  if (input.topStatus === "clear" && !early) {
    return {
      actionLabel: "Offer this add-on",
      headline: `Add ${addon}`,
      tip: `Guests who buy ${deal} often add ${addon}. Consider highlighting it on the deal page.`,
      evidence,
      isEarlySignal: false,
      caution: null,
      moreLabel,
    };
  }

  if (input.topStatus === "tied") {
    return {
      actionLabel: "Tied favorite",
      headline: `Also try ${addon}`,
      tip: `${addon} is tied with other top add-ons for ${deal}. More redemptions will show a clearer winner.`,
      evidence,
      isEarlySignal: early,
      caution: early
        ? "Hint only — not enough data yet to treat as proof."
        : null,
      moreLabel,
    };
  }

  return {
    actionLabel: ADDON_TIPS_SECTION.earlySignalBadge,
    headline: `Consider adding ${addon}`,
    tip: `Early hint: guests sometimes add ${addon} with ${deal}. Check again as more orders come in.`,
    evidence,
    isEarlySignal: true,
    caution: "Hint only — not enough data yet to treat as proof.",
    moreLabel,
  };
}
