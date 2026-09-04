"use client";

import { BusinessProfileImage } from "@/app/components/business/BusinessProfileImage";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { CalendarDays, MoreVertical, Pencil, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";

type Props = {
  funnel: Funnel;
  businessId: number;
  onDeleteRequest?: (campaign: Funnel) => void;
  onEditRequest?: (campaign: Funnel) => void;
  canDelete?: boolean;
  canEdit?: boolean;
};

const PREVIEW_SIZE = 220;
const PREVIEW_GAP = 12;

function formatPrice(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

function parsePrice(raw: number | string | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatCreatedDate(iso: string | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CampaignFunnelCard({
  funnel,
  businessId,
  onDeleteRequest,
  onEditRequest,
  canDelete = true,
  canEdit = true,
}: Props) {
  const hasImage = Boolean(funnel.imageUrl?.trim());
  const showActionsMenu = Boolean(onEditRequest || onDeleteRequest);
  const {
    open: menuOpen,
    setOpen: setMenuOpen,
    toggle: toggleMenu,
    mounted: menuMounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    placement: "flip",
    align: "right",
    width: 168,
    estimatedHeight: 96,
  });

  const priceNum = parsePrice(funnel.price);
  const priceText = priceNum != null ? formatPrice(priceNum) : null;
  const campaignTypeLabel =
    funnel.campaignType === "prepaid"
      ? "Prepaid"
      : funnel.campaignType === "postpaid"
        ? "Postpaid"
        : null;
  const created = formatCreatedDate(funnel.createdAt);

  const campaignHref = `/business/${businessId}/dashboard/campaigns/${funnel.id}`;
  const campaignName = funnel.campaignName?.trim() ?? "";
  const offerName = funnel.offer?.trim() ?? "";
  const title =
    campaignName || offerName || `Campaign ${funnel.id}`;
  const description = funnel.description?.trim() || null;
  const showOfferBar = offerName.length > 0;
  const previewSrc = resolveUploadImageUrl(funnel.imageUrl);
  const canPreviewImage = Boolean(previewSrc) && hasImage;

  const imageAnchorRef = useRef<HTMLSpanElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMounted, setPreviewMounted] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<CSSProperties | undefined>();

  useEffect(() => {
    setPreviewMounted(true);
  }, []);

  const updatePreviewPosition = useCallback(() => {
    const el = imageAnchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const preferredLeft = rect.right + PREVIEW_GAP;
    const fitsRight = preferredLeft + PREVIEW_SIZE <= window.innerWidth - 8;
    const left = fitsRight
      ? preferredLeft
      : Math.max(8, rect.left - PREVIEW_SIZE - PREVIEW_GAP);
    const top = Math.min(
      Math.max(8, rect.top + rect.height / 2 - PREVIEW_SIZE / 2),
      window.innerHeight - PREVIEW_SIZE - 8,
    );
    setPreviewStyle({
      position: "fixed",
      top,
      left,
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      zIndex: 120,
    });
  }, []);

  // Click-to-preview (not hover) so cards stay calm until the user asks
  const togglePreview = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!canPreviewImage) return;
      if (previewOpen) {
        setPreviewOpen(false);
        return;
      }
      updatePreviewPosition();
      setPreviewOpen(true);
    },
    [canPreviewImage, previewOpen, updatePreviewPosition],
  );

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const onScrollOrResize = () => updatePreviewPosition();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };
    // Delay so the same click that opened preview does not immediately close it
    let removeOutside: (() => void) | undefined;
    const outsideTimer = window.setTimeout(() => {
      const onPointer = (event: globalThis.MouseEvent) => {
        if (imageAnchorRef.current?.contains(event.target as Node)) return;
        closePreview();
      };
      document.addEventListener("mousedown", onPointer);
      removeOutside = () => document.removeEventListener("mousedown", onPointer);
    }, 0);

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(outsideTimer);
      removeOutside?.();
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen, updatePreviewPosition, closePreview]);

  return (
    <div className="org-campaign-card group relative flex w-full max-w-none flex-col overflow-hidden">
      {showActionsMenu ? (
        <div ref={anchorRef} className="absolute right-2.5 top-2.5 z-20">
          <button
            type="button"
            aria-label={`More actions for ${title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="More actions"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleMenu();
            }}
            className="org-campaign-card-more inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-slate-500 transition hover:bg-[#f4f7fb] hover:text-[#07111f]"
          >
            <MoreVertical className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
          {menuMounted && menuOpen && menuPosition
            ? createPortal(
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label={`${title} actions`}
                  style={menuStyle}
                  className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.02]"
                >
                  {onEditRequest ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? "Edit campaign"
                          : "You do not have permission to edit campaigns"
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!canEdit) return;
                        setMenuOpen(false);
                        onEditRequest(funnel);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold transition ${
                        canEdit
                          ? "cursor-pointer text-slate-700 hover:bg-[#f8fbff]"
                          : "cursor-not-allowed text-slate-300"
                      }`}
                    >
                      <Pencil className="size-3.5 text-[#1877f2]" aria-hidden />
                      Edit
                    </button>
                  ) : null}
                  {onDeleteRequest ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!canDelete}
                      title={
                        canDelete
                          ? "Delete campaign"
                          : "You do not have permission to delete campaigns"
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!canDelete) return;
                        setMenuOpen(false);
                        onDeleteRequest(funnel);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] font-semibold transition ${
                        canDelete
                          ? "cursor-pointer text-red-600 hover:bg-red-50"
                          : "cursor-not-allowed text-slate-300"
                      }`}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  ) : null}
                </div>,
                document.body,
              )
            : null}
        </div>
      ) : null}

      <Link
        href={campaignHref}
        aria-label={`Open ${title}`}
        className="org-campaign-card-link relative z-[1] flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/25 focus-visible:ring-offset-2"
      >
        <article className="org-campaign-card-inner flex min-h-[11.5rem] flex-col p-3.5 pt-3 sm:p-4 sm:pt-3.5">
          <div className="org-campaign-card-head flex items-start gap-3 pr-8">
            <span
              ref={imageAnchorRef}
              role={canPreviewImage ? "button" : undefined}
              tabIndex={canPreviewImage ? 0 : undefined}
              aria-label={
                canPreviewImage
                  ? previewOpen
                    ? `Close ${title} image preview`
                    : `Preview ${title} image`
                  : undefined
              }
              aria-expanded={canPreviewImage ? previewOpen : undefined}
              onClick={togglePreview}
              onKeyDown={(event) => {
                if (!canPreviewImage) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  if (previewOpen) {
                    setPreviewOpen(false);
                    return;
                  }
                  updatePreviewPosition();
                  setPreviewOpen(true);
                }
              }}
              className={`org-campaign-card-image-trigger relative shrink-0 ${
                canPreviewImage ? "cursor-zoom-in" : "cursor-default"
              }`}
            >
              <BusinessProfileImage
                src={funnel.imageUrl}
                variant="campaign"
                className="org-campaign-card-avatar rounded-full"
                aria-hidden={hasImage}
              />
            </span>
            <div className="org-campaign-card-copy min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-2">
                <h3 className="org-campaign-card-title m-0 line-clamp-2 min-w-0 flex-1 text-[0.95rem] font-extrabold leading-snug sm:text-[1rem]">
                  {title}
                </h3>
                {funnel.published === true ||
                funnel.status?.trim().toLowerCase() === "published" ? (
                  <span className="org-campaign-card-status org-campaign-card-status--active">
                    <span className="org-campaign-card-status-dot" aria-hidden />
                    Active
                  </span>
                ) : null}
              </div>
              {description ? (
                <p className="org-campaign-card-desc m-0 mt-1.5 line-clamp-3 text-[0.68rem] leading-relaxed sm:text-[0.72rem]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {showOfferBar ? (
            <div className="org-campaign-card-offer-bar mt-3 inline-flex max-w-full items-center gap-1.5">
              <Tag className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="line-clamp-1">
                Offer: {offerName}
              </span>
            </div>
          ) : null}

          <div className="org-campaign-card-footer mt-auto flex items-end justify-between gap-2 pt-3">
            {priceText ? (
              <p className="org-campaign-card-price m-0 text-[1.35rem] font-extrabold leading-none sm:text-[1.45rem]">
                {priceText}
              </p>
            ) : campaignTypeLabel ? (
              <span className="org-campaign-card-type inline-flex items-center rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.04em]">
                {campaignTypeLabel}
              </span>
            ) : (
              <span className="org-campaign-card-meta text-[0.72rem] font-medium">
                No price set
              </span>
            )}
            {created ? (
              <p className="org-campaign-card-date m-0 inline-flex items-center gap-1 text-[0.65rem] font-medium sm:text-[0.68rem]">
                <CalendarDays className="size-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                {created}
              </p>
            ) : null}
          </div>
        </article>
      </Link>

      {previewMounted && previewOpen && previewSrc && previewStyle
        ? createPortal(
            <div
              className="org-campaign-card-image-preview pointer-events-none"
              style={previewStyle}
              role="img"
              aria-label={`${title} image preview`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="size-full object-cover object-center"
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
