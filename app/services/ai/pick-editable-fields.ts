import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";

const SHARED_COPY_KEYS = [
  "pageTitle",
  "headline",
  "subheadline",
  "body",
  "ctaLabel",
] as const;

/** Allowed layoutType values Gemini may set. */
export const AI_LANDING_LAYOUT_TYPES = [
  "centered",
  "stacked",
  "split",
  "narrow",
  "wide",
] as const;

export type AiLandingLayoutType = (typeof AI_LANDING_LAYOUT_TYPES)[number];

const PAGE_EDITABLE_KEYS: Record<TemplatePageId, readonly string[]> = {
  landing: [
    ...SHARED_COPY_KEYS,
    "headlineColor",
    "subheadlineColor",
    "bodyColor",
    "ctaTextColor",
    "ctaBackgroundColor",
    "backgroundColor",
    "layoutType",
  ],
  signup: [
    ...SHARED_COPY_KEYS,
    "navBackLabel",
    "navNextLabel",
    "backgroundColor",
    "layoutType",
  ],
  payment: [
    ...SHARED_COPY_KEYS,
    "payWithLinkText",
    "checkoutDividerText",
    "contactSectionTitle",
    "paymentEmailPlaceholder",
    "paymentFullNamePlaceholder",
    "paymentPhonePlaceholder",
    "paymentMethodSectionTitle",
    "paymentCardPlaceholder",
    "paymentExpiryPlaceholder",
    "paymentCvcPlaceholder",
    "paymentNameOnCardPlaceholder",
    "paymentCardBrandLabel",
    "paymentChooseCurrencyLabel",
    "paymentCurrencyRateHint",
    "paymentFooterText",
    "backgroundColor",
    "layoutType",
  ],
  confirmation: [...SHARED_COPY_KEYS, "backgroundColor", "layoutType"],
};

type FieldMatcher = {
  /** Match against the lowercased instruction. */
  test: (text: string, pageId: TemplatePageId) => boolean;
  fields: readonly string[];
};

/**
 * Central field-matching rules for AI editable field selection.
 * Order matters only for readability — results are collected in a Set.
 */
const FIELD_MATCHERS: readonly FieldMatcher[] = [
  {
    test: (text) => {
      if (
        /\b(color|colour|hex|background|bg)\b/.test(text) &&
        /\b(button|cta)\b/.test(text)
      ) {
        return false;
      }
      return /\b(button|cta|cta label|call to action|button text|button label)\b/.test(
        text,
      );
    },
    fields: ["ctaLabel"],
  },
  {
    test: (text) =>
      /\b(headline|heading|hero title|main heading|main title)\b/.test(text),
    fields: ["headline", "headlineColor"],
  },
  {
    test: (text) =>
      /\b(subheadline|subheading|subtitle|secondary heading)\b/.test(text),
    fields: ["subheadline", "subheadlineColor"],
  },
  {
    test: (text) =>
      /\b(body|paragraph|description|copy|body text)\b/.test(text),
    fields: ["body", "bodyColor"],
  },
  {
    // Prefer "page title" / "pagetitle" — bare "title" is too generic.
    test: (text) => /\b(page title|pagetitle)\b/.test(text),
    fields: ["pageTitle"],
  },
  {
    test: (text, pageId) =>
      pageId === "signup" && /\b(back|back button|back label)\b/.test(text),
    fields: ["navBackLabel"],
  },
  {
    test: (text, pageId) =>
      pageId === "signup" &&
      /\b(next|continue|next button|next label)\b/.test(text),
    fields: ["navNextLabel"],
  },
  {
    test: (text, pageId) =>
      pageId === "payment" &&
      /\b(contact (section )?title|contact details title)\b/.test(text),
    fields: ["contactSectionTitle"],
  },
  {
    test: (text, pageId) =>
      pageId === "payment" &&
      /\b(payment (method )?section title|payment method title)\b/.test(text),
    fields: ["paymentMethodSectionTitle"],
  },
  {
    test: (text) =>
      /\b(layout|layout type|centered|stacked|split|narrow|wide|left[-\s]?align(?:ed)?|align(?:ed)?\s+left|center[-\s]?align(?:ed)?|centre[-\s]?align(?:ed)?|align(?:ed)?\s+cent(?:er|re)|right[-\s]?align(?:ed)?)\b/.test(
        text,
      ),
    fields: ["layoutType"],
  },
  {
    test: (text) =>
      /\b(background|bg|page background|background (?:colou?r|hex))\b/.test(
        text,
      ),
    fields: ["backgroundColor"],
  },
];

const LAYOUT_SYNONYM_RULES: readonly {
  pattern: RegExp;
  layoutType: AiLandingLayoutType;
}[] = [
  {
    pattern: /\b(left[-\s]?align(?:ed)?|align(?:ed)?\s+left|align\s+to\s+the\s+left)\b/i,
    layoutType: "stacked",
  },
  {
    pattern:
      /\b(center[-\s]?align(?:ed)?|centre[-\s]?align(?:ed)?|align(?:ed)?\s+cent(?:er|re)|middle\s+align(?:ed)?)\b/i,
    layoutType: "centered",
  },
  {
    pattern: /\b(right[-\s]?align(?:ed)?|align(?:ed)?\s+right)\b/i,
    layoutType: "stacked",
  },
  { pattern: /\bsplit\b/i, layoutType: "split" },
  { pattern: /\bnarrow\b/i, layoutType: "narrow" },
  { pattern: /\bwide\b/i, layoutType: "wide" },
  { pattern: /\bstacked\b/i, layoutType: "stacked" },
  { pattern: /\bcentered\b/i, layoutType: "centered" },
];

