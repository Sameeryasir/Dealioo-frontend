import { normalizePaymentPage } from "@/app/components/crm-template-editor/PaymentPagePreview";
import { normalizeHexColor } from "@/app/components/crm-template-editor/landing-content-colors";
import { normalizeHeroDesign } from "@/app/components/crm-template-editor/hero-designs/registry";
import { normalizeLandingDesign } from "@/app/components/crm-template-editor/landing-designs/registry";
import type {
  FormDesign,
  FormFieldId,
  LandingTemplatePage,
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
  TemplatePageId,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";
import { normalizeLandingSectionOrder } from "@/app/components/crm-template-editor/landing-sections";
import { cloneTemplatePages } from "@/app/lib/clone-template-pages";
import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
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
  apiPageKeys: (keyof NonNullable<FunnelByCampaignResponse["pages"]>)[];
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
    const fb = base.landing as LandingTemplatePage;
    const mapped = baseFromApi("landing", apiPages.landing, fb) as LandingTemplatePage;
    const landingApiDesign = apiPages.landing as {
      landingPageDesign?: string;
      pageDesign?: string;
    };
    mapped.landingDesign = normalizeLandingDesign(
      landingApiDesign.landingPageDesign ??
        landingApiDesign.pageDesign ??
        fb.landingDesign,
    );
    const landingApiHero = apiPages.landing as {
      heroImageDesign?: string;
      mediaDesign?: string;
    };
    mapped.heroDesign = normalizeHeroDesign(
      landingApiHero.heroImageDesign ??
        landingApiHero.mediaDesign ??
        fb.heroDesign,
    );
    const landingApiColors = apiPages.landing as {
      headlineColor?: string;
      subheadlineColor?: string;
      bodyColor?: string;
      ctaTextColor?: string;
    };
    mapped.headingColor = normalizeHexColor(
      landingApiColors.headlineColor ?? fb.headingColor,
    );
    mapped.subheadingColor = normalizeHexColor(
      landingApiColors.subheadlineColor ?? fb.subheadingColor,
    );
    mapped.bodyColor = normalizeHexColor(
      landingApiColors.bodyColor ?? fb.bodyColor,
    );
    mapped.buttonTextColor = normalizeHexColor(
      landingApiColors.ctaTextColor ?? fb.buttonTextColor,
    );
    const landingExtras = apiPages.landing as {
      contentSectionOrder?: LandingTemplatePage["contentSectionOrder"];
      pageTemplateId?: string;
      copyTemplateId?: string;
    };
    mapped.contentSectionOrder = normalizeLandingSectionOrder(
      landingExtras.contentSectionOrder ?? fb.contentSectionOrder,
    );
    if (landingExtras.pageTemplateId?.trim()) {
      mapped.pageTemplateId = landingExtras.pageTemplateId.trim();
    }
    if (landingExtras.copyTemplateId?.trim()) {
      mapped.copyTemplateId = landingExtras.copyTemplateId.trim();
    }
    base.landing = mapped;
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
    const paymentApi = apiPages.payment as CreateFunnelPaymentPagePayload & {
      checkoutTemplate?: string;
      showCoupon?: boolean;
      showPhoneField?: boolean;
      showAddressField?: boolean;
      showOrderSummary?: boolean;
      checkoutTheme?: Partial<PaymentTemplatePage["checkoutTheme"]>;
    };
    base.payment = normalizePaymentPage({
      ...mapped,
      ...(paymentApi.checkoutTemplate
        ? { checkoutTemplate: paymentApi.checkoutTemplate as PaymentTemplatePage["checkoutTemplate"] }
        : {}),
      ...(paymentApi.showCoupon !== undefined ? { showCoupon: paymentApi.showCoupon } : {}),
      ...(paymentApi.showPhoneField !== undefined
        ? { showPhoneField: paymentApi.showPhoneField }
        : {}),
      ...(paymentApi.showAddressField !== undefined
        ? { showAddressField: paymentApi.showAddressField }
        : {}),
      ...(paymentApi.showOrderSummary !== undefined
        ? { showOrderSummary: paymentApi.showOrderSummary }
        : {}),
      ...(paymentApi.checkoutTheme
        ? { checkoutTheme: paymentApi.checkoutTheme as PaymentTemplatePage["checkoutTheme"] }
        : {}),
    });
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

export function mergeApiPagesIntoTemplateState(
  base: TemplatePagesState,
  apiPages: NonNullable<FunnelByCampaignResponse["pages"]>,
): TemplatePagesState {
  const mapped = mapFunnelApiPagesToTemplateState(apiPages);
  const next: TemplatePagesState = {
    landing: base.landing,
    signup: base.signup,
    payment: base.payment,
    confirmation: base.confirmation,
  };

  if (apiPages.landing) {
    next.landing = mapped.landing;
  }
  if (apiPages.signup) {
    next.signup = mapped.signup as SignUpTemplatePage;
  }
  if (apiPages.payment) {
    next.payment = mapped.payment as PaymentTemplatePage;
  }
  if (apiPages.confirmation) {
    next.confirmation = mapped.confirmation;
  }

  if (apiPages.landing && next.landing.imageUrl) {
    const { imageUrl, imageScale } = next.landing;
    next.signup = { ...next.signup, imageUrl, imageScale };
    next.payment = { ...next.payment, imageUrl, imageScale };
  }

  return next;
}

const funnelIdByCampaignCache = new Map<number, number>();

type CampaignFunnelIdListener = (
  campaignId: number,
  funnelId: number | null,
) => void;

const campaignFunnelIdListeners = new Set<CampaignFunnelIdListener>();

function notifyCampaignFunnelId(
  campaignId: number,
  funnelId: number | null,
): void {
  for (const listener of campaignFunnelIdListeners) {
    listener(campaignId, funnelId);
  }
}

function readFunnelId(
  campaignId: number,
  remote: FunnelByCampaignResponse | null,
): number | null {
  const id = isPositiveInt(remote?.id) ? remote.id : null;
  if (id != null) {
    funnelIdByCampaignCache.set(campaignId, id);
    notifyCampaignFunnelId(campaignId, id);
  }
  return id;
}

export function peekCachedFunnelId(campaignId: number): number | null {
  const cached = funnelIdByCampaignCache.get(campaignId);
  return isPositiveInt(cached) ? cached : null;
}

export function subscribeCampaignFunnelId(
  campaignId: number,
  listener: (funnelId: number | null) => void,
): () => void {
  const wrapped: CampaignFunnelIdListener = (id, funnelId) => {
    if (id === campaignId) listener(funnelId);
  };
  campaignFunnelIdListeners.add(wrapped);
  listener(peekCachedFunnelId(campaignId));
  return () => {
    campaignFunnelIdListeners.delete(wrapped);
  };
}

export async function fetchFunnelSummaryByCampaignId(
  accessToken: string,
  campaignId: number,
): Promise<number | null> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(campaignId)) {
    throw new Error("Valid campaignId is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel/campaign/${encodeURIComponent(String(campaignId))}/summary`,
    {
      method: "GET",
      headers: {
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

  const data = (await res.json()) as { id?: number } | null;
  const funnelId = isPositiveInt(data?.id) ? data.id : null;
  if (funnelId != null) {
    readFunnelId(campaignId, { id: funnelId, campaignId });
  }
  return funnelId;
}

export type FunnelFetchResult =
  | FunnelByCampaignResponse
  | null
  | 'not-modified';

function funnelEtagStorageKey(campaignId: number): string {
  return `retention:funnel-etag:${campaignId}`;
}

function readStoredFunnelEtag(campaignId: number): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(funnelEtagStorageKey(campaignId));
}

function storeFunnelEtag(campaignId: number, etag: string | null): void {
  if (typeof sessionStorage === 'undefined' || !etag) return;
  sessionStorage.setItem(funnelEtagStorageKey(campaignId), etag);
}

export function clearStoredFunnelEtag(campaignId: number): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(funnelEtagStorageKey(campaignId));
  funnelFetchInflight.delete(campaignId);
}

const funnelFetchInflight = new Map<number, Promise<FunnelFetchResult>>();

async function fetchFunnelByCampaignIdOnce(
  accessToken: string,
  campaignId: number,
): Promise<FunnelFetchResult> {
  const cachedEtag = readStoredFunnelEtag(campaignId);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (cachedEtag) {
    headers["If-None-Match"] = cachedEtag;
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel/campaign/${encodeURIComponent(String(campaignId))}`,
    {
      method: "GET",
      headers,
    },
  );

  if (res.status === 304) {
    return "not-modified";
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not load funnel."));
  }

  storeFunnelEtag(campaignId, res.headers.get("ETag"));

  const text = await res.text();
  if (!text.trim()) {
    return null;
  }

  const data = JSON.parse(text) as FunnelByCampaignResponse | null;
  if (data == null || !isPositiveInt(data.id)) {
    return null;
  }

  readFunnelId(campaignId, data);
  return data;
}

export async function fetchFunnelByCampaignId(
  accessToken: string,
  campaignId: number,
): Promise<FunnelFetchResult> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(campaignId)) {
    throw new Error("Valid campaignId is required.");
  }

  const inflight = funnelFetchInflight.get(campaignId);
  if (inflight) {
    return inflight;
  }

  const request = fetchFunnelByCampaignIdOnce(accessToken, campaignId).finally(
    () => {
      if (funnelFetchInflight.get(campaignId) === request) {
        funnelFetchInflight.delete(campaignId);
      }
    },
  );

  funnelFetchInflight.set(campaignId, request);
  return request;
}

export async function loadTemplatePagesForCampaign(
  campaignId: number,
  accessToken: string,
  baseline?: TemplatePagesState | null,
): Promise<CampaignFunnelLoadResult> {
  const start = baseline ?? cloneTemplatePages();
  const remote = await fetchFunnelByCampaignId(accessToken, campaignId);
  const funnelId =
    remote === "not-modified"
      ? peekCachedFunnelId(campaignId)
      : readFunnelId(campaignId, remote);

  if (remote === "not-modified") {
    return {
      pages: start,
      funnelId,
      fromApi: false,
      apiPageKeys: [],
    };
  }

  const apiPageKeys = remote?.pages
    ? (Object.keys(remote.pages) as (keyof NonNullable<
        FunnelByCampaignResponse["pages"]
      >)[])
    : [];

  if (remote?.pages && apiPageKeys.length > 0) {
    return {
      pages: mergeApiPagesIntoTemplateState(start, remote.pages),
      funnelId,
      fromApi: true,
      apiPageKeys,
    };
  }

  return {
    pages: start,
    funnelId,
    fromApi: false,
    apiPageKeys: [],
  };
}
