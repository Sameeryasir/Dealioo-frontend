export const BUSINESS_TYPE_OPTIONS = [
  { value: "Restaurant", label: "Restaurant" },
  { value: "Cafe", label: "Cafe" },
  { value: "Retail", label: "Retail" },
  { value: "Salon", label: "Salon & Beauty" },
  { value: "Gym", label: "Gym & Fitness" },
  { value: "Clinic", label: "Clinic & Health" },
  { value: "Agency", label: "Agency & Services" },
  { value: "Ecommerce", label: "E-commerce" },
  { value: "Hospitality", label: "Hospitality" },
  { value: "Other", label: "Other" },
] as const;

export const BUSINESS_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "NZD", label: "NZD — New Zealand Dollar" },
] as const;

export type BusinessTypeValue =
  (typeof BUSINESS_TYPE_OPTIONS)[number]["value"];
export type BusinessCurrencyValue =
  (typeof BUSINESS_CURRENCY_OPTIONS)[number]["value"];
