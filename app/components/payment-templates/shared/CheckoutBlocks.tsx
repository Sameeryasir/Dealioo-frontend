"use client";

import { CreditCard, Mail, Tag, User } from "lucide-react";
import {
  imageScaleStyle,
  normalizeImageScale,
} from "@/app/components/crm-template-editor/template-image";
import {
  campaignPricingTotal,
  formatCampaignPrice,
  type CampaignPricing,
} from "@/app/lib/campaign-price";
import type { PaymentTemplatePage, TemplatePage } from "@/app/components/crm-template-editor/template-types";
import { checkoutFormRootClass, checkoutSectionTitle } from "@/app/components/payment-templates/shared/checkout-form-classes";
import type { CheckoutFormStyles } from "@/app/components/payment-templates/shared/checkout-form-styles";
import { checkoutPreviewFieldShell } from "@/app/components/payment-templates/shared/checkout-form-styles";
import {
  resolveUploadImageUrl,
  spacesImageEagerLoadProps,
} from "@/app/lib/resolve-upload-image-url";

export function OrderSummaryBlock({
  page,
  landingPage,
  campaignPricing,
  dark = false,
}: {
  page: PaymentTemplatePage;
  landingPage: TemplatePage;
  campaignPricing: CampaignPricing;
  dark?: boolean;
}) {
  if (!page.showOrderSummary) return null;
  const title =
    campaignPricing.offer?.trim() ||
    landingPage.heading?.trim() ||
    page.heading?.trim() ||
    "Your order";
  const subtotal = formatCampaignPrice(campaignPricing.subtotal);
  const fees = formatCampaignPrice(campaignPricing.fees ?? 0);
  const total = formatCampaignPrice(campaignPricingTotal(campaignPricing));
  const thumbUrl = resolveUploadImageUrl(landingPage.imageUrl);
  const shell = dark
    ? "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
    : "rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm ring-1 ring-zinc-950/[0.04]";
  const text = dark ? "text-white" : "text-zinc-900";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";

  return (
    <aside className={`${shell} w-full`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
        Order summary
      </p>
      <div className={`mt-3 flex items-center gap-3 ${text}`}>
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt=""
              width={56}
              height={56}
              {...spacesImageEagerLoadProps}
              className="h-full w-full object-cover"
              style={imageScaleStyle(normalizeImageScale(landingPage.imageScale))}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[0.65rem] font-medium text-zinc-500">
              Offer
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className={`mt-0.5 text-xs ${muted}`}>{page.subheading}</p>
        </div>
      </div>
      <dl className={`mt-4 space-y-2 text-sm ${text}`}>
        <div className="flex justify-between gap-2">
          <dt className={muted}>Subtotal</dt>
          <dd className="font-medium">{subtotal}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className={muted}>Fees</dt>
          <dd className="font-medium">{fees}</dd>
        </div>
        <div className={`flex justify-between gap-2 border-t pt-2 ${dark ? "border-white/10" : "border-zinc-200"}`}>
          <dt className="font-semibold">Total</dt>
          <dd className="text-base font-bold">{total}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function ContactFieldsBlock({
  page,
  interactive,
  customerEmail,
  formStyles,
}: {
  page: PaymentTemplatePage;
  interactive: boolean;
  customerEmail?: string;
  formStyles: CheckoutFormStyles;
}) {
  const { isDark } = formStyles;
  const shell = checkoutPreviewFieldShell(formStyles);

  return (
    <div className={checkoutFormRootClass}>
      <p className={checkoutSectionTitle(isDark)}>
        {page.contactSectionTitle || "Contact details"}
      </p>
      <div className={formStyles.fieldsContainerClass}>
        <div className={formStyles.rowClass}>
          <label className={formStyles.labelClass}>Email</label>
          {interactive ? (
            <input
              name="contactEmail"
              type="email"
              readOnly
              value={customerEmail ?? ""}
              className={`${formStyles.fieldClass} bg-zinc-50/80`}
            />
          ) : (
            <div className={`${shell} justify-start`}>
              <Mail className="size-4 shrink-0" />
              <span className="truncate">
                {customerEmail || page.paymentEmailPlaceholder}
              </span>
            </div>
          )}
        </div>
        <div className={formStyles.rowClass}>
          <label className={formStyles.labelClass}>Full name</label>
          <input
            name="contactFullName"
            type="text"
            autoComplete="name"
            readOnly={!interactive}
            placeholder={page.paymentFullNamePlaceholder}
            className={formStyles.fieldClass}
          />
        </div>
        {page.showPhoneField ? (
          <div className={formStyles.rowClass}>
            <label className={formStyles.labelClass}>Phone</label>
            <input
              name="contactPhone"
              type="tel"
              autoComplete="tel"
              readOnly={!interactive}
              placeholder={page.paymentPhonePlaceholder}
              className={formStyles.fieldClass}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CouponFieldBlock({
  page,
  interactive,
  formStyles,
}: {
  page: PaymentTemplatePage;
  interactive: boolean;
  formStyles: CheckoutFormStyles;
}) {
  if (!page.showCoupon) return null;
  const { isDark } = formStyles;

  return (
    <div className={`${checkoutFormRootClass} flex gap-2`}>
      <div
        className={`flex min-w-0 flex-1 items-center gap-2 ${isDark ? "" : "rounded-xl border border-zinc-200/90 bg-white px-2 shadow-sm"}`}
      >
        <Tag className="size-4 shrink-0 text-zinc-400" />
        <input
          name="couponCode"
          type="text"
          readOnly={!interactive}
          placeholder="Discount code"
          className={`${formStyles.fieldClass} min-w-0 flex-1 border-0 bg-transparent shadow-none ring-0`}
        />
      </div>
      <button
        type="button"
        className={`shrink-0 rounded-xl px-4 text-sm font-semibold ${isDark ? "border border-white/20 bg-white/10 text-white" : "border border-zinc-200 bg-zinc-50 text-zinc-800"}`}
      >
        Apply
      </button>
    </div>
  );
}

export function AddressFieldsBlock({
  page,
  interactive,
  formStyles,
}: {
  page: PaymentTemplatePage;
  interactive: boolean;
  formStyles: CheckoutFormStyles;
}) {
  if (!page.showAddressField) return null;
  const { isDark } = formStyles;

  return (
    <div className={checkoutFormRootClass}>
      <p className={checkoutSectionTitle(isDark)}>Billing address</p>
      <div className={formStyles.fieldsContainerClass}>
        <div className={formStyles.rowClass}>
          <label className={formStyles.labelClass}>Country</label>
          <input
            name="billingCountry"
            type="text"
            readOnly={!interactive}
            placeholder="United States"
            className={formStyles.fieldClass}
          />
        </div>
        <div className={formStyles.rowClass}>
          <label className={formStyles.labelClass}>Address</label>
          <input
            name="billingLine1"
            type="text"
            readOnly={!interactive}
            placeholder="Street address"
            className={formStyles.fieldClass}
          />
        </div>
      </div>
    </div>
  );
}

export function PreviewCardFields({
  page,
  formStyles,
}: {
  page: PaymentTemplatePage;
  formStyles: CheckoutFormStyles;
}) {
  const shell = checkoutPreviewFieldShell(formStyles);
  const { isDark } = formStyles;

  return (
    <div className={checkoutFormRootClass}>
      <p className={checkoutSectionTitle(isDark)}>
        {page.paymentMethodSectionTitle || "Payment method"}
      </p>
      <div className={formStyles.fieldsContainerClass}>
        <div className={formStyles.rowClass}>
          <label className={formStyles.labelClass}>Cardholder name</label>
          <div className={shell}>
            <User className="size-4 shrink-0" />
            <span>{page.paymentNameOnCardPlaceholder}</span>
          </div>
        </div>
        <div className={formStyles.rowClass}>
          <label className={formStyles.labelClass}>Card number</label>
          <div className={`${shell} justify-between`}>
            <span className="flex min-w-0 items-center gap-2">
              <CreditCard className="size-4 shrink-0" />
              {page.paymentCardPlaceholder}
            </span>
            <span className="shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[0.55rem] font-bold italic text-zinc-600">
              {page.paymentCardBrandLabel || "Visa"}
            </span>
          </div>
        </div>
        <div className="grid w-full min-w-0 grid-cols-2 gap-3">
          <div className={`min-w-0 ${formStyles.rowClass}`}>
            <label className={formStyles.labelClass}>Expiry</label>
            <div className={shell}>{page.paymentExpiryPlaceholder}</div>
          </div>
          <div className={`min-w-0 ${formStyles.rowClass}`}>
            <label className={formStyles.labelClass}>CVV</label>
            <div className={shell}>{page.paymentCvcPlaceholder}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
