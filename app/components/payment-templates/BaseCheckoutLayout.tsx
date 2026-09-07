"use client";

import { CheckoutTemplateType } from "@/app/components/crm-template-editor/checkout-template-types";
import {
  CouponFieldBlock,
  OrderSummaryBlock,
  PreviewCardFields,
} from "@/app/components/payment-templates/shared/CheckoutBlocks";
import { checkoutFormRootClass } from "@/app/components/payment-templates/shared/checkout-form-classes";
import type {
  CheckoutLandingBlend,
  CheckoutTemplateProps,
} from "@/app/components/payment-templates/types";

type LayoutVariant = CheckoutTemplateType;

function usesTwoColumnSummary(variant: LayoutVariant, showSummary: boolean) {
  if (!showSummary) return false;
  return (
    variant === CheckoutTemplateType.SPLIT ||
    variant === CheckoutTemplateType.SHOPIFY ||
    variant === CheckoutTemplateType.STRIPE ||
    variant === CheckoutTemplateType.PREMIUM ||
    variant === CheckoutTemplateType.CRM
  );
}

function shellForVariant(
  variant: LayoutVariant,
  page: CheckoutTemplateProps["page"],
  blend: CheckoutLandingBlend | null | undefined,
) {
  const t = page.checkoutTheme;
  const isDark = Boolean(blend?.isDark);
  const bg =
    blend?.background?.trim() ||
    page.backgroundColor?.trim() ||
    t.background;
  const primary = blend?.primary?.trim() || t.buttonColor;
  const secondary = blend?.secondary?.trim() || primary;
  const radius = t.borderRadius;

  const innerLight =
    "w-full min-w-0 rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-lg ring-1 ring-zinc-950/[0.04] sm:p-5";
  const innerDark =
    "w-full min-w-0 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-5";

  switch (variant) {
    case CheckoutTemplateType.DARK:
      return {
        outer: "w-full min-w-0 text-white",
        inner: innerDark,
        dark: true,
        bg: blend ? bg : "#09090b",
        outerBackground: blend
          ? `linear-gradient(180deg, ${bg} 0%, ${primary}33 100%)`
          : undefined,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.FLOATING:
      return {
        outer: "w-full min-w-0 p-3 sm:p-4",
        inner: isDark
          ? "mx-auto w-full min-w-0 max-w-lg rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
          : "mx-auto w-full min-w-0 max-w-lg rounded-3xl border border-white/60 bg-white/85 p-4 shadow-2xl backdrop-blur-xl sm:p-6",
        dark: isDark,
        bg,
        outerBackground: `linear-gradient(135deg, ${bg} 0%, ${primary}28 50%, ${secondary}22 100%)`,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.APPLE:
      return {
        outer: "w-full min-w-0 p-2 sm:p-3",
        inner: isDark
          ? "mx-auto w-full min-w-0 max-w-md rounded-[1.75rem] border border-white/15 bg-zinc-900/80 p-4 shadow-xl sm:p-6"
          : "mx-auto w-full min-w-0 max-w-md rounded-[1.75rem] bg-white p-4 shadow-xl ring-1 ring-black/5 sm:p-6",
        dark: isDark,
        bg,
        outerBackground: bg,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.MINIMAL:
      return {
        outer: "w-full min-w-0",
        inner: isDark
          ? "mx-auto w-full min-w-0 max-w-md p-3 sm:p-4"
          : "mx-auto w-full min-w-0 max-w-md p-3 sm:p-4",
        dark: isDark,
        bg: isDark ? bg : "#ffffff",
        outerBackground: bg,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.PREMIUM:
      return {
        outer: "w-full min-w-0 p-3 sm:p-4",
        inner: isDark
          ? "w-full min-w-0 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-sm sm:p-6"
          : "w-full min-w-0 rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl sm:p-6",
        dark: isDark,
        bg,
        outerBackground: `linear-gradient(180deg, ${bg} 0%, ${primary}55 55%, ${secondary}40 100%)`,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.SPLIT:
      return {
        outer: "w-full min-w-0 p-2 sm:p-3",
        inner: isDark ? innerDark : innerLight,
        dark: isDark,
        bg,
        outerBackground: bg,
        radius,
      };
    case CheckoutTemplateType.CRM:
      return {
        outer: "w-full min-w-0 p-2 sm:p-3",
        inner: isDark
          ? innerDark
          : "w-full min-w-0 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-md sm:p-5",
        dark: isDark,
        bg,
        outerBackground: `linear-gradient(180deg, ${bg} 0%, ${primary}18 100%)`,
        radius,
      };
    case CheckoutTemplateType.COMPACT:
      return {
        outer: "w-full min-w-0 p-1.5 sm:p-2",
        inner: isDark
          ? "mx-auto w-full min-w-0 max-w-sm rounded-xl border border-white/15 bg-zinc-950/80 p-3 sm:p-3.5"
          : "mx-auto w-full min-w-0 max-w-sm rounded-xl border border-zinc-200/90 bg-white p-3 shadow-md sm:p-3.5",
        dark: isDark,
        bg,
        outerBackground: bg,
        radius: "10px",
      };
    case CheckoutTemplateType.GRADIENT:
      return {
        outer: "w-full min-w-0 p-3 sm:p-5",
        inner: isDark
          ? "mx-auto w-full min-w-0 max-w-lg rounded-3xl border border-white/20 bg-black/35 p-5 shadow-2xl backdrop-blur-md sm:p-6"
          : "mx-auto w-full min-w-0 max-w-lg rounded-3xl border border-white/70 bg-white/80 p-5 shadow-2xl backdrop-blur-md sm:p-6",
        dark: isDark,
        bg,
        outerBackground: `linear-gradient(160deg, ${primary} 0%, ${bg} 42%, ${secondary} 100%)`,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.CARD:
      return {
        outer: "w-full min-w-0 flex justify-center p-4 sm:p-6",
        inner: isDark
          ? "w-full min-w-0 max-w-md rounded-[1.5rem] border border-white/15 bg-zinc-900/90 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-6"
          : "w-full min-w-0 max-w-md rounded-[1.5rem] border border-zinc-200/80 bg-white p-5 shadow-[0_24px_60px_rgba(24,24,27,0.14)] sm:p-6",
        dark: isDark,
        bg,
        outerBackground: `radial-gradient(circle at top, ${primary}33 0%, ${bg} 55%)`,
        radius: undefined as string | undefined,
      };
    case CheckoutTemplateType.BOLD:
      return {
        outer: "w-full min-w-0 p-2 sm:p-3",
        inner: isDark
          ? "w-full min-w-0 rounded-2xl border-2 border-white/25 bg-zinc-950/80 p-5 ring-4 ring-[color:var(--cf-accent-soft)] sm:p-6"
          : "w-full min-w-0 rounded-2xl border-2 border-[color:var(--cf-accent-muted)] bg-white p-5 shadow-xl ring-4 ring-[color:var(--cf-accent-soft)] sm:p-6",
        dark: isDark,
        bg,
        outerBackground: `linear-gradient(180deg, ${primary}2e 0%, ${bg} 70%)`,
        radius,
      };
    default:
      return {
        outer: "w-full min-w-0",
        inner: isDark ? innerDark : innerLight,
        dark: isDark,
        bg,
        outerBackground: bg,
        radius,
      };
  }
}

export function BaseCheckoutLayout({
  variant,
  page,
  landingPage,
  interactive,
  stripeCheckout,
  paymentSlot,
  campaignPricing,
  landingBlend = null,
  formStyles,
}: CheckoutTemplateProps & { variant: LayoutVariant }) {
  const styles = shellForVariant(variant, page, landingBlend);
  const dark = styles.dark || formStyles.isDark;
  const intro = page.subheading?.trim();
  const stripeMode = Boolean(interactive && stripeCheckout);
  const twoColumn = usesTwoColumnSummary(variant, page.showOrderSummary);

  const formColumn = (
    <div
      key={page.formDesign}
      className={[checkoutFormRootClass, formStyles.shellClass, "space-y-5"]
        .filter(Boolean)
        .join(" ")}
      style={formStyles.cssVars}
    >
      <div>
        <h2
          className={`text-left text-lg font-bold tracking-tight ${dark ? "text-white" : "text-zinc-900"}`}
        >
          {page.heading}
        </h2>
        {intro ? (
          <p
            className={`mt-1 text-left text-sm leading-snug ${dark ? "text-zinc-400" : "text-zinc-600"}`}
          >
            {intro}
          </p>
        ) : null}
      </div>

      <CouponFieldBlock
        page={page}
        interactive={interactive}
        formStyles={formStyles}
      />

      <div className="min-w-0">
        {stripeMode ? (
          paymentSlot
        ) : (
          <>
            <PreviewCardFields page={page} formStyles={formStyles} />
            <button
              type="button"
              style={{
                backgroundColor: page.checkoutTheme.buttonColor,
                borderRadius: page.checkoutTheme.borderRadius,
                boxShadow: page.checkoutTheme.shadow,
              }}
              className="mt-4 w-full cursor-pointer py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              {page.buttonText || "Submit payment"}
            </button>
          </>
        )}
      </div>

      <p
        className={`text-center text-[0.65rem] ${dark ? "text-zinc-500" : "text-zinc-500"}`}
      >
        {page.paymentFooterText?.trim() || (
          <>
            Powered by <span className="font-semibold">stripe</span>
          </>
        )}
      </p>
    </div>
  );

  const summary = page.showOrderSummary ? (
    <div className="min-w-0 shrink-0 @md:max-w-[42%] @md:flex-none">
      <OrderSummaryBlock
        page={page}
        landingPage={landingPage}
        campaignPricing={campaignPricing}
        dark={dark}
      />
    </div>
  ) : null;

  const stackClass = twoColumn
    ? "flex w-full min-w-0 flex-col gap-6 @md:flex-row @md:items-start @md:gap-5"
    : "flex w-full min-w-0 flex-col gap-6";

  const outerStyle = {
    ...(styles.outerBackground
      ? { background: styles.outerBackground }
      : styles.bg
        ? { backgroundColor: styles.bg }
        : {}),
    ...formStyles.cssVars,
  };

  return (
    <div className={`@container ${styles.outer}`} style={outerStyle}>
      <div
        className={styles.inner}
        style={{
          borderRadius: styles.radius ?? page.checkoutTheme.borderRadius,
          boxShadow: page.checkoutTheme.shadow,
        }}
      >
        <div className={stackClass}>
          {variant === CheckoutTemplateType.SPLIT && summary ? (
            <>
              {formColumn}
              {summary}
            </>
          ) : (
            <>
              {summary}
              {formColumn}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
