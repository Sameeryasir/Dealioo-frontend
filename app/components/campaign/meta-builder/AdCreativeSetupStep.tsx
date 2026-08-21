"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Video } from "lucide-react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  CTA_OPTIONS,
} from "@/app/lib/meta-ad-creative-helpers";
import {
  adCreativeTypedFieldsSchema,
  zodToUiErrors,
} from "@/app/lib/meta-campaign-builder-schemas";
import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
  CarouselCard,
  MetaCallToAction,
  MetaCampaignStatus,
  MetaCreativeFormat,
} from "@/app/lib/meta-campaign-builder-types";
import {
  resolveMetaImageUrl,
  validateMetaImageUrl,
} from "@/app/lib/resolve-meta-image-url";
import { AdCreativePreview } from "@/app/components/campaign/meta-builder/AdCreativePreview";
import { MetaDestinationFunnelPicker } from "@/app/components/campaign/meta-builder/MetaDestinationFunnelPicker";
import {
  BuilderCard,
  BuilderErrorAlert,
  BuilderField,
  BuilderFooter,
  BuilderStatusToggle,
  BuilderStepHeader,
  builderInputClass,
  builderInputErrorClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import { getFacebookPages } from "@/app/services/facebook/get-facebook-pages";
import {
  getFacebookAdAccounts,
  type FacebookAdAccount,
} from "@/app/services/facebook/get-facebook-ad-accounts";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { setFacebookAdAccount } from "@/app/services/facebook/set-facebook-ad-account";
import { uploadFacebookCampaignImage } from "@/app/services/facebook/upload-facebook-campaign-image";
import { uploadFacebookCampaignVideo } from "@/app/services/facebook/upload-facebook-campaign-video";

function emptyCarouselCard(destination: string): CarouselCard {
  return {
    mediaType: "image",
    headline: "",
    description: "",
    destinationUrl: destination,
    callToAction: "LEARN_MORE",
  };
}

function adAccountLabel(account: FacebookAdAccount): string {
  return account.name?.trim() || account.accountId || account.id;
}

type AdCreativeSetupStepProps = {
  businessId: number;
  draftId: string;
  campaignData: CampaignStepData;
  adSetData: AdSetStepData;
  defaultWebsiteUrl?: string;
  initialData?: AdCreativeStepData | null;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onPrevious: () => void;
  onSave: (data: AdCreativeStepData) => void | Promise<void>;
  onWorkingChange?: (data: AdCreativeStepData) => void;
};

function mediaUrlFromDraft(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return resolveMetaImageUrl(trimmed) || trimmed;
}

export function AdCreativeSetupStep({
  businessId,
  draftId,
  campaignData,
  adSetData,
  defaultWebsiteUrl: _defaultWebsiteUrl,
  initialData,
  saving,
  error,
  onBack,
  onPrevious,
  onSave,
  onWorkingChange,
}: AdCreativeSetupStepProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const hydratedMediaRef = useRef<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? `${campaignData.name} Ad`);
  const [facebookPageId, setFacebookPageId] = useState(initialData?.facebookPageId ?? "");
  const [instagramProfileMode, setInstagramProfileMode] = useState<
    "facebook_page" | "custom"
  >(initialData?.instagramActorId?.trim() ? "custom" : "facebook_page");
  const [instagramActorId, setInstagramActorId] = useState(
    initialData?.instagramActorId ?? "",
  );
  const [showInstagramConnect, setShowInstagramConnect] = useState(
    Boolean(initialData?.instagramActorId?.trim()),
  );
  const [brandingEnabled, setBrandingEnabled] = useState(
    initialData?.brandingEnabled ?? false,
  );
  const [brandName, setBrandName] = useState(initialData?.brandName ?? "");
  const [brandLogoUrl, setBrandLogoUrl] = useState(initialData?.brandLogoUrl ?? "");
  const [status, setStatus] = useState<MetaCampaignStatus>(initialData?.status ?? "PAUSED");
  const [creativeFormat, setCreativeFormat] = useState<MetaCreativeFormat>(
    initialData?.creativeFormat ?? "SINGLE_IMAGE",
  );
  const [imageUrl, setImageUrl] = useState(
    () => mediaUrlFromDraft(initialData?.imageUrl),
  );
  const [imageAltText, setImageAltText] = useState(initialData?.imageAltText ?? "");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    () => mediaUrlFromDraft(initialData?.thumbnailUrl),
  );
  const [carouselCards, setCarouselCards] = useState<CarouselCard[]>(
    initialData?.carouselCards ?? [
      emptyCarouselCard(""),
      emptyCarouselCard(""),
    ],
  );
  const [primaryText, setPrimaryText] = useState(initialData?.primaryText ?? "");
  const [headline, setHeadline] = useState(initialData?.headline ?? campaignData.name);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [displayLink, setDisplayLink] = useState(initialData?.displayLink ?? "");
  const [destinationUrl, setDestinationUrl] = useState(
    initialData?.destinationUrl ?? "",
  );
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);
  const [urlParameters, setUrlParameters] = useState(initialData?.urlParameters ?? "");
  const [callToAction, setCallToAction] = useState<MetaCallToAction>(initialData?.callToAction ?? "GET_OFFER");
  const [pixelId, setPixelId] = useState(initialData?.pixelId ?? "");
  const [conversionEvent, setConversionEvent] = useState(initialData?.conversionEvent ?? "");

  const [pages, setPages] = useState<Array<{ id: string; name: string | null }>>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([]);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState("");
  const [adAccountsLoading, setAdAccountsLoading] = useState(true);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const applyDestinationFromFunnel = useCallback(
    (payload: {
      funnelId: number;
      funnelName: string;
      destinationUrl: string;
    }) => {
      const nextUrl = payload.destinationUrl.trim();
      setSelectedFunnelId(payload.funnelId);
      setDestinationUrl(nextUrl);
      setDisplayLink((prev) => {
        if (prev.trim()) return prev;
        return payload.funnelName.trim() || prev;
      });
      setCarouselCards((prev) =>
        prev.map((card) => ({
          ...card,
          destinationUrl: nextUrl || card.destinationUrl,
        })),
      );
      setFieldErrors((prev) => {
        if (!prev.destinationUrl && !Object.keys(prev).some((k) => k.includes("_destination"))) {
          return prev;
        }
        const next = { ...prev };
        delete next.destinationUrl;
        for (const key of Object.keys(next)) {
          if (key.endsWith("_destination")) delete next[key];
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (creativeFormat !== "CAROUSEL") return;
    const url = destinationUrl.trim();
    if (!url) return;
    setCarouselCards((prev) => {
      if (prev.every((card) => card.destinationUrl.trim() === url)) return prev;
      return prev.map((card) => ({ ...card, destinationUrl: url }));
    });
  }, [creativeFormat, destinationUrl]);

  const previewImage =
    creativeFormat === "SINGLE_IMAGE" && imageUrl.trim()
      ? imageUrl
      : creativeFormat === "CAROUSEL" && carouselCards[0]?.imageUrl?.trim()
        ? carouselCards[0].imageUrl
        : creativeFormat === "SINGLE_VIDEO" && thumbnailUrl.trim()
          ? thumbnailUrl
          : undefined;

  const previewVideo =
    creativeFormat === "SINGLE_VIDEO" && videoUrl.trim()
      ? videoUrl
      : undefined;

  const showPreviews = Boolean(previewImage || previewVideo);

  const inputClass = builderInputClass;

  useEffect(() => {
    if (!initialData) return;

    const mediaKey = [
      initialData.imageUrl ?? "",
      initialData.videoUrl ?? "",
      initialData.thumbnailUrl ?? "",
      JSON.stringify(initialData.carouselCards ?? null),
    ].join("|");

    if (hydratedMediaRef.current === mediaKey) return;
    hydratedMediaRef.current = mediaKey;

    if (initialData.name?.trim()) setName(initialData.name);
    if (initialData.facebookPageId?.trim()) {
      setFacebookPageId(initialData.facebookPageId);
    }
    if (initialData.creativeFormat) setCreativeFormat(initialData.creativeFormat);
    if (initialData.primaryText != null) setPrimaryText(initialData.primaryText);
    if (initialData.headline != null) setHeadline(initialData.headline);
    if (initialData.description != null) setDescription(initialData.description);
    if (initialData.displayLink != null) setDisplayLink(initialData.displayLink);
    if (initialData.destinationUrl != null) {
      setDestinationUrl(initialData.destinationUrl);
    }
    if (initialData.callToAction) setCallToAction(initialData.callToAction);
    if (initialData.status) setStatus(initialData.status);
    if (initialData.imageAltText != null) setImageAltText(initialData.imageAltText);
    if (initialData.urlParameters != null) setUrlParameters(initialData.urlParameters);
    if (initialData.pixelId != null) setPixelId(initialData.pixelId);
    if (initialData.conversionEvent != null) {
      setConversionEvent(initialData.conversionEvent);
    }
    if (initialData.instagramActorId?.trim()) {
      setInstagramActorId(initialData.instagramActorId);
      setInstagramProfileMode("custom");
      setShowInstagramConnect(true);
    }
    if (initialData.brandingEnabled != null) {
      setBrandingEnabled(initialData.brandingEnabled);
    }
    if (initialData.brandName != null) setBrandName(initialData.brandName);
    if (initialData.brandLogoUrl != null) setBrandLogoUrl(initialData.brandLogoUrl);

    const nextImage = mediaUrlFromDraft(initialData.imageUrl);
    if (nextImage) setImageUrl(nextImage);

    if (initialData.videoUrl?.trim()) setVideoUrl(initialData.videoUrl.trim());

    const nextThumb = mediaUrlFromDraft(initialData.thumbnailUrl);
    if (nextThumb) setThumbnailUrl(nextThumb);

    if (initialData.carouselCards?.length) {
      setCarouselCards(
        initialData.carouselCards.map((card) => ({
          ...card,
          imageUrl: mediaUrlFromDraft(card.imageUrl) || card.imageUrl,
        })),
      );
    }
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;
    setPagesLoading(true);
    void getFacebookPages(businessId)
      .then((loaded) => {
        if (cancelled) return;
        setPages(loaded);
        setFacebookPageId((current) => {
          if (current.trim()) return current;
          if (initialData?.facebookPageId?.trim()) {
            return initialData.facebookPageId;
          }
          return loaded[0]?.id ?? "";
        });
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      })
      .finally(() => {
        if (!cancelled) setPagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    setAdAccountsLoading(true);
    const token = getSetupAccessToken().trim();
    void (async () => {
      try {
        const accounts = await getFacebookAdAccounts(businessId);
        if (cancelled) return;
        setAdAccounts(accounts);
        if (token) {
          const status = await getFacebookConnectionStatus(token, businessId);
          if (cancelled) return;
          if (status.metaAdAccountId) {
            setSelectedAdAccountId(status.metaAdAccountId);
            return;
          }
        }
        if (accounts[0]?.id) {
          setSelectedAdAccountId(accounts[0].id);
        }
      } catch {
        if (!cancelled) setAdAccounts([]);
      } finally {
        if (!cancelled) setAdAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const selectedAdAccount = adAccounts.find((a) => a.id === selectedAdAccountId);

  const handleAdAccountChange = async (nextId: string) => {
    if (!nextId || nextId === selectedAdAccountId) return;
    setSwitchingAccount(true);
    setLocalError(null);
    try {
      await setFacebookAdAccount(businessId, nextId);
      setSelectedAdAccountId(nextId);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not switch ad account.",
      );
    } finally {
      setSwitchingAccount(false);
    }
  };

  const buildCreativeExtras = () => ({
    instagramActorId:
      instagramProfileMode === "custom" && instagramActorId.trim()
        ? instagramActorId.trim()
        : undefined,
    ...(brandingEnabled
      ? {
          brandingEnabled: true,
          brandName: brandName.trim() || undefined,
          brandLogoUrl: brandLogoUrl.trim() || undefined,
        }
      : {}),
  });

  const buildWorkingSnapshot = (
    overrides?: Partial<AdCreativeStepData>,
  ): AdCreativeStepData => ({
    name: name.trim() || `${campaignData.name} Ad`,
    draftId,
    facebookPageId: facebookPageId.trim(),
    status,
    creativeFormat,
    imageUrl: imageUrl.trim() || undefined,
    imageAltText: imageAltText.trim() || undefined,
    videoUrl: videoUrl.trim() || undefined,
    thumbnailUrl: thumbnailUrl.trim() || undefined,
    carouselCards,
    primaryText: primaryText.trim(),
    headline: headline.trim() || undefined,
    description: description.trim() || undefined,
    displayLink: displayLink.trim() || undefined,
    destinationUrl: destinationUrl.trim() || undefined,
    urlParameters: urlParameters.trim() || undefined,
    callToAction,
    pixelId: pixelId.trim() || undefined,
    conversionEvent: conversionEvent.trim() || undefined,
    ...buildCreativeExtras(),
    ...overrides,
  });

  useEffect(() => {
    if (!onWorkingChange) return;
    const hasMedia =
      Boolean(imageUrl.trim()) ||
      Boolean(videoUrl.trim()) ||
      Boolean(thumbnailUrl.trim()) ||
      carouselCards.some(
        (card) => Boolean(card.imageUrl?.trim()) || Boolean(card.videoUrl?.trim()),
      );
    if (!hasMedia && !initialData) return;
    onWorkingChange(buildWorkingSnapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageUrl,
    videoUrl,
    thumbnailUrl,
    carouselCards,
    name,
    facebookPageId,
    creativeFormat,
    primaryText,
    headline,
    destinationUrl,
    callToAction,
    status,
  ]);

  const handleImageUpload = async (file: File | undefined, target: "main" | "thumb" | number) => {
    if (!file) return;
    setUploading(true);
    setLocalError(null);
    try {
      const { imageUrl: url } = await uploadFacebookCampaignImage(
        businessId,
        file,
        { draftId },
      );
      const resolved = resolveMetaImageUrl(url) || url;
      if (target === "main") {
        setImageUrl(resolved);
        onWorkingChange?.(buildWorkingSnapshot({ imageUrl: resolved }));
      } else if (target === "thumb") {
        setThumbnailUrl(resolved);
        onWorkingChange?.(buildWorkingSnapshot({ thumbnailUrl: resolved }));
      } else {
        const nextCards = carouselCards.map((card, i) =>
          i === target
            ? { ...card, imageUrl: resolved, mediaType: "image" as const }
            : card,
        );
        setCarouselCards(nextCards);
        onWorkingChange?.(
          buildWorkingSnapshot({ carouselCards: nextCards, imageUrl: resolved }),
        );
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setLocalError(null);
    try {
      const { videoUrl: url } = await uploadFacebookCampaignVideo(
        businessId,
        file,
        { draftId },
      );
      setVideoUrl(url);
      onWorkingChange?.(buildWorkingSnapshot({ videoUrl: url }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not upload video.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!facebookPageId.trim()) {
      errors.facebookPageId = "Select the Facebook Page that will run this ad.";
    }

    const typed = adCreativeTypedFieldsSchema.safeParse({
      name,
      primaryText,
      headline,
      description,
      displayLink,
      destinationUrl,
      urlParameters,
      imageUrl,
      imageAltText,
      videoUrl,
      pixelId,
      conversionEvent,
      brandName,
      creativeFormat,
      carouselCards: carouselCards.map((card) => ({
        headline: card.headline,
        description: card.description,
        destinationUrl: card.destinationUrl,
      })),
    });

    if (!typed.success) {
      const ui = zodToUiErrors(typed.error);
      Object.assign(errors, ui.fieldErrors);
      if (ui.formError) setLocalError(ui.formError);
    }

    if (creativeFormat === "SINGLE_VIDEO") {
      if (!thumbnailUrl.trim()) {
        errors.thumbnailUrl = "Upload a thumbnail image for this video ad.";
      } else {
        const thumbErr = validateMetaImageUrl(resolveMetaImageUrl(thumbnailUrl));
        if (thumbErr) errors.thumbnailUrl = thumbErr;
      }
    }

    if (creativeFormat === "CAROUSEL") {
      if (carouselCards.length < 2) {
        setLocalError("Carousel requires at least 2 cards.");
        setFieldErrors(errors);
        return;
      }
      for (const [i, card] of carouselCards.entries()) {
        if (!card.imageUrl?.trim() && !card.videoUrl?.trim()) {
          errors[`carousel_${i}_media`] = `Card ${i + 1}: upload an image or video.`;
        }
      }
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      if (
        creativeFormat === "CAROUSEL" &&
        !errors.primaryText &&
        !errors.name &&
        !errors.facebookPageId
      ) {
        setLocalError((prev) => prev ?? "Fix the highlighted carousel card fields below.");
      }
      return;
    }

    if (creativeFormat === "SINGLE_IMAGE") {
      await onSave({
        name: name.trim(),
        draftId,
        facebookPageId: facebookPageId.trim(),
        status,
        creativeFormat,
        imageUrl: resolveMetaImageUrl(imageUrl),
        imageAltText: imageAltText.trim() || undefined,
        primaryText: primaryText.trim(),
        headline: headline.trim(),
        description: description.trim() || undefined,
        displayLink: displayLink.trim() || undefined,
        destinationUrl: destinationUrl.trim(),
        urlParameters: urlParameters.trim() || undefined,
        callToAction,
        pixelId: pixelId.trim() || undefined,
        conversionEvent: conversionEvent.trim() || undefined,
        ...buildCreativeExtras(),
      });
      return;
    }

    if (creativeFormat === "SINGLE_VIDEO") {
      await onSave({
        name: name.trim(),
        draftId,
        facebookPageId: facebookPageId.trim(),
        status,
        creativeFormat,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: resolveMetaImageUrl(thumbnailUrl),
        primaryText: primaryText.trim(),
        headline: headline.trim(),
        description: description.trim() || undefined,
        displayLink: displayLink.trim() || undefined,
        destinationUrl: destinationUrl.trim(),
        urlParameters: urlParameters.trim() || undefined,
        callToAction,
        pixelId: pixelId.trim() || undefined,
        conversionEvent: conversionEvent.trim() || undefined,
        ...buildCreativeExtras(),
      });
      return;
    }

    await onSave({
      name: name.trim(),
      draftId,
      facebookPageId: facebookPageId.trim(),
      status,
      creativeFormat,
      carouselCards,
      primaryText: primaryText.trim(),
      urlParameters: urlParameters.trim() || undefined,
      pixelId: pixelId.trim() || undefined,
      conversionEvent: conversionEvent.trim() || undefined,
      ...buildCreativeExtras(),
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 pb-2">
      <BuilderStepHeader
        step={3}
        title="Ad setup"
        description="Build what people see, image, video, copy, and link. Saved as draft until you publish on Step 4."
        badge="Draft only"
      />

      <BuilderCard
        title="Account & identity"
        description="Choose the Meta ad account, page, and how your ad appears on Instagram."
      >
        <BuilderField
          label="Ad account"
          hint="Campaigns are billed to this Meta ad account."
        >
          <div className="relative">
            {selectedAdAccount ? (
              <span
                className="pointer-events-none absolute left-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#1877f2] text-[11px] font-bold text-white"
                aria-hidden
              >
                {adAccountLabel(selectedAdAccount).charAt(0).toUpperCase()}
              </span>
            ) : null}
            <select
              value={selectedAdAccountId}
              onChange={(e) => void handleAdAccountChange(e.target.value)}
              disabled={adAccountsLoading || switchingAccount || adAccounts.length === 0}
              className={`${inputClass} ${selectedAdAccount ? "pl-11" : ""}`}
            >
              {adAccounts.length === 0 ? (
                <option value="">
                  {adAccountsLoading ? "Loading accounts…" : "No ad accounts"}
                </option>
              ) : (
                adAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {adAccountLabel(account)}
                  </option>
                ))
              )}
            </select>
            {switchingAccount ? (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
            ) : null}
          </div>
        </BuilderField>

        <BuilderField label="Ad name" required error={fieldErrors.name}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} ${fieldErrors.name ? builderInputErrorClass : ""}`}
            placeholder="Internal name for this ad"
          />
        </BuilderField>

        <BuilderField
          label="Facebook Page"
          required
          error={fieldErrors.facebookPageId}
          hint="The page that represents your business in the ad."
        >
          <select
            required
            value={facebookPageId}
            onChange={(e) => setFacebookPageId(e.target.value)}
            disabled={pagesLoading}
            className={`${inputClass} ${fieldErrors.facebookPageId ? builderInputErrorClass : ""}`}
          >
            {pages.length === 0 ? (
              <option value="">{pagesLoading ? "Loading…" : "No pages"}</option>
            ) : (
              pages.map((p) => (
                <option key={p.id} value={p.id}>{p.name ?? p.id}</option>
              ))
            )}
          </select>
        </BuilderField>

        <BuilderField
          label="Instagram profile"
          hint="By default, Instagram uses the linked Facebook Page. Use a custom account only if you manage a separate Instagram business profile."
        >
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={instagramProfileMode}
              onChange={(e) => {
                const mode = e.target.value as "facebook_page" | "custom";
                setInstagramProfileMode(mode);
                if (mode === "facebook_page") {
                  setShowInstagramConnect(false);
                  setInstagramActorId("");
                }
              }}
              className={inputClass}
            >
              <option value="facebook_page">Use Facebook Page</option>
              <option value="custom">Custom Instagram account</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setInstagramProfileMode("custom");
                setShowInstagramConnect(true);
              }}
              className="rounded-xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm font-semibold text-[#07111f] shadow-sm hover:bg-[#f4f8ff]"
            >
              Connect profile
            </button>
          </div>
          {showInstagramConnect || instagramProfileMode === "custom" ? (
            <input
              value={instagramActorId}
              onChange={(e) => setInstagramActorId(e.target.value)}
              placeholder="Instagram account ID from Meta Business Suite"
              className={`${inputClass} mt-2`}
            />
          ) : null}
        </BuilderField>

        <BuilderField
          label="Branding"
          hint="Optional business name and logo stored on this draft."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/60 px-4 py-3">
            <span className="text-sm font-medium text-slate-500">
              {brandingEnabled ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => setBrandingEnabled((prev) => !prev)}
              className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-semibold text-[#07111f] hover:bg-[#f4f8ff]"
            >
              {brandingEnabled ? "Remove" : "Add branding"}
            </button>
          </div>
          {brandingEnabled ? (
            <div className="mt-3 space-y-3 rounded-xl border border-[#e8edf5] p-4">
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Business name"
                className={inputClass}
              />
              <input
                value={brandLogoUrl}
                onChange={(e) => setBrandLogoUrl(e.target.value)}
                placeholder="Logo URL (https://…)"
                className={inputClass}
              />
            </div>
          ) : null}
        </BuilderField>

        <BuilderField label="Ad status" hint="Paused is recommended until you review in Ads Manager.">
          <BuilderStatusToggle
            value={status}
            onChange={(v) => setStatus(v as MetaCampaignStatus)}
            options={[
              { value: "PAUSED", label: "Paused", hint: "Recommended" },
              { value: "ACTIVE", label: "Active", hint: "Runs when published" },
            ]}
          />
        </BuilderField>
      </BuilderCard>

      <BuilderCard title="Creative format" description="Pick how your ad will look in feed and stories.">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["SINGLE_IMAGE", "Single image"],
              ["SINGLE_VIDEO", "Single video"],
              ["CAROUSEL", "Carousel"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCreativeFormat(value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                creativeFormat === value
                  ? "bg-[#1877f2] text-white shadow-[0_4px_14px_rgba(24,119,242,0.32)]"
                  : "border border-[#e8edf5] bg-white text-slate-600 hover:bg-[#f4f8ff] hover:text-[#1877f2]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </BuilderCard>

      <BuilderCard title="Media" description="Upload the image or video people will see in your ad.">

        {creativeFormat === "SINGLE_IMAGE" ? (
          <div className="space-y-3">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={imageAltText || "Preview"} className="max-h-48 rounded-lg object-contain" />
            ) : null}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e.target.files?.[0], "main")} />
            <BuilderField label="Ad image" required error={fieldErrors.imageUrl} hint="Use a high-quality photo of your food, venue, or offer. HTTPS required.">
              <button
                type="button"
                disabled={uploading}
                onClick={() => imageInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-4 py-3 text-sm font-semibold text-[#07111f] shadow-sm hover:bg-[#f4f8ff] disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                {imageUrl ? "Replace image" : "Upload image"}
              </button>
            </BuilderField>
            <BuilderField label="Alt text" hint="Describes the image for accessibility. Optional but recommended.">
              <input value={imageAltText} onChange={(e) => setImageAltText(e.target.value)} className={inputClass} />
            </BuilderField>
          </div>
        ) : null}

        {creativeFormat === "SINGLE_VIDEO" ? (
          <div className="space-y-3">
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => void handleVideoUpload(e.target.files?.[0])} />
            <BuilderField label="Ad video" required error={fieldErrors.videoUrl} hint="Short clips (under 60s) work best in feed and stories.">
              {videoUrl ? (
                <div className="mb-3 overflow-hidden rounded-xl border border-[#e8edf5] bg-[#07111f]">
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    poster={thumbnailUrl.trim() || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : null}
              <button
                type="button"
                disabled={uploading}
                onClick={() => videoInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-4 py-3 text-sm font-semibold text-[#07111f] shadow-sm hover:bg-[#f4f8ff] disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                {videoUrl ? "Replace video" : "Upload video"}
              </button>
            </BuilderField>
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e.target.files?.[0], "thumb")} />
            <BuilderField
              label="Video thumbnail"
              required
              error={fieldErrors.thumbnailUrl}
              hint="Meta requires a thumbnail image for video ads."
            >
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailUrl} alt="" className="mb-2 max-h-24 rounded object-contain" />
              ) : null}
              <button
                type="button"
                disabled={uploading}
                onClick={() => thumbInputRef.current?.click()}
                className="text-sm font-semibold text-[#1877F2] hover:underline"
              >
                {thumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
              </button>
            </BuilderField>
          </div>
        ) : null}

        {creativeFormat === "CAROUSEL" ? (
          <div className="space-y-4">
            {carouselCards.map((card, index) => (
              <div key={index} className="rounded-xl border border-[#e8edf5] bg-[#f4f8ff]/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#07111f]">Card {index + 1}</p>
                  {carouselCards.length > 2 ? (
                    <button type="button" onClick={() => setCarouselCards((prev) => prev.filter((_, i) => i !== index))} className="text-red-600 hover:text-red-700" aria-label={`Remove card ${index + 1}`}>
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imageUrl} alt="" className="max-h-24 rounded object-contain" />
                ) : null}
                <BuilderField label="Image" required error={fieldErrors[`carousel_${index}_media`]}>
                  <input type="file" accept="image/*" className="text-xs" onChange={(e) => void handleImageUpload(e.target.files?.[0], index)} />
                </BuilderField>
                <BuilderField label="Headline" required error={fieldErrors[`carousel_${index}_headline`]}>
                  <input
                    value={card.headline}
                    onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, headline: e.target.value } : c))}
                    className={`${inputClass} ${fieldErrors[`carousel_${index}_headline`] ? builderInputErrorClass : ""}`}
                  />
                </BuilderField>
                <BuilderField label="Description">
                  <input value={card.description ?? ""} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, description: e.target.value } : c))} className={inputClass} />
                </BuilderField>
                <BuilderField label="Call-to-action">
                  <select value={card.callToAction} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, callToAction: e.target.value as MetaCallToAction } : c))} className={inputClass}>
                    {CTA_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </BuilderField>
              </div>
            ))}
            <button type="button" onClick={() => setCarouselCards((prev) => [...prev, emptyCarouselCard(destinationUrl.trim())])} className="flex items-center gap-2 text-sm font-semibold text-[#1877F2] hover:underline">
              <Plus className="size-4" /> Add card
            </button>
          </div>
        ) : null}
      </BuilderCard>

      <BuilderCard title="Ad copy" description="Write the message people see with your image or video.">
        <BuilderField label="Primary text" required error={fieldErrors.primaryText} hint="The main message above your image or video.">
          <textarea
            required
            rows={3}
            value={primaryText}
            onChange={(e) => setPrimaryText(e.target.value)}
            className={`${inputClass} ${fieldErrors.primaryText ? builderInputErrorClass : ""}`}
          />
        </BuilderField>
        {creativeFormat !== "CAROUSEL" ? (
          <>
            <BuilderField label="Headline" required error={fieldErrors.headline}>
              <input
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={`${inputClass} ${fieldErrors.headline ? builderInputErrorClass : ""}`}
              />
            </BuilderField>
            <BuilderField label="Description" hint="Optional supporting line under the headline.">
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </BuilderField>
            <BuilderField label="Call-to-action button">
              <select value={callToAction} onChange={(e) => setCallToAction(e.target.value as MetaCallToAction)} className={inputClass}>
                {CTA_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </BuilderField>
          </>
        ) : null}
      </BuilderCard>

      <BuilderCard
        title="Destination"
        description="Pick a published Dealioo campaign. We fill the destination link automatically."
      >
        <div className="space-y-4">
          <MetaDestinationFunnelPicker
            businessId={businessId}
            selectedFunnelId={selectedFunnelId}
            destinationUrl={destinationUrl}
            error={
              fieldErrors.destinationUrl ||
              Object.entries(fieldErrors).find(([key]) =>
                key.endsWith("_destination"),
              )?.[1]
            }
            onSelect={applyDestinationFromFunnel}
          />

          <BuilderField
            label="Display link"
            hint="Optional short link text shown in the ad (e.g. yourbusiness.com)."
          >
            <input
              value={displayLink}
              onChange={(e) => setDisplayLink(e.target.value)}
              placeholder="yourbusiness.com"
              className={inputClass}
            />
          </BuilderField>
        </div>
      </BuilderCard>

      <BuilderCard title="Placement preview" description="See how your ad may look across Facebook and Instagram.">
        {showPreviews ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <AdCreativePreview placement="facebook_feed" primaryText={primaryText} headline={headline} description={description} imageUrl={previewImage} videoUrl={previewVideo} displayLink={displayLink} callToAction={callToAction} />
            <AdCreativePreview placement="instagram_feed" primaryText={primaryText} headline={headline} description={description} imageUrl={previewImage} videoUrl={previewVideo} displayLink={displayLink} callToAction={callToAction} />
            <AdCreativePreview placement="stories" primaryText={primaryText} headline={headline} imageUrl={previewImage} videoUrl={previewVideo} callToAction={callToAction} />
            <AdCreativePreview placement="reels" primaryText={primaryText} headline={headline} imageUrl={previewImage} videoUrl={previewVideo} callToAction={callToAction} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Upload an image or video above to preview placements here.
          </p>
        )}
      </BuilderCard>

      {localError || error ? (
        <BuilderErrorAlert message={localError ?? error ?? ""} />
      ) : null}

      <BuilderFooter
        onBack={onBack}
        secondaryLabel="Back"
        onSecondary={onPrevious}
        primaryLabel={saving ? "Saving draft…" : "Save & continue to Review"}
        primaryLoading={saving || uploading}
        primaryDisabled={saving || uploading}
        primaryDisabledReason={
          saving || uploading ? "Please wait while your creative is saved." : undefined
        }
      />
    </form>
  );
}
