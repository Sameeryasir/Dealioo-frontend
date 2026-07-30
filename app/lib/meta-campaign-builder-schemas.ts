/**
 * Zod schemas for manually typed Meta campaign builder fields only.
 * Dropdowns, toggles, and pickers are not validated here.
 */
import { z } from "zod";
import {
  resolveMetaImageUrl,
  validateHttpsUrl,
  validateMetaImageUrl,
} from "@/app/lib/resolve-meta-image-url";

const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

const moneyAmountSchema = z
  .number({ error: "Enter a valid amount." })
  .finite("Enter a valid amount.")
  .min(1, "Amount must be at least $1.00.")
  .max(1_000_000, "Amount is too large.");

const httpsUrlSchema = (label: string) =>
  z.string().superRefine((value, ctx) => {
    const err = validateHttpsUrl(value, label);
    if (err) ctx.addIssue({ code: "custom", message: err });
  });

const metaImageUrlSchema = z.string().superRefine((value, ctx) => {
  const resolved = resolveMetaImageUrl(value);
  const err = validateMetaImageUrl(resolved);
  if (err) ctx.addIssue({ code: "custom", message: err });
});

export const campaignTypedFieldsSchema = z
  .object({
    name: requiredText("Campaign name"),
    campaignBudgetAmount: z.number().optional(),
    campaignSpendLimit: z.number().optional(),
    requiresCampaignBudget: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.requiresCampaignBudget) {
      const parsed = moneyAmountSchema.safeParse(data.campaignBudgetAmount);
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          path: ["campaignBudgetAmount"],
          message:
            parsed.error.issues[0]?.message ??
            "Campaign budget must be at least $1.00.",
        });
      }
    }
    if (data.campaignSpendLimit != null) {
      const parsed = moneyAmountSchema.safeParse(data.campaignSpendLimit);
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          path: ["campaignSpendLimit"],
          message:
            parsed.error.issues[0]?.message ??
            "Campaign spend limit must be at least 1.",
        });
      }
    }
  });

export const adSetTypedFieldsSchema = z
  .object({
    name: requiredText("Ad set name"),
    dailyBudget: z.number().optional(),
    lifetimeBudget: z.number().optional(),
    bidAmount: z.number().optional(),
    ageMin: z
      .number({ error: "Age range is required." })
      .int("Enter a whole number for minimum age.")
      .min(13, "Minimum age must be at least 13.")
      .max(65, "Minimum age cannot exceed 65."),
    ageMax: z
      .number({ error: "Age range is required." })
      .int("Enter a whole number for maximum age.")
      .min(13, "Maximum age must be at least 13.")
      .max(65, "Maximum age cannot exceed 65."),
    requiresAdSetBudget: z.boolean(),
    budgetType: z.enum(["daily", "lifetime"]).optional(),
    requiresBidAmount: z.boolean(),
    pixelId: z.string().trim().max(200).optional(),
    customEventType: z.string().trim().max(200).optional(),
    pageId: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ageMin > data.ageMax) {
      ctx.addIssue({
        code: "custom",
        path: ["ageMin"],
        message: "Minimum age cannot exceed maximum age.",
      });
    }

    if (data.requiresAdSetBudget) {
      if (data.budgetType === "daily") {
        const parsed = moneyAmountSchema.safeParse(data.dailyBudget);
        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            path: ["dailyBudget"],
            message:
              parsed.error.issues[0]?.message ??
              "Daily budget must be at least 1.",
          });
        }
      } else if (data.budgetType === "lifetime") {
        const parsed = moneyAmountSchema.safeParse(data.lifetimeBudget);
        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            path: ["lifetimeBudget"],
            message:
              parsed.error.issues[0]?.message ??
              "Lifetime budget must be at least 1.",
          });
        }
      }
    }

    if (data.requiresBidAmount) {
      if (
        data.bidAmount == null ||
        !Number.isFinite(data.bidAmount) ||
        data.bidAmount <= 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["bidAmount"],
          message: "Bid amount must be greater than 0.",
        });
      }
    }
  });

const carouselTypedCardSchema = z.object({
  headline: requiredText("Headline", 255),
  description: z.string().trim().max(500).optional(),
  destinationUrl: httpsUrlSchema("Website URL"),
});

