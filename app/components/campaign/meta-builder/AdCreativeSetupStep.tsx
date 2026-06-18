"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, Video } from "lucide-react";
import { getPublicAppUrl } from "@/app/lib/public-app-url";
import {
  CTA_OPTIONS,
  hasInstagramPlacements,
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
  validateMetaImageUrl,
} from "@/app/lib/resolve-meta-image-url";
import { AdCreativePreview } from "@/app/components/campaign/meta-builder/AdCreativePreview";
import {
  BuilderErrorAlert,
  BuilderFooter,
  BuilderSectionTitle,
  BuilderStepHeader,
  builderInputClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import { getFacebookPages } from "@/app/services/facebook/get-facebook-pages";
import { uploadFacebookCampaignImage } from "@/app/services/facebook/upload-facebook-campaign-image";
import { uploadFacebookCampaignVideo } from "@/app/services/facebook/upload-facebook-campaign-video";

const sectionCardClass =
  "space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]";

function emptyCarouselCard(destination: string): CarouselCard {
  return {
    mediaType: "image",
    headline: "",
    description: "",
    destinationUrl: destination,
    callToAction: "LEARN_MORE",
  };
}

type AdCreativeSetupStepProps = {
  restaurantId: number;
  draftId: string;
  campaignData: CampaignStepData;
  adSetData: AdSetStepData;
  initialData?: AdCreativeStepData | null;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onPrevious: () => void;
  onSave: (data: AdCreativeStepData) => void | Promise<void>;
};

export function AdCreativeSetupStep({
  restaurantId,
  draftId,
  campaignData,
  adSetData,
  initialData,
  saving,
  error,
  onBack,
  onPrevious,
  onSave,
}: AdCreativeSetupStepProps) {
  const defaultDestination = getPublicAppUrl();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name ?? `${campaignData.name} Ad`);
  const [facebookPageId, setFacebookPageId] = useState(initialData?.facebookPageId ?? "");
  const [instagramActorId, setInstagramActorId] = useState(initialData?.instagramActorId ?? "");
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
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const instagramRequired = useMemo(
    () => hasInstagramPlacements(adSetData.placements),
    [adSetData.placements],
  );

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
    void getFacebookPages(restaurantId)
      .then((loaded) => {
        setPages(loaded);
        if (!initialData?.facebookPageId && loaded[0]?.id) {
          setFacebookPageId(loaded[0].id);
        }
      })
      .catch(() => setPages([]))
      .finally(() => setPagesLoading(false));
  }, [restaurantId, initialData?.facebookPageId]);

  const handleImageUpload = async (file: File | undefined, target: "main" | "thumb" | number) => {
    if (!file) return;
    setUploading(true);
    setLocalError(null);
    try {
      const { imageUrl: url } = await uploadFacebookCampaignImage(restaurantId, file);
      if (target === "main") setImageUrl(url);
      else if (target === "thumb") setThumbnailUrl(url);
      else {
        setCarouselCards((prev) =>
          prev.map((card, i) => (i === target ? { ...card, imageUrl: url, mediaType: "image" } : card)),
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
      const { videoUrl: url } = await uploadFacebookCampaignVideo(restaurantId, file);
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

    if (!name.trim()) return setLocalError("Ad name is required.");
    if (!facebookPageId.trim()) return setLocalError("Facebook Page is required.");
    if (!primaryText.trim()) return setLocalError("Primary text is required.");

    if (instagramRequired && !instagramActorId.trim()) {
      return setLocalError(
        "Instagram placements are enabled. Select an Instagram account or change placements on Step 2.",
      );
    }

    if (creativeFormat === "SINGLE_IMAGE") {
      const resolved = resolveMetaImageUrl(imageUrl);
      const imgErr = validateMetaImageUrl(resolved);
      if (imgErr) return setLocalError(imgErr);
      if (!headline.trim()) return setLocalError("Headline is required.");
      if (!destinationUrl.trim()) return setLocalError("Destination URL is required.");

      await onSave({
        name: name.trim(),
        draftId,
        facebookPageId: facebookPageId.trim(),
        instagramActorId: instagramActorId.trim() || undefined,
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
      });
      return;
    }

    if (creativeFormat === "SINGLE_VIDEO") {
      if (!videoUrl.trim()) return setLocalError("Video is required.");
      if (!headline.trim()) return setLocalError("Headline is required.");
      if (!destinationUrl.trim()) return setLocalError("Destination URL is required.");

      await onSave({
        name: name.trim(),
        draftId,
        facebookPageId: facebookPageId.trim(),
        instagramActorId: instagramActorId.trim() || undefined,
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
      });
      return;
    }

    if (carouselCards.length < 2) {
      return setLocalError("Carousel requires at least 2 cards.");
    }
    for (const [i, card] of carouselCards.entries()) {
      if (!card.headline.trim()) return setLocalError(`Card ${i + 1}: headline required.`);
      if (!card.destinationUrl.trim()) return setLocalError(`Card ${i + 1}: destination URL required.`);
      if (!card.imageUrl?.trim() && !card.videoUrl?.trim()) {
        return setLocalError(`Card ${i + 1}: image or video required.`);
      }
    }

    await onSave({
      name: name.trim(),
      draftId,
      facebookPageId: facebookPageId.trim(),
      instagramActorId: instagramActorId.trim() || undefined,
      status,
      creativeFormat,
      carouselCards,
      primaryText: primaryText.trim(),
      urlParameters: urlParameters.trim() || undefined,
      pixelId: pixelId.trim() || undefined,
      conversionEvent: conversionEvent.trim() || undefined,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 pb-2">
      <BuilderStepHeader
        step={3}
        title="Ad / Creative setup"
        description="Build what people see — image, video, copy, and link. Saved as draft until you publish on Step 4."
        badge="Draft only"
      />

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Identity</BuilderSectionTitle>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Ad name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Facebook Page</span>
          <select required value={facebookPageId} onChange={(e) => setFacebookPageId(e.target.value)} disabled={pagesLoading} className={inputClass}>
            {pages.length === 0 ? (
              <option value="">{pagesLoading ? "Loading…" : "No pages"}</option>
            ) : (
              pages.map((p) => (
                <option key={p.id} value={p.id}>{p.name ?? p.id}</option>
              ))
            )}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">
            Instagram account ID {instagramRequired ? "(required)" : "(optional)"}
          </span>
          <input
            value={instagramActorId}
            onChange={(e) => setInstagramActorId(e.target.value)}
            placeholder="Instagram actor ID for Instagram placements"
            className={inputClass}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          {(["PAUSED", "ACTIVE"] as const).map((value) => (
            <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${status === value ? "border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2]" : "border-zinc-200"}`}>
              <input type="radio" name="ad-status" checked={status === value} onChange={() => setStatus(value)} className="sr-only" />
              {value === "PAUSED" ? "Paused (default)" : "Active"}
            </label>
          ))}
        </div>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Creative format</BuilderSectionTitle>
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
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${creativeFormat === value ? "bg-zinc-900 text-white" : "border border-zinc-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Media</BuilderSectionTitle>

        {creativeFormat === "SINGLE_IMAGE" ? (
          <div className="space-y-3">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={imageAltText || "Preview"} className="max-h-48 rounded-lg object-contain" />
            ) : null}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e.target.files?.[0], "main")} />
            <button type="button" disabled={uploading} onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              Upload image
            </button>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Alt text (optional)</span>
              <input value={imageAltText} onChange={(e) => setImageAltText(e.target.value)} className={inputClass} />
            </label>
          </div>
        ) : null}

        {creativeFormat === "SINGLE_VIDEO" ? (
          <div className="space-y-3">
            {videoUrl ? <p className="text-xs text-zinc-600 break-all">Video: {videoUrl}</p> : null}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => void handleVideoUpload(e.target.files?.[0])} />
            <button type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
              Upload video
            </button>
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e.target.files?.[0], "thumb")} />
            <button type="button" disabled={uploading} onClick={() => thumbInputRef.current?.click()} className="text-sm font-semibold text-[#1877F2]">
              Upload thumbnail (optional)
            </button>
          </div>
        ) : null}

        {creativeFormat === "CAROUSEL" ? (
          <div className="space-y-4">
            {carouselCards.map((card, index) => (
              <div key={index} className="rounded-xl border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Card {index + 1}</p>
                  {carouselCards.length > 2 ? (
                    <button type="button" onClick={() => setCarouselCards((prev) => prev.filter((_, i) => i !== index))} className="text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imageUrl} alt="" className="max-h-24 rounded object-contain" />
                ) : null}
                <input type="file" accept="image/*" className="text-xs" onChange={(e) => void handleImageUpload(e.target.files?.[0], index)} />
                <input value={card.headline} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, headline: e.target.value } : c))} placeholder="Headline" className={inputClass} />
                <input value={card.description ?? ""} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, description: e.target.value } : c))} placeholder="Description" className={inputClass} />
                <input value={card.destinationUrl} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, destinationUrl: e.target.value } : c))} placeholder="Destination URL" className={inputClass} />
                <select value={card.callToAction} onChange={(e) => setCarouselCards((prev) => prev.map((c, i) => i === index ? { ...c, callToAction: e.target.value as MetaCallToAction } : c))} className={inputClass}>
                  {CTA_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            ))}
            <button type="button" onClick={() => setCarouselCards((prev) => [...prev, emptyCarouselCard(defaultDestination)])} className="flex items-center gap-2 text-sm font-semibold text-[#1877F2]">
              <Plus className="size-4" /> Add card
            </button>
          </div>
        ) : null}
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Copy</BuilderSectionTitle>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Primary text</span>
          <textarea required rows={3} value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} className={inputClass} />
        </label>
        {creativeFormat !== "CAROUSEL" ? (
          <>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Headline</span>
              <input required value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Display link (optional)</span>
              <input value={displayLink} onChange={(e) => setDisplayLink(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">Landing page URL</span>
              <input required type="url" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800">CTA button</span>
              <select value={callToAction} onChange={(e) => setCallToAction(e.target.value as MetaCallToAction)} className={inputClass}>
                {CTA_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
          </>
        ) : null}
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Tracking</BuilderSectionTitle>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">URL parameters / UTM (optional)</span>
          <input value={urlParameters} onChange={(e) => setUrlParameters(e.target.value)} placeholder="utm_source=facebook&utm_medium=paid" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Pixel ID (optional)</span>
          <input value={pixelId} onChange={(e) => setPixelId(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">Conversion event (optional)</span>
          <input value={conversionEvent} onChange={(e) => setConversionEvent(e.target.value)} className={inputClass} />
        </label>
      </section>

      <section className={sectionCardClass}>
        <BuilderSectionTitle>Preview</BuilderSectionTitle>
        {showPreviews ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <AdCreativePreview placement="facebook_feed" primaryText={primaryText} headline={headline} description={description} imageUrl={previewImage} displayLink={displayLink} callToAction={callToAction} />
            <AdCreativePreview placement="instagram_feed" primaryText={primaryText} headline={headline} description={description} imageUrl={previewImage} displayLink={displayLink} callToAction={callToAction} />
            <AdCreativePreview placement="stories" primaryText={primaryText} headline={headline} imageUrl={previewImage} callToAction={callToAction} />
            <AdCreativePreview placement="reels" primaryText={primaryText} headline={headline} imageUrl={previewImage} callToAction={callToAction} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Upload your ad image or video to see placement previews here.
          </p>
        )}
      </section>

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
      />
    </form>
  );
}
