export type RegisterBusinessStepId = "basics" | "about" | "location";

export type RegisterBusinessStepUi = {
  lead: string;
  accent: string;
  subtitle: string;
};

export const REGISTER_BUSINESS_STEPS = [
  { id: "basics" as const, number: "1" },
  { id: "about" as const, number: "2" },
  { id: "location" as const, number: "3" },
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
};