export function resolveLayoutTypeFromInstruction(
  instruction: string,
): AiLandingLayoutType | null {
  for (const rule of LAYOUT_SYNONYM_RULES) {
    if (rule.pattern.test(instruction)) {
      return rule.layoutType;
    }
  }
  return null;
}

export function normalizeLayoutUserInstruction(instruction: string): string {
  const resolved = resolveLayoutTypeFromInstruction(instruction);
  if (resolved == null) {
    return instruction;
  }

  const alreadyCanonical = new RegExp(
    `\\b${resolved}\\b`,
    "i",
  ).test(instruction);
  if (alreadyCanonical) {
    return instruction;
  }

  return `${instruction.trim()} (use layoutType "${resolved}")`;
}

export const AI_LAYOUT_SYNONYMS: Record<string, AiLandingLayoutType> = {
  "left aligned": "stacked",
  "left-aligned": "stacked",
  "align left": "stacked",
  "aligned left": "stacked",
  "right aligned": "stacked",
  "right-aligned": "stacked",
  "center aligned": "centered",
  "centre aligned": "centered",
  "center-aligned": "centered",
  "middle aligned": "centered",
};

function matchColourFields(text: string): readonly string[] {
  if (
    !/\b(color|colour|hex)\b/.test(text) &&
    !/\b(background|bg)\b/.test(text)
  ) {
    return [];
  }

  const fields = new Set<string>();

  if (
    /\b(page background)\b/.test(text) ||
    (/\b(background|bg)\b/.test(text) && !/\b(button|cta)\b/.test(text))
  ) {
    fields.add("backgroundColor");
  }

  if (/\b(button|cta)\b/.test(text)) {
    if (/\b(text|label)\b/.test(text)) {
      fields.add("ctaTextColor");
    } else {
      fields.add("ctaBackgroundColor");
    }
  }
  if (/\b(headline|heading|hero title|main heading)\b/.test(text)) {
    fields.add("headlineColor");
  }
  if (/\b(subheadline|subheading|subtitle)\b/.test(text)) {
    fields.add("subheadlineColor");
  }
  if (/\b(body|paragraph|description|copy)\b/.test(text)) {
    fields.add("bodyColor");
  }

  if (fields.size === 0) {
    return [
      "headlineColor",
      "subheadlineColor",
      "bodyColor",
      "ctaTextColor",
      "ctaBackgroundColor",
    ];
  }

  return [...fields];
}

function pickKeys(
  page: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in page) {
      out[key] = page[key];
      continue;
    }
    if (key === "ctaTextColor" && "buttonTextColor" in page) {
      out.ctaTextColor = page.buttonTextColor;
    } else if (key === "ctaBackgroundColor" && "buttonBackgroundColor" in page) {
      out.ctaBackgroundColor = page.buttonBackgroundColor;
    } else if (key === "headlineColor" && "headingColor" in page) {
      out.headlineColor = page.headingColor;
    } else if (key === "subheadlineColor" && "subheadingColor" in page) {
      out.subheadlineColor = page.subheadingColor;
    } else if (key === "ctaLabel" && "buttonText" in page) {
      out.ctaLabel = page.buttonText;
    } else if (key === "headline" && "heading" in page) {
      out.headline = page.heading;
    } else if (key === "subheadline" && "subheading" in page) {
      out.subheadline = page.subheading;
    } else if (key === "pageTitle" && "label" in page) {
      out.pageTitle = page.label;
    }
  }
  return out;
}

function resolveKeysForInstruction(
  pageId: TemplatePageId,
  instruction: string,
): readonly string[] {
  const text = instruction.toLowerCase();
  const allowed = new Set(PAGE_EDITABLE_KEYS[pageId]);
  const matched = new Set<string>();

  for (const matcher of FIELD_MATCHERS) {
    if (!matcher.test(text, pageId)) continue;
    for (const field of matcher.fields) {
      if (allowed.has(field)) {
        matched.add(field);
      }
    }
  }

  for (const field of matchColourFields(text)) {
    if (allowed.has(field)) {
      matched.add(field);
    }
  }

  if (matched.size > 0) {
    return [...matched];
  }

  return PAGE_EDITABLE_KEYS[pageId];
}

export function pickAiEditableFields(input: {
  pageId: TemplatePageId;
  pagePayload: Record<string, unknown>;
  userInstruction: string;
}): Record<string, unknown> {
  const keys = resolveKeysForInstruction(input.pageId, input.userInstruction);
  return pickKeys(input.pagePayload, keys);
}

export function pickAiFieldConstraints(input: {
  editableFields: Record<string, unknown>;
}): Record<string, readonly string[]> | undefined {
  if (!("layoutType" in input.editableFields)) {
    return undefined;
  }
  return {
    layoutType: AI_LANDING_LAYOUT_TYPES,
  };
}

export function isAllowedAiLayoutType(
  value: unknown,
): value is AiLandingLayoutType {
  return (
    typeof value === "string" &&
    (AI_LANDING_LAYOUT_TYPES as readonly string[]).includes(value)
  );
}
