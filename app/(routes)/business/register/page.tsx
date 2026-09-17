"use client";

import RegisterBusinessForm, {
  type RegisterBusinessFormValues,
} from "@/app/components/register-business/RegisterBusinessForm";
import RegisterBusinessFacebookConnectStep from "@/app/components/register-business/RegisterBusinessFacebookConnectStep";
import RegisterBusinessGoogleConnectStep from "@/app/components/register-business/RegisterBusinessGoogleConnectStep";
import RegisterBusinessIntegrationAccountQuestionStep from "@/app/components/register-business/RegisterBusinessIntegrationAccountQuestionStep";
import RegisterBusinessIntegrationCreateAccountStep from "@/app/components/register-business/RegisterBusinessIntegrationCreateAccountStep";
import RegisterBusinessIntegrationWhyStep from "@/app/components/register-business/RegisterBusinessIntegrationWhyStep";
import RegisterBusinessStripeConnectStep from "@/app/components/register-business/RegisterBusinessStripeConnectStep";
import RegisterBusinessTwilioConnectStep from "@/app/components/register-business/RegisterBusinessTwilioConnectStep";
import { OnboardingPageLoading } from "@/app/components/brand/OnboardingPageLoading";
import {
  GoogleAdsLogo,
  MetaLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { hasAuthSession, getSetupAccessToken } from "@/app/lib/auth-session";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { isStarterSubscription } from "@/app/lib/plan-limits";
import { resolvePostAuthPath } from "@/app/lib/onboarding-redirect";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { myUserSubscriptionQueryKey } from "@/app/hooks/use-my-user-subscription";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { prependBusinessToMyListCache } from "@/app/services/business/business-query-cache";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import {
  fetchMyBusinesses,
  type AdminBusiness,
} from "@/app/services/business/get-my-business";
import { registerBusiness } from "@/app/services/business/register-business";
import { invalidateOnboardingStatusCache } from "@/app/services/onboarding/get-onboarding-status";
import {
  clearPostCreateOnboarding,
  readPostCreateOnboarding,
  writePostCreateOnboarding,
  type PostCreateStep,
} from "@/app/lib/post-create-onboarding";
import {
  backTargetForStep,
  firstOpenIntegrationWhy,
  nextIntegrationWhyAfter,
  resolveStepForConnections,
  skipTargetForStep,
  type PostCreateConnectionMap,
  type PostCreateIntegrationId,
} from "@/app/lib/post-create-integration-flow";
import { getIntegrationsStatus } from "@/app/services/integration-audit/get-integrations-status";
import { getBusinessTwilioPhoneNumbers } from "@/app/services/business/twilio-phone-numbers";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CreditCard,
  Megaphone,
  MessageSquare,
  Phone,
  Shield,
  Target,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const EMPTY_CONNECTIONS: PostCreateConnectionMap = {
  facebook: false,
  stripe: false,
  google: false,
  twilio: false,
};

async function userCanRegisterBusiness(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<boolean> {
  try {
    const status = await getOnboardingStatus();
    if (status.subscriptionCompleted || status.subscriptionSelected) return true;
  } catch {}

  try {
    const subscription = await queryClient.fetchQuery({
      queryKey: myUserSubscriptionQueryKey,
      queryFn: getMyUserSubscription,
      staleTime: 5 * 60_000,
    });
    return (
      subscription?.status === "active" || subscription?.status === "trialing"
    );
  } catch {
    return false;
  }
}

function shouldLeaveCreateFormForExistingBusiness(
  subscription: Awaited<ReturnType<typeof getMyUserSubscription>> | null,
): boolean {
  if (!subscription) return true;
  return isStarterSubscription(subscription);
}

function TwilioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden role="img">
      <circle cx="12" cy="12" r="12" fill="#F22F46" />
      <circle cx="8.2" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="8.2" cy="15.8" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="15.8" r="2.15" fill="#fff" />
    </svg>
  );
}

type CreatedBusiness = {
  id: number;
  name: string;
};

