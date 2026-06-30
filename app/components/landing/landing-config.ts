/**
 * Public landing page config — URLs and shared marketing copy.
 * Meeting form: set NEXT_PUBLIC_MEETING_FORM_URL to your Google Form "viewform" link.
 */

/** Google Form — users submit info; your team arranges manual meetings from responses */
export const LANDING_MEETING_FORM_URL =
  process.env.NEXT_PUBLIC_MEETING_FORM_URL?.trim() ?? "";

export const LANDING_AUDIENCE_LINE =
  "The AI Growth Platform for Local Businesses.";