export const adCreativeTypedFieldsSchema = z
  .object({
    name: requiredText("Ad name"),
    primaryText: requiredText("Primary text", 2200),
    headline: z.string().trim().optional(),
    description: z.string().trim().max(500).optional(),
    displayLink: z.string().trim().max(200).optional(),
    destinationUrl: z.string().optional(),
    urlParameters: z.string().trim().max(500).optional(),
    imageUrl: z.string().optional(),
    imageAltText: z.string().trim().max(200).optional(),
    videoUrl: z.string().optional(),
    pixelId: z.string().trim().max(200).optional(),
    conversionEvent: z.string().trim().max(200).optional(),
    brandName: z.string().trim().max(200).optional(),
    creativeFormat: z.enum(["SINGLE_IMAGE", "SINGLE_VIDEO", "CAROUSEL"]),
    carouselCards: z
      .array(
        z.object({
          headline: z.string(),
          description: z.string().optional(),
          destinationUrl: z.string(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.creativeFormat === "SINGLE_IMAGE") {
      const imageResult = metaImageUrlSchema.safeParse(data.imageUrl ?? "");
      if (!imageResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["imageUrl"],
          message:
            imageResult.error.issues[0]?.message ?? "Image URL is required.",
        });
      }
      if (!data.headline?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["headline"],
          message: "Headline is required.",
        });
      }
      const dest = httpsUrlSchema("Website URL").safeParse(
        data.destinationUrl ?? "",
      );
      if (!dest.success) {
        ctx.addIssue({
          code: "custom",
          path: ["destinationUrl"],
          message:
            dest.error.issues[0]?.message ??
            "Website URL is required and must use HTTPS.",
        });
      }
    }

    if (data.creativeFormat === "SINGLE_VIDEO") {
      if (!data.videoUrl?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["videoUrl"],
          message: "Upload a video for this ad.",
        });
      }
      if (!data.headline?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["headline"],
          message: "Headline is required.",
        });
      }
      const dest = httpsUrlSchema("Website URL").safeParse(
        data.destinationUrl ?? "",
      );
      if (!dest.success) {
        ctx.addIssue({
          code: "custom",
          path: ["destinationUrl"],
          message:
            dest.error.issues[0]?.message ??
            "Website URL is required and must use HTTPS.",
        });
      }
    }

    if (data.creativeFormat === "CAROUSEL") {
      const cards = data.carouselCards ?? [];
      for (const [index, card] of cards.entries()) {
        const parsed = carouselTypedCardSchema.safeParse(card);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            const field = issue.path[0];
            ctx.addIssue({
              code: "custom",
              path: ["carouselCards", index, field ?? "headline"],
              message: issue.message,
            });
          }
        }
      }
    }
  });

export type ZodUiErrors = {
  fieldErrors: Record<string, string>;
  formError: string | null;
};

export function zodToUiErrors(error: z.ZodError): ZodUiErrors {
  const fieldErrors: Record<string, string> = {};
  const formMessages: string[] = [];

  const fieldKeys = new Set([
    "name",
    "primaryText",
    "imageUrl",
    "headline",
    "destinationUrl",
    "videoUrl",
    "dailyBudget",
    "lifetimeBudget",
    "bidAmount",
    "campaignBudgetAmount",
    "campaignSpendLimit",
    "ageMin",
    "ageMax",
    "imageAltText",
    "displayLink",
    "urlParameters",
    "description",
  ]);

  for (const issue of error.issues) {
    if (issue.path[0] === "carouselCards") {
      const index = issue.path[1];
      const field = issue.path[2];
      if (typeof index === "number") {
        let suffix = typeof field === "string" ? field : "headline";
        if (field === "destinationUrl") suffix = "destination";
        const key = `carousel_${index}_${suffix}`;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        continue;
      }
    }

    const top = issue.path[0];
    if (typeof top === "string" && fieldKeys.has(top)) {
      if (!fieldErrors[top]) fieldErrors[top] = issue.message;
      continue;
    }

    formMessages.push(issue.message);
  }

  if (fieldErrors.campaignBudgetAmount) {
    fieldErrors.campaignDailyBudget = fieldErrors.campaignBudgetAmount;
    fieldErrors.campaignLifetimeBudget = fieldErrors.campaignBudgetAmount;
  }

  return {
    fieldErrors,
    formError:
      formMessages[0] ??
      (Object.keys(fieldErrors).length === 0
        ? (error.issues[0]?.message ?? "Please fix the highlighted fields.")
        : null),
  };
}