export default function RegisterBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accessToken] = useState(() => getSetupAccessToken());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gateReady, setGateReady] = useState(false);
  const [createdBusiness, setCreatedBusiness] = useState<CreatedBusiness | null>(
    null,
  );
  const [postCreateStep, setPostCreateStep] =
    useState<PostCreateStep>("facebookWhy");
  const [connections, setConnections] =
    useState<PostCreateConnectionMap>(EMPTY_CONNECTIONS);
  const [connectionsReady, setConnectionsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      if (!hasAuthSession()) {
        router.replace("/auth/login");
        return;
      }

      if (isInvitedTeamUser()) {
        router.replace("/dashboard");
        return;
      }

      try {
        const [status, subscription] = await Promise.all([
          getOnboardingStatus(),
          queryClient
            .fetchQuery({
              queryKey: myUserSubscriptionQueryKey,
              queryFn: getMyUserSubscription,
              staleTime: 5 * 60_000,
            })
            .catch(() => null),
        ]);
        if (cancelled) return;

        if (!status.subscriptionCompleted && !status.subscriptionSelected) {
          router.replace("/auth/select-plan");
          return;
        }

        if (
          status.businessCreated &&
          shouldLeaveCreateFormForExistingBusiness(subscription) &&
          !readPostCreateOnboarding()
        ) {
          router.replace(resolvePostAuthPath(status));
          return;
        }

        const saved = readPostCreateOnboarding();
        if (saved && !cancelled) {
          setCreatedBusiness({
            id: saved.businessId,
            name: saved.businessName,
          });
          setPostCreateStep(saved.step);
        }

        if (!cancelled) setGateReady(true);
      } catch {
        try {
          const list = await fetchMyBusinesses({ page: 1, limit: 1 });
          if (cancelled) return;
          const count = list.meta?.total ?? list.data?.length ?? 0;

          if (count > 0 && !readPostCreateOnboarding()) {
            const subscription = await queryClient
              .fetchQuery({
                queryKey: myUserSubscriptionQueryKey,
                queryFn: getMyUserSubscription,
                staleTime: 5 * 60_000,
              })
              .catch(() => null);
            if (shouldLeaveCreateFormForExistingBusiness(subscription)) {
              router.replace("/dashboard");
              return;
            }
          }

          if (count === 0) {
            const canRegister = await userCanRegisterBusiness(queryClient);
            if (cancelled) return;
            if (!canRegister) {
              router.replace("/auth/select-plan");
              return;
            }
          }
        } catch {
          if (cancelled) return;
          router.replace("/dashboard");
          return;
        }

        if (cancelled) return;
        const saved = readPostCreateOnboarding();
        if (saved) {
          setCreatedBusiness({
            id: saved.businessId,
            name: saved.businessName,
          });
          setPostCreateStep(saved.step);
        }
        setGateReady(true);
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  const savePostCreateStep = useCallback(
    (step: PostCreateStep, business?: CreatedBusiness | null) => {
      const nextBusiness = business ?? createdBusiness;
      setPostCreateStep(step);
      if (!nextBusiness) return;
      writePostCreateOnboarding({
        businessId: nextBusiness.id,
        businessName: nextBusiness.name,
        step,
      });
    },
    [createdBusiness],
  );

  const goToDashboard = useCallback(() => {
    clearPostCreateOnboarding();
    router.replace("/dashboard?setup=1");
  }, [router]);

  const goToStepOrDashboard = useCallback(
    (step: PostCreateStep | null) => {
      if (!step) {
        goToDashboard();
        return;
      }
      savePostCreateStep(step);
    },
    [goToDashboard, savePostCreateStep],
  );

  const go = useCallback(
    (step: PostCreateStep) => () => savePostCreateStep(step),
    [savePostCreateStep],
  );

  const handleSkip = useCallback(() => {
    goToStepOrDashboard(skipTargetForStep(postCreateStep, connections));
  }, [connections, goToStepOrDashboard, postCreateStep]);

  const handleBack = useCallback(() => {
    const target = backTargetForStep(postCreateStep, connections);
    if (target) savePostCreateStep(target);
  }, [connections, postCreateStep, savePostCreateStep]);

  const handleAfterIntegration = useCallback(
    (justConnected?: PostCreateIntegrationId) => {
      const nextConnections = justConnected
        ? { ...connections, [justConnected]: true }
        : connections;
      if (justConnected) setConnections(nextConnections);
      goToStepOrDashboard(
        nextIntegrationWhyAfter(postCreateStep, nextConnections),
      );
    },
    [connections, goToStepOrDashboard, postCreateStep],
  );

  // Load which integrations are already connected; skip their setup screens.
  useEffect(() => {
    if (!createdBusiness) {
      setConnections(EMPTY_CONNECTIONS);
      setConnectionsReady(false);
      return;
    }

    let cancelled = false;
    setConnectionsReady(false);

    async function loadConnections() {
      const businessId = createdBusiness!.id;
      try {
        const [status, twilio] = await Promise.all([
          getIntegrationsStatus(businessId).catch(() => null),
          getBusinessTwilioPhoneNumbers(businessId).catch(() => null),
        ]);
        if (cancelled) return;

        const next: PostCreateConnectionMap = {
          facebook: Boolean(status?.facebook?.connected),
          stripe: Boolean(status?.stripe?.connected),
          google: Boolean(status?.googleAds?.connected),
          twilio: Boolean(
            twilio?.credentialsConnected || twilio?.selectedPhoneNumber,
          ),
        };
        setConnections(next);

        setPostCreateStep((current) => {
          const resolved = resolveStepForConnections(current, next);
          if (resolved === current) return current;
          if (!resolved) {
            clearPostCreateOnboarding();
            router.replace("/dashboard?setup=1");
            return current;
          }
          writePostCreateOnboarding({
            businessId,
            businessName: createdBusiness!.name,
            step: resolved,
          });
          return resolved;
        });
      } finally {
        if (!cancelled) setConnectionsReady(true);
      }
    }

    void loadConnections();
    return () => {
      cancelled = true;
    };
  }, [createdBusiness, router]);

  const onCreateBusiness = useCallback(
    async (pendingForm: RegisterBusinessFormValues) => {
      setErrorMessage(null);
      setSubmitting(true);
      try {
        const result = await registerBusiness(accessToken, {
          name: pendingForm.name,
          phoneNumber: pendingForm.phoneNumber,
          email: pendingForm.email.trim() || undefined,
          description: pendingForm.description.trim() || undefined,
          websiteUrl: pendingForm.websiteUrl || undefined,
          businessType: pendingForm.businessType,
          currency: pendingForm.currency,
          logoFile: pendingForm.logoFile ?? null,
          logoUrl: pendingForm.logoUrl ?? null,
          city: pendingForm.city,
          state: pendingForm.state,
          postalCode: pendingForm.postalCode,
          country: pendingForm.country,
          branchCount: pendingForm.branchCount,
        });

        const businessId =
          result.business?.id ?? result.id ?? result.businessId ?? null;

        if (businessId == null || !Number.isFinite(businessId) || businessId < 1) {
          throw new Error("Business was created, but no business id was returned.");
        }

        const businessForCache: AdminBusiness =
          result.business ?? {
            id: businessId,
            name: pendingForm.name.trim(),
            phoneNumber: pendingForm.phoneNumber.trim(),
            email: pendingForm.email.trim() || null,
            description: pendingForm.description.trim() || null,
            websiteUrl: pendingForm.websiteUrl.trim() || null,
            businessType: pendingForm.businessType.trim() || null,
            currency: pendingForm.currency.trim().toUpperCase() || null,
            city: pendingForm.city.trim() || null,
            state: pendingForm.state.trim() || null,
            postalCode: pendingForm.postalCode.trim() || null,
            country: pendingForm.country.trim() || null,
            branchCount: pendingForm.branchCount,
            twilioConnected: false,
            twilioPhoneNumber: null,
          };

        prependBusinessToMyListCache(queryClient, businessForCache);
        await queryClient.invalidateQueries({
          queryKey: businessQueryKeys.myLists(),
        });
        invalidateOnboardingStatusCache();

        const created = {
          id: businessId,
          name: pendingForm.name.trim(),
        };
        setCreatedBusiness(created);
        setConnections(EMPTY_CONNECTIONS);
        const start =
          firstOpenIntegrationWhy(EMPTY_CONNECTIONS) ?? "facebookWhy";
        savePostCreateStep(start, created);
        setSubmitting(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not add business. Your form data is still here — try again.";
        setErrorMessage(message);
        setSubmitting(false);
      }
    },
    [accessToken, queryClient, savePostCreateStep],
  );

  if (!gateReady || (createdBusiness && !connectionsReady)) {
    return <OnboardingPageLoading />;
  }

  if (createdBusiness) {
    // --- Meta ---
    if (postCreateStep === "facebookWhy") {
      return (
        <RegisterBusinessIntegrationWhyStep
          progressLabel="Meta Ads setup"
          dataAttr="data-register-business-meta-why"
          badge={<MetaLogo className="h-5 w-5" />}
          title={
            <>
              Why connect{" "}
              <span className="landing-hero-accent-blue">Meta Ads</span>?
            </>
          }
          subtitle="Meta Ads lets Dealioo pull Facebook and Instagram campaign performance next to your guest results."
          detail="Connecting Meta once for this business means Dealioo can load your ad accounts, show spend and results in reporting, and help you manage campaigns without switching between apps."
          reasons={[
            {
              icon: BarChart3,
              title: "See ad performance",
              description:
                "View spend, impressions, clicks, and reach from Facebook and Instagram alongside Dealioo guest activity, so you can compare ads and outcomes in one place.",
            },
            {
              icon: Megaphone,
              title: "Run campaigns with Dealioo",
              description:
                "Create and manage Meta campaigns next to your funnels and guests, instead of jumping between Meta Ads Manager and Dealioo for everyday work.",
            },
            {
              icon: Target,
              title: "Track what converts",
              description:
                "Link ads to Dealioo funnels and guest results so you can see which clicks turn into customers, not only which ads get traffic.",
            },
          ]}
          sidebarTitle="Meta Ad Account"
          sidebarText="A Meta Ad Account is where Facebook and Instagram campaigns live. Dealioo needs one connected so it can pull reporting and campaign data for this business."
          sidebarExtraTitle="What you will need"
          sidebarExtraText="A Meta Business / Ads account you can access, plus any payment method or verification Meta requires before ads can run."
          onContinue={go("facebookQuestion")}
          onSkip={handleSkip}
        />
      );
    }

    if (postCreateStep === "facebookQuestion") {
      return (
        <RegisterBusinessIntegrationAccountQuestionStep
          progressLabel="Meta Ads setup"
          dataAttr="data-register-business-meta-question"
          badge={<MetaLogo className="h-5 w-5" />}
          title={
            <>
              Do you have a{" "}
              <span className="landing-hero-accent-blue">Meta Ads</span>{" "}
              account?
            </>
          }
          subtitle="Tell us if you already have a Meta Ad Account for this business."
          yesHint="Continue to connect Meta Ads"
          noHint="We'll show you how to create one"
          noIcon={Megaphone}
          sidebarTitle="Meta Ad Account"
          sidebarText="You need a Meta Ad Account (with payment method when required) before Dealioo can connect and report on your ads."
          onHasAccount={go("facebook")}
          onNoAccount={go("facebookCreate")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "facebookCreate") {
      return (
        <RegisterBusinessIntegrationCreateAccountStep
          progressLabel="Meta Ads setup"
          dataAttr="data-register-business-meta-create"
          badgeIcon={Megaphone}
          title={
            <>
              Create a{" "}
              <span className="landing-hero-accent-blue">Meta Ad Account</span>
            </>
          }
          subtitle="Follow the full process below, then tap Create. We will open Meta Business Suite and take you to connect next."
          steps={[
            "Go to Meta Business Suite.",
            "Create a Business if you don't already have one.",
            "Open Business Settings.",
            "Navigate to Accounts → Ad Accounts.",
            "Click Add → Create a New Ad Account.",
            "Enter your ad account name, time zone, and currency.",
            "Assign yourself Full Control of the ad account.",
            "Add a payment method if Meta asks for one.",
            "Verify your phone number if Meta requests verification.",
            "Return to Dealioo and finish connecting Meta Ads.",
          ]}
          tip="Your ad account may need Meta verification and a payment method before you can publish ads."
          openUrl="https://business.facebook.com/"
          onContinue={go("facebook")}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      );
    }

    if (postCreateStep === "facebook") {
      return (
        <RegisterBusinessFacebookConnectStep
          businessId={createdBusiness.id}
          businessName={createdBusiness.name}
          onContinue={() => handleAfterIntegration("facebook")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    // --- Stripe ---
    if (postCreateStep === "stripeWhy") {
      return (
        <RegisterBusinessIntegrationWhyStep
          progressLabel="Stripe setup"
          dataAttr="data-register-business-stripe-why"
          badge={<CreditCard className="h-4 w-4" aria-hidden />}
          title={
            <>
              Why connect{" "}
              <span className="landing-hero-accent-blue">Stripe</span>?
            </>
          }
          subtitle="Stripe is how customers pay you through Dealioo campaigns and funnels."
          detail="When Stripe is linked, Dealioo can open secure checkout for guests and send payouts to your Stripe account. You keep control of banking details inside Stripe, not inside Dealioo."
          reasons={[
            {
              icon: Wallet,
              title: "Receive payments",
              description:
                "Money from funnel and campaign payments goes to your Stripe account, then to your bank, so Dealioo never holds your payout account details.",
            },
            {
              icon: Shield,
              title: "Secure checkout",
              description:
                "Stripe handles card security and compliance so you do not store sensitive card numbers yourself.",
            },
            {
              icon: CreditCard,
              title: "Easy to manage",
              description:
                "Disconnect or reconnect anytime from Settings → Integrations if you need to change accounts later.",
            },
          ]}
          sidebarTitle="Get paid"
          sidebarText="Without Stripe, guests cannot pay you through Dealioo checkouts. Connect once and reuse it across campaigns for this business."
          sidebarExtraTitle="What you will need"
          sidebarExtraText="A Stripe account for this business, plus bank or debit details Stripe needs for payouts and any identity checks they request."
          onContinue={go("stripeQuestion")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "stripeQuestion") {
      return (
        <RegisterBusinessIntegrationAccountQuestionStep
          progressLabel="Stripe setup"
          dataAttr="data-register-business-stripe-question"
          badge={<CreditCard className="h-4 w-4" aria-hidden />}
          title={
            <>
              Do you have a{" "}
              <span className="landing-hero-accent-blue">Stripe</span> account?
            </>
          }
          subtitle="Tell us if you already have a Stripe account for payouts."
          yesHint="Continue to connect Stripe"
          noHint="We'll show you how to create one"
          noIcon={CreditCard}
          sidebarTitle="Get paid"
          sidebarText="Stripe is how customer payments from Dealioo funnels and offers reach your bank account."
          onHasAccount={go("stripe")}
          onNoAccount={go("stripeCreate")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "stripeCreate") {
      return (
        <RegisterBusinessIntegrationCreateAccountStep
          progressLabel="Stripe setup"
          dataAttr="data-register-business-stripe-create"
          badgeIcon={CreditCard}
          title={
            <>
              Create a{" "}
              <span className="landing-hero-accent-blue">Stripe</span> account
            </>
          }
          subtitle="Follow the full process below, then tap Create. We will open Stripe signup and take you to connect next."
          steps={[
            "Go to Stripe and click Sign up.",
            "Enter your email and create a password.",
            "Add your business details when Stripe asks.",
            "Add a bank account or debit card for payouts.",
            "Complete any identity verification Stripe requests.",
            "Return to Dealioo and finish connecting Stripe.",
          ]}
          tip="Stripe may ask you to verify your business before you can receive payouts."
          openUrl="https://dashboard.stripe.com/register"
          onContinue={go("stripe")}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      );
    }

    if (postCreateStep === "stripe") {
      return (
        <RegisterBusinessStripeConnectStep
          businessId={createdBusiness.id}
          businessName={createdBusiness.name}
          onContinue={() => handleAfterIntegration("stripe")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    // --- Google ---
    if (postCreateStep === "googleWhy") {
      return (
        <RegisterBusinessIntegrationWhyStep
          progressLabel="Google Ads setup"
          dataAttr="data-register-business-google-why"
          badge={<GoogleAdsLogo className="h-5 w-5" />}
          title={
            <>
              Why connect{" "}
              <span className="landing-hero-accent-blue">Google Ads</span>?
            </>
          }
          subtitle="Google Ads helps people find your business when they search, and Dealioo can manage those campaigns next to Meta."
          detail="Connecting Google Ads lets Dealioo open your Google Ads account for this business, pull performance data, and keep search campaigns in the same workflow as your funnels and guests."
          reasons={[
            {
              icon: Megaphone,
              title: "Run Google campaigns",
              description:
                "Create and manage Search and Performance Max campaigns from Dealioo without living only inside Google Ads.",
            },
            {
              icon: BarChart3,
              title: "See ad performance",
              description:
                "Pull spend, clicks, and conversions next to your guest results so you can compare channels in one place.",
            },
            {
              icon: Target,
              title: "Track funnel outcomes",
              description:
                "Connect ads to Dealioo funnels so you know which clicks convert into customers, not only which ads get traffic.",
            },
          ]}
          sidebarTitle="Reach more customers"
          sidebarText="Connecting Google Ads once lets Dealioo manage search campaigns alongside Meta for this business."
          sidebarExtraTitle="What you will need"
          sidebarExtraText="A Google account with access to the Google Ads customer / account you want to use for this business."
          onContinue={go("googleQuestion")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "googleQuestion") {
      return (
        <RegisterBusinessIntegrationAccountQuestionStep
          progressLabel="Google Ads setup"
          dataAttr="data-register-business-google-question"
          badge={<GoogleAdsLogo className="h-5 w-5" />}
          title={
            <>
              Do you have a{" "}
              <span className="landing-hero-accent-blue">Google Ads</span>{" "}
              account?
            </>
          }
          subtitle="Tell us if you already have a Google Ads account for this business."
          yesHint="Continue to connect Google Ads"
          noHint="We'll show you how to create one"
          noIcon={Megaphone}
          sidebarTitle="Google Ads account"
          sidebarText="You need a Google Ads account before Dealioo can connect and manage campaigns for this business."
          onHasAccount={go("google")}
          onNoAccount={go("googleCreate")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "googleCreate") {
      return (
        <RegisterBusinessIntegrationCreateAccountStep
          progressLabel="Google Ads setup"
          dataAttr="data-register-business-google-create"
          badgeIcon={Megaphone}
          title={
            <>
              Create a{" "}
              <span className="landing-hero-accent-blue">Google Ads</span>{" "}
              account
            </>
          }
          subtitle="Follow the full process below, then tap Create. We will open Google Ads signup and take you to connect next."
          steps={[
            "Go to Google Ads and click Start now.",
            "Sign in with the Google account you want for this business.",
            "Choose your business goals when Google Ads asks.",
            "Enter your business name and website if prompted.",
            "Skip creating a campaign for now if you only need the account.",
            "Confirm your account and billing details when Google asks.",
            "Return to Dealioo and finish connecting Google Ads.",
          ]}
          tip="Use the Google account that should own this business’s ads — not a personal account you don’t control."
          openUrl="https://ads.google.com/intl/en_us/home/"
          onContinue={go("google")}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      );
    }

    if (postCreateStep === "google") {
      return (
        <RegisterBusinessGoogleConnectStep
          businessId={createdBusiness.id}
          businessName={createdBusiness.name}
          onContinue={() => handleAfterIntegration("google")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    // --- Twilio ---
    if (postCreateStep === "twilioWhy") {
      return (
        <RegisterBusinessIntegrationWhyStep
          progressLabel="Twilio setup"
          dataAttr="data-register-business-twilio-why"
          badge={<TwilioMark className="h-5 w-5" />}
          title={
            <>
              Why connect{" "}
              <span className="landing-hero-accent-blue">Twilio</span>?
            </>
          }
          subtitle="Twilio lets Dealioo send SMS from a phone number on your own Twilio account."
          detail="After you connect, Dealioo uses your Account SID and Auth Token to send and receive SMS for this business. You can pick a number you already own or buy one on your Twilio account."
          reasons={[
            {
              icon: MessageSquare,
              title: "Send SMS from your number",
              description:
                "Campaign and guest messages go out through your Twilio account, so replies and delivery stay tied to a number you control.",
            },
            {
              icon: Phone,
              title: "Use or buy a number",
              description:
                "Pick a number already on Twilio, or search and buy one on your account after you connect credentials.",
            },
            {
              icon: Shield,
              title: "Your account stays yours",
              description:
                "Disconnect anytime in Settings → Integrations. Your number stays on Twilio; Dealioo only stops using it.",
            },
          ]}
          sidebarTitle="SMS from your number"
          sidebarText="Dealioo sends messages through your Twilio account, not a shared Dealioo number."
          sidebarExtraTitle="What you will need"
          sidebarExtraText="A Twilio Account SID and Auth Token from the Twilio Console, plus a phone number on that account for SMS when you are ready."
          onContinue={go("twilioQuestion")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "twilioQuestion") {
      return (
        <RegisterBusinessIntegrationAccountQuestionStep
          progressLabel="Twilio setup"
          dataAttr="data-register-business-twilio-question"
          badge={<TwilioMark className="h-5 w-5" />}
          title={
            <>
              Do you have a{" "}
              <span className="landing-hero-accent-blue">Twilio</span> account?
            </>
          }
          subtitle="Tell us if you already have a Twilio Account SID and Auth Token."
          yesHint="Continue to connect Twilio"
          noHint="We'll show you how to create one"
          noIcon={Phone}
          sidebarTitle="Twilio account"
          sidebarText="You need a Twilio account (and usually a phone number) before Dealioo can send SMS for this business."
          onHasAccount={go("twilio")}
          onNoAccount={go("twilioCreate")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }

    if (postCreateStep === "twilioCreate") {
      return (
        <RegisterBusinessIntegrationCreateAccountStep
          progressLabel="Twilio setup"
          dataAttr="data-register-business-twilio-create"
          badgeIcon={Phone}
          title={
            <>
              Create a{" "}
              <span className="landing-hero-accent-blue">Twilio</span> account
            </>
          }
          subtitle="Follow the full process below, then tap Create. We will open Twilio signup and take you to connect next."
          steps={[
            "Go to Twilio and create an account (or sign in).",
            "Verify your email and phone if Twilio asks.",
            "Open the Twilio Console dashboard.",
            "Copy your Account SID from the account info section.",
            "Reveal and copy your Auth Token (keep it private).",
            "Optional: buy or note a phone number you want to use for SMS.",
            "Return to Dealioo and finish connecting Twilio.",
          ]}
          tip="Never share your Auth Token publicly. You can rotate it anytime in the Twilio Console."
          openUrl="https://www.twilio.com/try-twilio"
          onContinue={go("twilio")}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      );
    }

    if (postCreateStep === "twilio") {
      return (
        <RegisterBusinessTwilioConnectStep
          businessId={createdBusiness.id}
          businessName={createdBusiness.name}
          onContinue={() => handleAfterIntegration("twilio")}
          onSkip={handleSkip}
          onBack={handleBack}
        />
      );
    }
  }

  return (
    <RegisterBusinessForm
      submitting={submitting}
      errorMessage={errorMessage}
      onCreateBusiness={onCreateBusiness}
    />
  );
}
