"use client";

import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formDesignHidesTopHero } from "@/app/components/crm-template-editor/form-design-registry";
import { SignupFormFields } from "@/app/components/crm-template-editor/form-designs/SignupFormFields";
import { LandingPagePreview } from "@/app/components/crm-template-editor/LandingPagePreview";
import { SignupPagePreview } from "@/app/components/crm-template-editor/SignupPagePreview";
import { normalizeHeroDesign } from "@/app/components/crm-template-editor/hero-designs/registry";
import { normalizeLandingDesign } from "@/app/components/crm-template-editor/landing-designs/registry";
import { ConfirmationPagePreview } from "@/app/components/crm-template-editor/ConfirmationPagePreview";
import { PaymentPagePreview } from "@/app/components/crm-template-editor/PaymentPagePreview";
import {
  imageScaleStyle,
  normalizeImageScale,
} from "@/app/components/crm-template-editor/template-image";
import type { CampaignPricing } from "@/app/lib/campaign-price";
import type {
  LandingTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
} from "@/app/components/crm-template-editor/template-types";
import { createCustomer } from "@/app/services/customer/create-customer";
import {
  setFunnelCheckoutCustomerId,
  setFunnelCheckoutEmail,
} from "@/app/lib/funnel-checkout-storage";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { trackFunnelEvent } from "@/app/services/funnel/track-funnel-event";
import { useFunnelAnalyticsTracking } from "@/app/hooks/use-funnel-analytics-tracking";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";

function isLandingTemplatePage(page: TemplatePage): page is LandingTemplatePage {
  return page.id === "landing";
}

function layoutShellClass(_layoutType: string) {
  return "max-w-full";
}

function previewOuterChrome(
  _pageId: string,
  options: { editorChrome?: boolean; fullPageShell?: boolean },
): string {
  if (options.fullPageShell) {
    return "flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto";
  }
  if (options.editorChrome) {
    return "flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white";
  }
  return "overflow-hidden rounded-2xl bg-white shadow-sm";
}

function textAlign(layoutType: string) {
  if (layoutType === "centered") return "text-center";
  return "text-left";
}

function BodyBlock({
  body,
  layoutType,
  isMobile,
  centerBody = false,
}: {
  body: string;
  layoutType: string;
  isMobile: boolean;
  centerBody?: boolean;
}) {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const paras = trimmed.split(/\n\n+/).filter(Boolean);
  const useCenter = centerBody || layoutType === "centered";
  const center = useCenter ? "mx-auto max-w-prose" : "";
  return (
    <div
      className={`mt-8 space-y-4 text-zinc-600 ${isMobile ? "text-sm" : "text-[0.9375rem] leading-relaxed"} ${center}`}
    >
      {paras.map((p, i) => (
        <p key={i} className={useCenter ? "text-center" : ""}>
          {p.trim()}
        </p>
      ))}
    </div>
  );
}

