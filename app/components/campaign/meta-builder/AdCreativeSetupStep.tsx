"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, ExternalLink, Loader2, Plus, Trash2, Video } from "lucide-react";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getMetaLandingUrl } from "@/app/lib/public-app-url";
import {
  CTA_OPTIONS,
} from "@/app/lib/meta-ad-creative-helpers";
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
  validateHttpsUrl,
  validateMetaImageUrl,
} from "@/app/lib/resolve-meta-image-url";
import { AdCreativePreview } from "@/app/components/campaign/meta-builder/AdCreativePreview";
import {
  BuilderCard,
  BuilderCollapsible,
  BuilderErrorAlert,
  BuilderField,
  BuilderFooter,
  BuilderRadioCard,
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
};

export function AdCreativeSetupStep({
  businessId,
  draftId,
  campaignData,
  adSetData,
  defaultWebsiteUrl,
  initialData,
  saving,
  error,
  onBack,
  onPrevious,
  onSave,
}: AdCreativeSetupStepProps) {
  const defaultDestination = getMetaLandingUrl(defaultWebsiteUrl);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [destinationMode, setDestinationMode] = useState<"website" | "instant">(
    "website",
  );
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
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [imageAltText, setImageAltText] = useState(initialData?.imageAltText ?? "");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl ?? "");
  const [carouselCards, setCarouselCards] = useState<CarouselCard[]>(
    initialData?.carouselCards ?? [
      emptyCarouselCard(defaultDestination),
      emptyCarouselCard(defaultDestination),
    ],
  );
  const [primaryText, setPrimaryText] = useState(initialData?.primaryText ?? "");
  const [headline, setHeadline] = useState(initialData?.headline ?? campaignData.name);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [displayLink, setDisplayLink] = useState(initialData?.displayLink ?? "");
  const [destinationUrl, setDestinationUrl] = useState(initialData?.destinationUrl ?? defaultDestination);
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

  const previewImage =
    creativeFormat === "SINGLE_IMAGE" && imageUrl.trim()
      ? imageUrl
      : creativeFormat === "CAROUSEL" && carouselCards[0]?.imageUrl?.trim()
        ? carouselCards[0].imageUrl
        : creativeFormat === "SINGLE_VIDEO" && thumbnailUrl.trim()
          ? thumbnailUrl
          : undefined;

  const showPreviews = Boolean(previewImage);

  const inputClass = builderInputClass;

  useEffect(() => {
    setPagesLoading(true);
    void getFacebookPages(businessId)
      .then((loaded) => {
        setPages(loaded);
        if (!initialData?.facebookPageId && loaded[0]?.id) {
          setFacebookPageId(loaded[0].id);
        }
      })
      .catch(() => setPages([]))
      .finally(() => setPagesLoading(false));
  }, [businessId, initialData?.facebookPageId]);

  useEffect(() => {
    setAdAccountsLoading(true);
    const token = getSetupAccessToken().trim();
    void (async () => {
      try {
        const accounts = await getFacebookAdAccounts(businessId);
        setAdAccounts(accounts);
        if (token) {
          const status = await getFacebookConnectionStatus(token, businessId);
          if (status.metaAdAccountId) {
            setSelectedAdAccountId(status.metaAdAccountId);
            return;
          }
        }
        if (accounts[0]?.id) {
          setSelectedAdAccountId(accounts[0].id);
        }
      } catch {
        setAdAccounts([]);
      } finally {
        setAdAccountsLoading(false);
      }
    })();
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

  const handleImageUpload = async (file: File | undefined, target: "main" | "thumb" | number) => {
    if (!file) return;
    setUploading(true);
    setLocalError(null);
    try {
      const { imageUrl: url } = await uploadFacebookCampaignImage(businessId, file);
      const resolved = resolveMetaImageUrl(url);
      if (target === "main") setImageUrl(resolved);
      else if (target === "thumb") setThumbnailUrl(resolved);
      else {
        setCarouselCards((prev) =>
          prev.map((card, i) => (i === target ? { ...card, imageUrl: resolved, mediaType: "image" } : card)),
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
      const { videoUrl: url } = await uploadFacebookCampaignVideo(businessId, file);
      setVideoUrl(url);
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
    if (!name.trim()) errors.name = "Ad name is required.";
    if (!facebookPageId.trim()) errors.facebookPageId = "Select the Facebook Page that will run this ad.";
    if (!primaryText.trim()) errors.primaryText = "Primary text is required.";

    if (creativeFormat === "SINGLE_IMAGE") {
      const resolved = resolveMetaImageUrl(imageUrl);
      const imgErr = validateMetaImageUrl(resolved);
      if (imgErr) errors.imageUrl = imgErr;
      if (!headline.trim()) errors.headline = "Headline is required.";
      if (destinationMode !== "website") {
        errors.destinationUrl = "Instant Experience is not supported yet. Choose Website.";
      }
      const destErr = validateHttpsUrl(destinationUrl, "Website URL");
      if (destErr) errors.destinationUrl = destErr;
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }

      await onSave({
        name: name.trim(),
        draftId,
        facebookPageId: facebookPageId.trim(),
        status,
        creativeFormat,
        imageUrl: resolved,
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
      if (!videoUrl.trim()) errors.videoUrl = "Upload a video for this ad.";
      if (!headline.trim()) errors.headline = "Headline is required.";
      if (destinationMode !== "website") {
        errors.destinationUrl = "Instant Experience is not supported yet. Choose Website.";
      }
      const destErr = validateHttpsUrl(destinationUrl, "Website URL");
      if (destErr) errors.destinationUrl = destErr;
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        return;
      }

      await onSave({
        name: name.trim(),
        draftId,
        facebookPageId: facebookPageId.trim(),
        status,
        creativeFormat,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
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

    if (carouselCards.length < 2) {
      setLocalError("Carousel requires at least 2 cards.");
      return;
    }
    for (const [i, card] of carouselCards.entries()) {
      if (!card.headline.trim()) {
        errors[`carousel_${i}_headline`] = `Card ${i + 1}: headline is required.`;
      }
      const destErr = validateHttpsUrl(card.destinationUrl, `Card ${i + 1} destination URL`);
      if (destErr) errors[`carousel_${i}_destination`] = destErr;
      if (!card.imageUrl?.trim() && !card.videoUrl?.trim()) {
        errors[`carousel_${i}_media`] = `Card ${i + 1}: upload an image or video.`;
      }
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      if (!errors.primaryText && !errors.name && !errors.facebookPageId) {
        setLocalError("Fix the highlighted carousel card fields below.");
      }
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
        title="Ad / Creative setup"
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
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-zinc-400" />
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
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
            <span className="text-sm font-medium text-zinc-600">
              {brandingEnabled ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => setBrandingEnabled((prev) => !prev)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              {brandingEnabled ? "Remove" : "Add branding"}
            </button>
          </div>
          {brandingEnabled ? (
            <div className="mt-3 space-y-3 rounded-xl border border-zinc-200 p-4">
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
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
            {videoUrl ? <p className="text-xs text-zinc-600 break-all">Video uploaded</p> : null}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => void handleVideoUpload(e.target.files?.[0])} />
            <BuilderField label="Ad video" required error={fieldErrors.videoUrl} hint="Short clips (under 60s) work best in feed and stories.">
              <button
                type="button"
                disabled={uploading}
                onClick={() => videoInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                {videoUrl ? "Replace video" : "Upload video"}
              </button>
            </BuilderField>
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e.target.files?.[0], "thumb")} />
            <button type="button" disabled={uploading} onClick={() => thumbInputRef.current?.click()} className="text-sm font-semibold text-[#1877F2] hover:underline">
              Upload thumbnail (optional)
            </button>
          </div>
        ) : null}

        {creativeFormat === "CAROUSEL" ? (
          <div className="space-y-4">
            {carouselCards.map((card, index) => (
              <div key={index} className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Card {index + 1}</p>
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
                <BuilderField label="Destination URL" required error={fieldErrors[`carousel_${index}_destination`]} hint="HTTPS link when someone taps this card.">
                  <input
                    value={card.destinationUrl}
                    onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, destinationUrl: e.target.value } : c))}
                    className={`${inputClass} ${fieldErrors[`carousel_${index}_destination`] ? builderInputErrorClass : ""}`}
                  />
                </BuilderField>
                <BuilderField label="Call-to-action">
                  <select value={card.callToAction} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, callToAction: e.target.value as MetaCallToAction } : c))} className={inputClass}>
                    {CTA_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </BuilderField>
              </div>
            ))}
            <button type="button" onClick={() => setCarouselCards((prev) => [...prev, emptyCarouselCard(defaultDestination)])} className="flex items-center gap-2 text-sm font-semibold text-[#1877F2] hover:underline">
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
        description="Tell us where to send people immediately after they tap or click your ad."
      >
        {creativeFormat === "CAROUSEL" ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600">
            Carousel ads use a destination URL on each card in the Media section above.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              <BuilderRadioCard
                name="creative-destination"
                selected={destinationMode === "instant"}
                title="Instant Experience"
                description="Send people to a fast-loading, mobile-optimised experience."
                onSelect={() => setDestinationMode("instant")}
              />
              <BuilderRadioCard
                name="creative-destination"
                selected={destinationMode === "website"}
                title="Website"
                description="Send people to your website."
                onSelect={() => setDestinationMode("website")}
              />
            </div>

            {destinationMode === "instant" ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Instant Experience is not available in Dealioo yet. Select <strong>Website</strong> to send people to your site.
              </p>
            ) : (
              <div className="space-y-4 border-t border-zinc-100 pt-4">
                <BuilderField
                  label="Website URL"
                  required
                  error={fieldErrors.destinationUrl}
                  hint="Must be HTTPS, your menu, offer page, or booking link."
                >
                  <div className="flex gap-2">
                    <input
                      required
                      type="url"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      className={`${inputClass} ${fieldErrors.destinationUrl ? builderInputErrorClass : ""}`}
                      placeholder="https://your-business.com/offer"
                    />
                    {destinationUrl.trim() ? (
                      <a
                        href={destinationUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-zinc-600 shadow-sm hover:bg-zinc-50"
                        aria-label="Open website URL"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </BuilderField>

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

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-zinc-800">Browser add-ons</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Optional overlays in the in-app browser, not configured for this draft.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </BuilderCard>

      <BuilderCard title="Advanced tracking" description="Optional UTM tags and Meta pixel settings.">
        <BuilderCollapsible title="Tracking & pixel" description="Only needed if you use Meta Pixel or custom UTM tags.">
          <div className="space-y-4">
            <BuilderField label="URL parameters (UTM)" hint="Appended to your website URL for analytics.">
              <input value={urlParameters} onChange={(e) => setUrlParameters(e.target.value)} placeholder="utm_source=facebook&utm_medium=paid" className={inputClass} />
            </BuilderField>
            <BuilderField label="Meta Pixel ID" hint="Only needed if you track conversions with Meta Pixel.">
              <input value={pixelId} onChange={(e) => setPixelId(e.target.value)} className={inputClass} />
            </BuilderField>
            <BuilderField label="Conversion event" hint="e.g. Purchase, Lead, matches your pixel setup.">
              <input value={conversionEvent} onChange={(e) => setConversionEvent(e.target.value)} className={inputClass} />
            </BuilderField>
          </div>
        </BuilderCollapsible>
      </BuilderCard>

      <BuilderCard title="Placement preview" description="See how your ad may look across Facebook and Instagram.">
        {showPreviews ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <AdCreativePreview placement="facebook_feed" primaryText={primaryText} headline={headline} description={description} imageUrl={previewImage} displayLink={displayLink} callToAction={callToAction} />
            <AdCreativePreview placement="instagram_feed" primaryText={primaryText} headline={headline} description={description} imageUrl={previewImage} displayLink={displayLink} callToAction={callToAction} />
            <AdCreativePreview placement="stories" primaryText={primaryText} headline={headline} imageUrl={previewImage} callToAction={callToAction} />
            <AdCreativePreview placement="reels" primaryText={primaryText} headline={headline} imageUrl={previewImage} callToAction={callToAction} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
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
