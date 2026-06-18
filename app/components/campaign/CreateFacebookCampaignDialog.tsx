"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Megaphone, Video, X } from "lucide-react";
import { getPublicAppUrl } from "@/app/lib/public-app-url";
import {
  pickMetaImageUrl,
  resolveMetaImageUrl,
  validateMetaImageUrl,
} from "@/app/lib/resolve-meta-image-url";
import {
  createFacebookCampaign,
  type MetaCallToAction,
  type MetaCampaignObjective,
  type MetaDistanceUnit,
  type MetaGender,
  type MetaPlacements,
} from "@/app/services/facebook/create-facebook-campaign";
import { getFacebookPages } from "@/app/services/facebook/get-facebook-pages";
import { uploadFacebookCampaignImage } from "@/app/services/facebook/upload-facebook-campaign-image";
import { uploadFacebookCampaignVideo } from "@/app/services/facebook/upload-facebook-campaign-video";

type CreateFacebookCampaignDialogProps = {
  open: boolean;
  onClose: () => void;
  restaurantId: number;
  defaultName?: string;
  defaultImageUrl?: string;
  defaultDestinationUrl?: string;
  onCreated?: () => void;
};

const OBJECTIVES: { value: MetaCampaignObjective; label: string }[] = [
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Sales" },
];

const CTA_OPTIONS: { value: MetaCallToAction; label: string }[] = [
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "BOOK_NOW", label: "Book now" },
  { value: "SHOP_NOW", label: "Shop now" },
  { value: "GET_OFFER", label: "Get offer" },
  { value: "ORDER_NOW", label: "Order now" },
  { value: "CALL_NOW", label: "Call now" },
];

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "PK", label: "Pakistan" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "IN", label: "India" },
];

const DEFAULT_PLACEMENTS: MetaPlacements = {
  facebookFeed: true,
  instagramFeed: true,
  facebookStories: true,
  instagramStories: true,
  reels: true,
};

function defaultEndDateIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function defaultStartDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-zinc-100 pb-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
      {children}
    </h3>
  );
}