function HeroImage({
  url,
  scale,
  variant = "inset",
}: {
  url: string;
  scale: number;
  variant?: "inset" | "fullBleedTop";
}) {
  const bleed = variant === "fullBleedTop";
  const frameClass = bleed
    ? "aspect-[4/3] w-full overflow-hidden rounded-t-2xl sm:aspect-[3/2]"
    : "aspect-[16/9] w-full overflow-hidden rounded-xl shadow-sm";

  if (!url?.trim()) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-300 bg-zinc-100/90 px-4 text-center ${frameClass}`}
      >
        <span className="text-xs font-semibold text-zinc-600">
          Image placeholder
        </span>
        <span className="text-[0.65rem] text-zinc-500">
          Upload an image in the sidebar under Media
        </span>
      </div>
    );
  }
  return (
    <div className={frameClass}>
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        style={imageScaleStyle(normalizeImageScale(scale))}
      />
    </div>
  );
}

export function TemplatePreview({
  page,
  landingPage,
  landingCtaHref,
  signupNextHref,
  signupBackHref,
  interactiveForms = false,
  submitCustomerOnSignupNext = false,
  editorStepPreviewChrome = false,
  fullPageShellChrome = false,
  paymentStripeCheckout = null,
  trackingFunnelId = null,
  campaignPricing,
}: {
  page: TemplatePage;
  landingPage: TemplatePage;
  landingCtaHref?: string;
  signupNextHref?: string;
  signupBackHref?: string;
  interactiveForms?: boolean;
  submitCustomerOnSignupNext?: boolean;
  editorStepPreviewChrome?: boolean;
  fullPageShellChrome?: boolean;
  paymentStripeCheckout?: FunnelStripePaymentContext | null;
  trackingFunnelId?: number | null;
  campaignPricing?: CampaignPricing | null;
}) {
  const router = useRouter();
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const { trackButtonClick } = useFunnelAnalyticsTracking(
    trackingFunnelId,
    page.id,
  );

  const isMobile = true;
  const fromLanding = page.id === "signup";
  const layoutType = page.layoutType;
  const heroImageUrl = fromLanding ? landingPage.imageUrl : page.imageUrl;
  const heroImageScale = fromLanding
    ? landingPage.imageScale
    : page.imageScale;

  const shell = `${layoutShellClass(layoutType)} mx-auto w-full`;
  const previewFrameClass = previewOuterChrome(page.id, {
    editorChrome: editorStepPreviewChrome,
    fullPageShell: fullPageShellChrome,
  });
  const align = textAlign(layoutType);
  const signup =
    page.id === "signup" ? (page as SignUpTemplatePage) : null;
  const showTopHero =
    !signup || !formDesignHidesTopHero(signup.formDesign);
  const landingCtaAsLink =
    page.id === "landing" && landingCtaHref?.trim().length
      ? landingCtaHref.trim()
      : null;
  const signupNextAsLink =
    page.id === "signup" && signupNextHref?.trim().length
      ? signupNextHref.trim()
      : null;
  const signupBackAsLink =
    page.id === "signup" && signupBackHref?.trim().length
      ? signupBackHref.trim()
      : null;

  const signupSubmitFlow =
    Boolean(signup) &&
    interactiveForms &&
    submitCustomerOnSignupNext &&
    Boolean(signupNextAsLink);

  const onSignupCustomerSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!signupSubmitFlow || !signupNextAsLink) return;
      const fd = new FormData(e.currentTarget);
      const first = String(fd.get("firstName") ?? "").trim();
      const last = String(fd.get("lastName") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const phone = String(fd.get("phone") ?? "").trim();
      const name = [first, last].filter(Boolean).join(" ").trim();
      if (!first) {
        toast.error("Please enter your first name.");
        return;
      }
      if (!last) {
        toast.error("Please enter your last name.");
        return;
      }
      if (!email) {
        toast.error("Please enter your email.");
        return;
      }
      if (!phone) {
        toast.error("Please enter your phone number.");
        return;
      }
      setSignupSubmitting(true);
      try {
        const customer = await createCustomer({ name, email, phone });
        setFunnelCheckoutEmail(email);
        setFunnelCheckoutCustomerId(customer.id);

        if (trackingFunnelId != null && trackingFunnelId >= 1) {
          try {
            await trackFunnelEvent({
              eventType: "signup",
              funnelId: trackingFunnelId,
              customerId: customer.id,
              visitorId: getOrCreateVisitorId(),
            });
          } catch (trackErr) {
            console.warn("[Funnel] signup track failed", trackErr);
          }
        }

        toast.success("You're all set, continuing to payment.", {
          duration: 2400,
        });
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 1000);
        });
        router.push(signupNextAsLink);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        setSignupSubmitting(false);
      }
    },
    [signupSubmitFlow, signupNextAsLink, router, trackingFunnelId],
  );

  const withSurface = (alignClass: string, children: React.ReactNode) => (
    <div className={shell}>
      <div className={`${previewFrameClass} p-4 ${alignClass}`}>{children}</div>
    </div>
  );

  const fullPageLayoutClass = fullPageShellChrome
    ? "flex min-h-full min-w-0 flex-1 flex-col"
    : "";

  if (page.id === "payment") {
    return (
      <div className={`${shell} w-full min-w-0 ${fullPageLayoutClass}`}>
        <div
          className={`w-full min-w-0 ${fullPageShellChrome ? "flex min-h-full flex-1 flex-col" : "overflow-hidden"} ${previewFrameClass}`}
        >
          <PaymentPagePreview
            page={page}
            landingPage={landingPage}
            interactive={interactiveForms}
            stripeCheckout={paymentStripeCheckout}
            campaignPricing={campaignPricing}
            fillViewport={fullPageShellChrome}
          />
        </div>
      </div>
    );
  }

  if (page.id === "confirmation" && isLandingTemplatePage(landingPage)) {
    return (
      <div className={`${shell} w-full min-w-0 ${fullPageLayoutClass}`}>
        <div
          className={`w-full min-w-0 ${fullPageShellChrome ? "flex min-h-full flex-1 flex-col" : "overflow-hidden"} ${previewFrameClass}`}
        >
          <ConfirmationPagePreview
            page={page}
            landingPage={landingPage}
            fillViewport={fullPageShellChrome}
          />
        </div>
      </div>
    );
  }

  if (page.id === "signup" && signup && isLandingTemplatePage(landingPage)) {
    return (
      <div className={`${shell} ${fullPageLayoutClass}`}>
        <div
          className={`${fullPageShellChrome ? "flex min-h-full flex-1 flex-col" : "overflow-hidden"} ${previewFrameClass}`}
        >
          <SignupPagePreview
            signupPage={signup}
            landingPage={landingPage}
            heroImageUrl={heroImageUrl}
            heroImageScale={heroImageScale}
            signupBackHref={signupBackAsLink}
            signupNextHref={signupNextAsLink}
            interactiveForms={interactiveForms}
            signupSubmitFlow={signupSubmitFlow}
            signupSubmitting={signupSubmitting}
            onSignupSubmit={onSignupCustomerSubmit}
            onButtonClick={trackButtonClick}
            fillViewport={fullPageShellChrome}
          />
        </div>
      </div>
    );
  }

  if (page.id === "landing") {
    return (
      <div className={`${shell} ${fullPageLayoutClass}`}>
        <div
          className={`${fullPageShellChrome ? "flex min-h-full flex-1 flex-col" : "overflow-hidden"} ${previewFrameClass}`}
        >
          <LandingPagePreview
            page={page}
            layoutType={layoutType}
            landingDesign={normalizeLandingDesign(
              page.id === "landing"
                ? (page as LandingTemplatePage).landingDesign
                : undefined,
            )}
            heroDesign={normalizeHeroDesign(
              page.id === "landing"
                ? (page as LandingTemplatePage).heroDesign
                : undefined,
            )}
            heroImageUrl={heroImageUrl}
            heroImageScale={heroImageScale}
            landingCtaHref={landingCtaAsLink}
            showTopHero={showTopHero}
            onButtonClick={trackButtonClick}
            fillViewport={fullPageShellChrome}
          />
        </div>
      </div>
    );
  }

  const stackedBody = (
    <>
      {showTopHero ? (
        <div className="-mx-4 -mt-4 mb-6">
          <HeroImage
            url={heroImageUrl}
            scale={heroImageScale}
            variant="fullBleedTop"
          />
        </div>
      ) : null}

      {!signup ? (
        <>
          <h1
            className={`font-bold tracking-tight text-zinc-900 ${isMobile ? "text-xl" : "text-2xl sm:text-3xl"}`}
          >
            {page.heading}
          </h1>
          <p
            className={`mt-5 font-bold text-zinc-700 ${isMobile ? "text-[15px] leading-snug" : "text-[17px] leading-snug"} ${layoutType === "centered" ? "mx-auto max-w-prose" : ""}`}
          >
            {page.subheading}
          </p>
        </>
      ) : null}

      {signup ? (
        signupSubmitFlow ? (
          <form className="contents" onSubmit={onSignupCustomerSubmit}>
            <BodyBlock
              body={page.body}
              layoutType={layoutType}
              isMobile={isMobile}
              centerBody
            />
            <div className="mt-6">
              <SignupFormFields
                fieldIds={signup.formFieldIds}
                design={signup.formDesign}
                interactive={interactiveForms}
                omitInteractiveForm
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {signupBackAsLink ? (
                <Link
                  href={signupBackAsLink}
                  className="inline-flex min-w-36 items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-950/5 transition hover:bg-zinc-50"
                  onClick={() => trackButtonClick(signup.navBackLabel)}
                >
                  {signup.navBackLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  className="min-w-36 rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-950/5"
                  onClick={() => trackButtonClick(signup.navBackLabel)}
                >
                  {signup.navBackLabel}
                </button>
              )}
              <button
                type="submit"
                disabled={signupSubmitting}
                className="inline-flex min-w-36 items-center justify-center rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => trackButtonClick(signup.navNextLabel)}
              >
                {signup.navNextLabel}
              </button>
            </div>
          </form>
        ) : (
          <>
            <BodyBlock
              body={page.body}
              layoutType={layoutType}
              isMobile={isMobile}
              centerBody
            />
            <div className="mt-6">
              <SignupFormFields
                fieldIds={signup.formFieldIds}
                design={signup.formDesign}
                interactive={interactiveForms}
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {signupBackAsLink ? (
                <Link
                  href={signupBackAsLink}
                  className="inline-flex min-w-36 items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-950/5 transition hover:bg-zinc-50"
                  onClick={() => trackButtonClick(signup.navBackLabel)}
                >
                  {signup.navBackLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  className="min-w-36 rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-950/5"
                  onClick={() => trackButtonClick(signup.navBackLabel)}
                >
                  {signup.navBackLabel}
                </button>
              )}
              {signupNextAsLink ? (
                <Link
                  href={signupNextAsLink}
                  className="inline-flex min-w-36 items-center justify-center rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-black/10 transition hover:bg-zinc-800"
                  onClick={() => trackButtonClick(signup.navNextLabel)}
                >
                  {signup.navNextLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  className="min-w-36 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-black/10"
                  onClick={() => trackButtonClick(signup.navNextLabel)}
                >
                  {signup.navNextLabel}
                </button>
              )}
            </div>
          </>
        )
      ) : (
        <>
          <BodyBlock
            body={page.body}
            layoutType={layoutType}
            isMobile={isMobile}
          />
          <div className="mt-6 w-full">
            {landingCtaAsLink ? (
              <Link
                href={landingCtaAsLink}
                className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-black/10 transition hover:bg-zinc-800"
                onClick={() => trackButtonClick(page.buttonText)}
              >
                {page.buttonText}
              </Link>
            ) : (
              <button
                type="button"
                className="w-full rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-black/10"
                onClick={() => trackButtonClick(page.buttonText)}
              >
                {page.buttonText}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );

  if (layoutType === "split") {
    return (
      <div className={shell}>
        <div
          className={`flex flex-col overflow-hidden ${previewFrameClass}`}
        >
          <div className="w-full min-w-0 shrink-0">
            <HeroImage
              url={heroImageUrl}
              scale={heroImageScale}
              variant="fullBleedTop"
            />
          </div>
          <div className="flex w-full flex-col justify-center p-4 text-left">
            {!signup ? (
              <>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                  {page.heading}
                </h1>
                <p className="mt-5 text-[15px] font-bold leading-snug text-zinc-700">
                  {page.subheading}
                </p>
              </>
            ) : null}
            <BodyBlock
              body={page.body}
              layoutType={signup ? layoutType : "stacked"}
              isMobile
              centerBody={Boolean(signup)}
            />
            {signup ? (
              signupSubmitFlow ? (
                <form className="contents" onSubmit={onSignupCustomerSubmit}>
                  <div className="mt-6 w-full min-w-0">
                    <SignupFormFields
                      fieldIds={signup.formFieldIds}
                      design={signup.formDesign}
                      interactive={interactiveForms}
                      omitInteractiveForm
                    />
                  </div>
                  <div className="mt-6 flex w-full max-w-md flex-wrap justify-center gap-2">
                    {signupBackAsLink ? (
                      <Link
                        href={signupBackAsLink}
                        className="inline-flex min-w-36 items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                        onClick={() => trackButtonClick(signup.navBackLabel)}
                      >
                        {signup.navBackLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="min-w-36 rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm"
                        onClick={() => trackButtonClick(signup.navBackLabel)}
                      >
                        {signup.navBackLabel}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={signupSubmitting}
                      className="inline-flex min-w-36 items-center justify-center rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => trackButtonClick(signup.navNextLabel)}
                    >
                      {signup.navNextLabel}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <BodyBlock
                    body={page.body}
                    layoutType={layoutType}
                    isMobile
                    centerBody
                  />
                  <div className="mt-6 w-full min-w-0">
                    <SignupFormFields
                      fieldIds={signup.formFieldIds}
                      design={signup.formDesign}
                      interactive={interactiveForms}
                    />
                  </div>
                  <div className="mt-6 flex w-full max-w-md flex-wrap justify-center gap-2">
                    {signupBackAsLink ? (
                      <Link
                        href={signupBackAsLink}
                        className="inline-flex min-w-36 items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                        onClick={() => trackButtonClick(signup.navBackLabel)}
                      >
                        {signup.navBackLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="min-w-36 rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm"
                        onClick={() => trackButtonClick(signup.navBackLabel)}
                      >
                        {signup.navBackLabel}
                      </button>
                    )}
                    {signupNextAsLink ? (
                      <Link
                        href={signupNextAsLink}
                        className="inline-flex min-w-36 items-center justify-center rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        onClick={() => trackButtonClick(signup.navNextLabel)}
                      >
                        {signup.navNextLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="min-w-36 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white"
                        onClick={() => trackButtonClick(signup.navNextLabel)}
                      >
                        {signup.navNextLabel}
                      </button>
                    )}
                  </div>
                </>
              )
            ) : landingCtaAsLink ? (
              <Link
                href={landingCtaAsLink}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={() => trackButtonClick(page.buttonText)}
              >
                {page.buttonText}
              </Link>
            ) : (
              <button
                type="button"
                className="mt-6 w-full rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
                onClick={() => trackButtonClick(page.buttonText)}
              >
                {page.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return withSurface(align, stackedBody);
}
