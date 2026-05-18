import type {
  FormDesign,
  FormFieldId,
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
  TemplatePageId,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";
import { cloneTemplatePages } from "@/app/lib/clone-template-pages";
import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";
import type {
  CreateFunnelConfirmationPagePayload,
  CreateFunnelLandingPagePayload,
  CreateFunnelPaymentPagePayload,
  CreateFunnelSignupPagePayload,
} from "@/app/services/funnel/create-funnel";

const API_FORM_FIELD_TO_CLIENT: Record<string, FormFieldId> = {
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
};

export type FunnelByCampaignResponse = {
  id: number;
  campaignId: number;
  pages?: Partial<{
    landing: CreateFunnelLandingPagePayload;
    signup: CreateFunnelSignupPagePayload;
    payment: CreateFunnelPaymentPagePayload;
    confirmation: CreateFunnelConfirmationPagePayload;
  }>;
  version?: number;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignFunnelLoadResult = {
  pages: TemplatePagesState;
  funnelId: number | null;
  fromApi: boolean;
};

type FunnelPageCommonPayload = Pick<
  CreateFunnelLandingPagePayload,
  | "pageTitle"
  | "headline"
  | "subheadline"
  | "body"
  | "ctaLabel"
  | "heroImageSrc"
  | "heroImageScale"
  | "backgroundColor"
  | "layoutType"
>;

function baseFromApi<T extends TemplatePage>(
  id: TemplatePageId,
  api: FunnelPageCommonPayload,
  fallback: T,
): T {
  return {
    ...fallback,
    id,
    label: api.pageTitle?.trim() || fallback.label,
    heading: api.headline ?? fallback.heading,
    subheading: api.subheadline ?? fallback.subheading,
    body: api.body ?? fallback.body,
    buttonText: api.ctaLabel ?? fallback.buttonText,
    imageUrl: api.heroImageSrc ?? fallback.imageUrl,
    imageScale:
      typeof api.heroImageScale === "number" && Number.isFinite(api.heroImageScale)
        ? api.heroImageScale
        : fallback.imageScale,
    backgroundColor: api.backgroundColor ?? fallback.backgroundColor,
    layoutType: api.layoutType ?? fallback.layoutType,
  } as T;
}

function mapFormFields(ids: string[] | undefined, fallback: FormFieldId[]): FormFieldId[] {
  if (!ids?.length) return fallback;
  const mapped = ids
    .map((id) => API_FORM_FIELD_TO_CLIENT[id])
    .filter((id): id is FormFieldId => Boolean(id));
  return mapped.length > 0 ? mapped : fallback;
}

function asFormDesign(value: string | undefined, fallback: FormDesign): FormDesign {
  if (!value?.trim()) return fallback;
  return value.trim() as FormDesign;
}

export function mapFunnelApiPagesToTemplateState(
  apiPages: NonNullable<FunnelByCampaignResponse["pages"]>,
): TemplatePagesState {
  const base = cloneTemplatePages();

  if (apiPages.landing) {
    base.landing = baseFromApi("landing", apiPages.landing, base.landing);
  }

  if (apiPages.signup) {
    const fb = base.signup as SignUpTemplatePage;
    const mapped = baseFromApi("signup", apiPages.signup, fb) as SignUpTemplatePage;
    mapped.formFieldIds = mapFormFields(apiPages.signup.formFieldIds, fb.formFieldIds);
    mapped.formDesign = asFormDesign(apiPages.signup.signupFormDesign, fb.formDesign);
    mapped.navBackLabel = apiPages.signup.navBackLabel ?? fb.navBackLabel;
    mapped.navNextLabel = apiPages.signup.navNextLabel ?? fb.navNextLabel;
    base.signup = mapped;
  }

  if (apiPages.payment) {
    const fb = base.payment as PaymentTemplatePage;
    const mapped = baseFromApi("payment", apiPages.payment, fb) as PaymentTemplatePage;
    mapped.formDesign = asFormDesign(apiPages.payment.paymentFormDesign, fb.formDesign);
    mapped.payWithLinkText = apiPages.payment.payWithLinkText ?? fb.payWithLinkText;
    mapped.checkoutDividerText =
      apiPages.payment.checkoutDividerText ?? fb.checkoutDividerText;
    mapped.contactSectionTitle =
      apiPages.payment.contactSectionTitle ?? fb.contactSectionTitle;
    mapped.paymentEmailPlaceholder =
      apiPages.payment.paymentEmailPlaceholder ?? fb.paymentEmailPlaceholder;
    mapped.paymentFullNamePlaceholder =
      apiPages.payment.paymentFullNamePlaceholder ?? fb.paymentFullNamePlaceholder;
    mapped.paymentPhonePlaceholder =
      apiPages.payment.paymentPhonePlaceholder ?? fb.paymentPhonePlaceholder;
    mapped.paymentMethodSectionTitle =
      apiPages.payment.paymentMethodSectionTitle ?? fb.paymentMethodSectionTitle;
    mapped.paymentCardPlaceholder =
      apiPages.payment.paymentCardPlaceholder ?? fb.paymentCardPlaceholder;
    mapped.paymentExpiryPlaceholder =
      apiPages.payment.paymentExpiryPlaceholder ?? fb.paymentExpiryPlaceholder;
    mapped.paymentCvcPlaceholder =
      apiPages.payment.paymentCvcPlaceholder ?? fb.paymentCvcPlaceholder;
    mapped.paymentNameOnCardPlaceholder =
      apiPages.payment.paymentNameOnCardPlaceholder ?? fb.paymentNameOnCardPlaceholder;
    mapped.paymentCardBrandLabel =
      apiPages.payment.paymentCardBrandLabel ?? fb.paymentCardBrandLabel;
    mapped.paymentChooseCurrencyLabel =
      apiPages.payment.paymentChooseCurrencyLabel ?? fb.paymentChooseCurrencyLabel;
    mapped.paymentCurrencyRateHint =
      apiPages.payment.paymentCurrencyRateHint ?? fb.paymentCurrencyRateHint;
    mapped.paymentFooterText = apiPages.payment.paymentFooterText ?? fb.paymentFooterText;
    base.payment = mapped;
  }

  if (apiPages.confirmation) {
    base.confirmation = baseFromApi(
      "confirmation",
      apiPages.confirmation,
      base.confirmation,
    );
  }

  const landingImage = base.landing.imageUrl;
  const landingScale = base.landing.imageScale;
  if (landingImage) {
    base.signup = {
      ...base.signup,
      imageUrl: landingImage,
      imageScale: landingScale,
    } as TemplatePage;
    base.payment = {
      ...base.payment,
      imageUrl: landingImage,
      imageScale: landingScale,
    } as TemplatePage;
  }

  return base;
}

const funnelIdByCampaignCache = new Map<number, number>();

function readFunnelId(
  campaignId: number,
  remote: FunnelByCampaignResponse | null,
): number | null {
  const id = isPositiveInt(remote?.id) ? remote.id : null;
  if (id != null) {
    funnelIdByCampaignCache.set(campaignId, id);
  }
  return id;
}

export function peekCachedFunnelId(campaignId: number): number | null {
  const cached = funnelIdByCampaignCache.get(campaignId);
  return isPositiveInt(cached) ? cached : null;
}

export async function fetchFunnelByCampaignId(
  accessToken: string,
  campaignId: number,
): Promise<FunnelByCampaignResponse | null> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(campaignId)) {
    throw new Error("Valid campaignId is required.");
  }

  const res = await fetch(
    `${getApiBaseUrl()}/funnel/campaign/${encodeURIComponent(String(campaignId))}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not load funnel."));
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null;
  }

  const data = (await res.json()) as FunnelByCampaignResponse;
  readFunnelId(campaignId, data);
  return data;
}

export async function loadTemplatePagesForCampaign(
  campaignId: number,
  accessToken: string,
): Promise<CampaignFunnelLoadResult> {
  const remote = await fetchFunnelByCampaignId(accessToken, campaignId);
  const funnelId = readFunnelId(campaignId, remote);

  if (remote?.pages && Object.keys(remote.pages).length > 0) {
    return {
      pages: mapFunnelApiPagesToTemplateState(remote.pages),
      funnelId,
      fromApi: true,
    };
  }

  return {
    pages: cloneTemplatePages(),
    funnelId,
    fromApi: false,
  };
}