export function CreateFacebookCampaignDialog({
  open,
  onClose,
  restaurantId,
  defaultName = "",
  defaultImageUrl = "",
  defaultDestinationUrl,
  onCreated,
}: CreateFacebookCampaignDialogProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(defaultName);
  const [objective, setObjective] =
    useState<MetaCampaignObjective>("OUTCOME_TRAFFIC");
  const [dailyBudget, setDailyBudget] = useState("20");
  const [startDate, setStartDate] = useState(defaultStartDateIso);
  const [endDate, setEndDate] = useState(defaultEndDateIso);
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("10");
  const [distanceUnit, setDistanceUnit] = useState<MetaDistanceUnit>("mile");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [gender, setGender] = useState<MetaGender>("all");
  const [placements, setPlacements] =
    useState<MetaPlacements>(DEFAULT_PLACEMENTS);

  const [facebookPageId, setFacebookPageId] = useState("");
  const [instagramActorId, setInstagramActorId] = useState("");
  const [pages, setPages] = useState<Array<{ id: string; name: string | null }>>(
    [],
  );
  const [pagesLoading, setPagesLoading] = useState(false);

  const [headline, setHeadline] = useState(defaultName);
  const [primaryText, setPrimaryText] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState(
    defaultDestinationUrl ?? getPublicAppUrl(),
  );
  const [callToAction, setCallToAction] =
    useState<MetaCallToAction>("GET_OFFER");

  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const imageFieldError = useMemo(() => {
    if (mediaType !== "image") return null;
    if (!imageUrl.trim()) {
      return "Upload an ad image or paste a direct HTTPS link to a .jpg/.png file.";
    }
    return validateMetaImageUrl(resolveMetaImageUrl(imageUrl));
  }, [imageUrl, mediaType]);

  const videoFieldError = useMemo(() => {
    if (mediaType !== "video") return null;
    if (!videoUrl.trim()) {
      return "Upload a video or paste a direct HTTPS link to a .mp4/.mov file.";
    }
    if (!videoUrl.trim().startsWith("https://")) {
      return "Video URL must use HTTPS.";
    }
    return null;
  }, [mediaType, videoUrl]);

  useEffect(() => {
    if (!open) return;

    setName(defaultName);
    setHeadline(defaultName);
    const picked = pickMetaImageUrl(defaultImageUrl);
    setImageUrl(picked);
    setImagePreview(picked || null);
    setVideoUrl("");
    setMediaType("image");
    setDestinationUrl(defaultDestinationUrl ?? getPublicAppUrl());
    setPrimaryText("");
    setDescription("");
    setStartDate(defaultStartDateIso());
    setEndDate(defaultEndDateIso());
    setPlacements(DEFAULT_PLACEMENTS);
    setError(null);
    setSuccessUrl(null);

    setPagesLoading(true);
    void getFacebookPages(restaurantId)
      .then((loaded) => {
        setPages(loaded);
        if (loaded[0]?.id) {
          setFacebookPageId(loaded[0].id);
        }
      })
      .catch(() => {
        setPages([]);
      })
      .finally(() => setPagesLoading(false));
  }, [open, defaultName, defaultImageUrl, defaultDestinationUrl, restaurantId]);

  if (!open) return null;

  const togglePlacement = (key: keyof MetaPlacements) => {
    setPlacements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadingMedia(true);
    setError(null);
    try {
      const { imageUrl: uploadedUrl } = await uploadFacebookCampaignImage(
        restaurantId,
        file,
      );
      setMediaType("image");
      setImageUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
      setVideoUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploadingMedia(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadingMedia(true);
    setError(null);
    try {
      const { videoUrl: uploadedUrl } = await uploadFacebookCampaignVideo(
        restaurantId,
        file,
      );
      setMediaType("video");
      setVideoUrl(uploadedUrl);
      setImageUrl("");
      setImagePreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload video.");
    } finally {
      setUploadingMedia(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const budget = Number.parseFloat(dailyBudget);
      if (!Number.isFinite(budget) || budget < 1) {
        throw new Error("Daily budget must be at least 1.");
      }

      if (!facebookPageId.trim()) {
        throw new Error("Select a Facebook Page for this ad.");
      }

      const minAge = Number.parseInt(ageMin, 10);
      const maxAge = Number.parseInt(ageMax, 10);
      if (!Number.isFinite(minAge) || !Number.isFinite(maxAge)) {
        throw new Error("Age range is required.");
      }
      if (minAge > maxAge) {
        throw new Error("Minimum age cannot exceed maximum age.");
      }

      const hasPlacement = Object.values(placements).some(Boolean);
      if (!hasPlacement) {
        throw new Error("Select at least one placement.");
      }

      let resolvedImageUrl: string | undefined;
      let resolvedVideoUrl: string | undefined;

      if (mediaType === "image") {
        resolvedImageUrl = resolveMetaImageUrl(imageUrl);
        const imageError = validateMetaImageUrl(resolvedImageUrl);
        if (imageError) throw new Error(imageError);
      } else {
        resolvedVideoUrl = videoUrl.trim();
        if (!resolvedVideoUrl.startsWith("https://")) {
          throw new Error("Video URL must use HTTPS.");
        }
      }

      const parsedRadius = city.trim()
        ? Number.parseFloat(radius)
        : undefined;

      const result = await createFacebookCampaign(restaurantId, {
        name: name.trim(),
        objective,
        dailyBudget: budget,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        country,
        city: city.trim() || undefined,
        radius: parsedRadius,
        distanceUnit: city.trim() ? distanceUnit : undefined,
        ageMin: minAge,
        ageMax: maxAge,
        gender,
        placements,
        facebookPageId: facebookPageId.trim(),
        instagramActorId: instagramActorId.trim() || undefined,
        headline: headline.trim(),
        primaryText: primaryText.trim(),
        description: description.trim() || undefined,
        destinationUrl: destinationUrl.trim(),
        callToAction,
        imageUrl: resolvedImageUrl,
        videoUrl: resolvedVideoUrl,
      });

      setSuccessUrl(result.adsManagerUrl);
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not publish campaign.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    uploadingMedia ||
    pagesLoading ||
    Boolean(imageFieldError) ||
    Boolean(videoFieldError) ||
    !facebookPageId.trim();

  const inputClass =
    "mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-meta-campaign-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2]">
              <Megaphone className="size-4" aria-hidden />
            </span>
            <div>
              <h2
                id="create-meta-campaign-title"
                className="text-base font-bold text-zinc-900"
              >
                Publish Facebook campaign
              </h2>
              <p className="text-xs text-zinc-500">
                Creates Campaign → Ad Set → Creative → Ad in Meta (paused)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {successUrl ? (
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm font-medium text-emerald-800">
              Campaign published successfully. It appears in Ads Manager as paused.
            </p>
            <a
              href={successUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-[#166fe5]"
            >
              Open in Ads Manager
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-5 py-5">
            <section className="space-y-3">
              <SectionTitle>Campaign</SectionTitle>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Campaign name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Objective</span>
                <select
                  value={objective}
                  onChange={(e) =>
                    setObjective(e.target.value as MetaCampaignObjective)
                  }
                  className={inputClass}
                >
                  {OBJECTIVES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="space-y-3">
              <SectionTitle>Budget &amp; schedule</SectionTitle>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Daily budget</span>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">Start date</span>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">End date</span>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Audience</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">Country</span>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">City (optional)</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chicago"
                    className={inputClass}
                  />
                </label>
              </div>
              {city.trim() ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="font-medium text-zinc-800">Radius</span>
                    <input
                      required
                      type="number"
                      min={1}
                      max={80}
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-zinc-800">Distance unit</span>
                    <select
                      value={distanceUnit}
                      onChange={(e) =>
                        setDistanceUnit(e.target.value as MetaDistanceUnit)
                      }
                      className={inputClass}
                    >
                      <option value="mile">Miles</option>
                      <option value="kilometer">Kilometers</option>
                    </select>
                  </label>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">Age min</span>
                  <input
                    required
                    type="number"
                    min={18}
                    max={65}
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">Age max</span>
                  <input
                    required
                    type="number"
                    min={18}
                    max={65}
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-zinc-800">Gender</span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as MetaGender)}
                    className={inputClass}
                  >
                    <option value="all">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Placements</SectionTitle>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(
                  [
                    ["facebookFeed", "Facebook Feed"],
                    ["instagramFeed", "Instagram Feed"],
                    ["facebookStories", "Facebook Stories"],
                    ["instagramStories", "Instagram Stories"],
                    ["reels", "Reels"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={placements[key]}
                      onChange={() => togglePlacement(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Page &amp; Instagram</SectionTitle>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Facebook Page</span>
                <select
                  required
                  value={facebookPageId}
                  onChange={(e) => setFacebookPageId(e.target.value)}
                  disabled={pagesLoading}
                  className={inputClass}
                >
                  {pages.length === 0 ? (
                    <option value="">
                      {pagesLoading ? "Loading pages…" : "No pages found"}
                    </option>
                  ) : (
                    pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name ?? page.id}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">
                  Instagram account ID (optional)
                </span>
                <input
                  value={instagramActorId}
                  onChange={(e) => setInstagramActorId(e.target.value)}
                  placeholder="For Instagram placements"
                  className={inputClass}
                />
              </label>
            </section>

            <section className="space-y-3">
              <SectionTitle>Creative</SectionTitle>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Headline</span>
                <input
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Primary text</span>
                <textarea
                  required
                  rows={3}
                  value={primaryText}
                  onChange={(e) => setPrimaryText(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Description</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">Landing page URL</span>
                <input
                  required
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-zinc-800">CTA button</span>
                <select
                  value={callToAction}
                  onChange={(e) =>
                    setCallToAction(e.target.value as MetaCallToAction)
                  }
                  className={inputClass}
                >
                  {CTA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="block text-sm">
                <span className="font-medium text-zinc-800">Ad media</span>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType("image")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      mediaType === "image"
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 text-zinc-700"
                    }`}
                  >
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("video")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      mediaType === "video"
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 text-zinc-700"
                    }`}
                  >
                    Video
                  </button>
                </div>

                {mediaType === "image" ? (
                  <div className="mt-2 flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt="Ad preview"
                        className="mx-auto max-h-40 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-4 text-zinc-500">
                        <ImagePlus className="size-8" aria-hidden />
                        <p className="text-xs text-center">
                          Upload a JPG or PNG for your ad.
                        </p>
                      </div>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => void handleImageFile(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      disabled={uploadingMedia}
                      onClick={() => imageInputRef.current?.click()}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
                    >
                      {uploadingMedia ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Uploading…
                        </>
                      ) : (
                        "Upload image"
                      )}
                    </button>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value.trim() || null);
                      }}
                      placeholder="Or paste direct HTTPS image URL"
                      className={inputClass}
                    />
                    {imageFieldError ? (
                      <p className="text-xs text-amber-800" role="status">
                        {imageFieldError}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                    <div className="flex flex-col items-center gap-2 py-4 text-zinc-500">
                      <Video className="size-8" aria-hidden />
                      <p className="text-xs text-center">
                        Upload MP4, MOV, or WebM for your video ad.
                      </p>
                      {videoUrl ? (
                        <p className="text-xs text-emerald-700 break-all">
                          Video ready: {videoUrl}
                        </p>
                      ) : null}
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={(e) => void handleVideoFile(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      disabled={uploadingMedia}
                      onClick={() => videoInputRef.current?.click()}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
                    >
                      {uploadingMedia ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Uploading…
                        </>
                      ) : (
                        "Upload video"
                      )}
                    </button>
                    {videoFieldError ? (
                      <p className="text-xs text-amber-800" role="status">
                        {videoFieldError}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            {error ? (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitDisabled}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Publishing to Meta…
                </>
              ) : (
                "Publish campaign"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
