export type RegisterBusinessStepId =
  | "basics"
  | "about"
  | "location"
  | "number";

export type RegisterBusinessStepUi = {
  lead: string;
  accent: string;
  subtitle: string;
};

export const REGISTER_BUSINESS_STEPS = [
  { id: "basics" as const, number: "1" },
  { id: "about" as const, number: "2" },
  { id: "location" as const, number: "3" },
  { id: "number" as const, number: "4" },
] as const;

export const REGISTER_BUSINESS_STEP_UI: Record<
  RegisterBusinessStepId,
  RegisterBusinessStepUi
> = {
  basics: {
    lead: "Let's start with the ",
    accent: "essentials",
    subtitle: "Your business name and contact number.",
  },
  about: {
    lead: "Tell us more about your ",
    accent: "business",
    subtitle: "Optional details help customers find you.",
  },
  location: {
    lead: "Where are you ",
    accent: "located?",
    subtitle: "Add your address and logo.",
  },
  number: {
    lead: "Choose your ",
    accent: "Twilio number",
    subtitle:
      "Pick the SMS number this business will use. Your business is created only after you connect one.",
  },
};
