"use client";

import Image from "next/image";
import { PostImage } from "@/types/post";
import { useEffect, useLayoutEffect, useCallback, useState, useRef } from "react";
import { flushSync } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";

interface ImageViewerProps {
  images: PostImage[];
  currentIndex: number;
  isOwner?: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onLike?: () => void;
  onCaptionSave?: (imageId: string, caption: string | null) => void;
  onFeaturedToggle?: (imageId: string) => void;
}

const isVideo = (img: PostImage | undefined | null) =>
  !!img?.mimeType?.startsWith("video/");

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

// The already-loaded thumbnail for this image in the feed, if there is one.
function thumbSrc(imageId: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const img = document.querySelector<HTMLImageElement>(
    `[data-media-id="${CSS.escape(imageId)}"] img`,
  );
  return img?.currentSrc || undefined;
}

function Media({ image }: { image: PostImage }) {
  // Painted behind the full-size image so there is something to look at (and
  // to animate) while the large version downloads and decodes.
  const [placeholder] = useState(() => thumbSrc(image.id));
  // An explicit box (rather than the media's intrinsic size) so the open/close
  // transition can measure it before anything has loaded.
  const box = {
    aspectRatio: `${image.width} / ${image.height}`,
    width: `min(90vw, 1400px, ${image.width}px, calc(85vh * ${image.width} / ${image.height}))`,
  };
  // Two layers so the open/close transition can run on transforms alone: the
  // outer box clips, the inner one carries the picture.
  return (
    <div
      data-viewer-media={image.id}
      className="relative overflow-hidden"
      style={box}
    >
      <div
        data-viewer-media-inner
        className="absolute inset-0"
        style={
          placeholder
            ? {
                backgroundImage: `url(${JSON.stringify(placeholder)})`,
                backgroundSize: "100% 100%",
              }
            : undefined
        }
      >
        {isVideo(image) ? (
          <video
            src={image.url}
            controls
            playsInline
            preload="metadata"
            className="block h-full w-full bg-inkstain"
          />
        ) : (
          <Image
            src={image.url}
            alt={image.alt || "Image"}
            fill
            sizes="(max-width: 768px) 90vw, min(90vw, 1400px)"
            className="object-contain"
          />
        )}
      </div>
    </div>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

function IconChevron({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

function IconHeart({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconPin({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// ── Shared-element transition ──────────────────────────────────────────────
// The viewer grows out of the thumbnail that was clicked and shrinks back into
// it on close. Thumbnails are found by the `data-media-id` the feed layouts put
// on every clickable frame.

const OPEN_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const CLOSE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// The thumbnail's on-screen box, or null if it isn't actually in sight
// (scrolled off the page, or off the edge of its own carousel).
function findThumbRect(imageId: string): DOMRect | null {
  const el = document.querySelector<HTMLElement>(
    `[data-media-id="${CSS.escape(imageId)}"]`,
  );
  if (!el) return null;
  // The box inside the frame's border, which is where the picture actually
  // sits. Using the outer box leaves the photo a border's width off at the
  // moment it hands over to (or takes over from) the thumbnail.
  const outer = el.getBoundingClientRect();
  const rect = new DOMRect(
    outer.left + el.clientLeft,
    outer.top + el.clientTop,
    el.clientWidth,
    el.clientHeight,
  );
  if (rect.width === 0 || rect.height === 0) return null;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
    return null;
  }
  const clip = el.closest("[data-media-clip]")?.getBoundingClientRect();
  if (clip && (cx < clip.left || cx > clip.right || cy < clip.top || cy > clip.bottom)) {
    return null;
  }
  return rect;
}

// Keyframes taking the photo from the thumbnail's box to its resting place in
// the centre of the stage, using transforms only so the whole thing runs on the
// compositor (no per-frame repaint of a large image).
//
// The outer box stretches from the thumbnail's shape to the photo's shape and
// clips; the inner layer counter-scales so the photo itself is only ever scaled
// uniformly, starting at the thumbnail's cover-crop. The counter-scale isn't
// linear, hence a run of keyframes rather than just a start and an end.
const FRAME_STEPS = 24;

function thumbToStageFrames(
  media: HTMLElement,
  thumb: DOMRect,
  stage: DOMRect,
): { outer: Keyframe[]; inner: Keyframe[] } | null {
  const width = media.offsetWidth;
  const height = media.offsetHeight;
  if (!width || !height) return null;

  const startX = thumb.width / width;
  const startY = thumb.height / height;
  const startCover = Math.max(startX, startY);
  const dx = thumb.left + thumb.width / 2 - (stage.left + stage.width / 2);
  const dy = thumb.top + thumb.height / 2 - (stage.top + stage.height / 2);

  const outer: Keyframe[] = [];
  const inner: Keyframe[] = [];
  for (let i = 0; i <= FRAME_STEPS; i++) {
    const t = i / FRAME_STEPS;
    const sx = startX + (1 - startX) * t;
    const sy = startY + (1 - startY) * t;
    const cover = startCover + (1 - startCover) * t;
    outer.push({
      offset: t,
      transform: `translate(${dx * (1 - t)}px, ${dy * (1 - t)}px) scale(${sx}, ${sy})`,
    });
    inner.push({ offset: t, transform: `scale(${cover / sx}, ${cover / sy})` });
  }
  return { outer, inner };
}

function reversed(frames: Keyframe[]): Keyframe[] {
  return frames
    .map((frame) => ({ ...frame, offset: 1 - (frame.offset as number) }))
    .reverse();
}

function innerLayer(media: HTMLElement) {
  return media.querySelector<HTMLElement>("[data-viewer-media-inner]");
}

export function ImageViewer({
  images,
  currentIndex,
  isOwner,
  onClose,
  onNavigate,
  onLike,
  onCaptionSave,
  onFeaturedToggle,
}: ImageViewerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: currentIndex,
    loop: false,
    duration: 22,
    align: "center",
    containScroll: "trimSnaps",
  });

  const image = images[currentIndex];

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(image?.caption || "");
  const [saving, setSaving] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  const currentMedia = useCallback(
    () =>
      image
        ? stageRef.current?.querySelector<HTMLElement>(
            `[data-viewer-media="${CSS.escape(image.id)}"]`,
          ) ?? null
        : null,
    [image],
  );

  // Open: fade the backdrop and controls in while the photo grows out of its
  // thumbnail. Runs before first paint so there is no flash of the end state.
  useLayoutEffect(() => {
    const chrome = rootRef.current?.querySelectorAll("[data-viewer-chrome]") ?? [];
    chrome.forEach((el) =>
      el.animate([{ opacity: 0, offset: 0 }], { duration: 240, easing: "ease-out" }),
    );

    const media = currentMedia();
    if (!media || !image) return;
    const stage = stageRef.current?.getBoundingClientRect();
    const thumb = prefersReducedMotion() ? null : findThumbRect(image.id);
    const frames = thumb && stage ? thumbToStageFrames(media, thumb, stage) : null;

    if (frames) {
      const timing = { duration: 340, easing: OPEN_EASING };
      media.animate(frames.outer, timing);
      innerLayer(media)?.animate(frames.inner, timing);
    } else {
      media.animate([{ opacity: 0, offset: 0 }], { duration: 240, easing: "ease-out" });
    }
    // Mount-only: later image changes are embla's to animate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close: the reverse, back into wherever the current photo's thumbnail is now
  // (the viewer may have been swiped to a different photo than it opened on).
  // Falls back to a plain fade when that thumbnail isn't in sight.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const animations: Animation[] = [];
    rootRef.current?.querySelectorAll("[data-viewer-chrome]").forEach((el) => {
      animations.push(
        el.animate([{ opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" }),
      );
    });

    const media = currentMedia();
    if (media && image) {
      const stage = stageRef.current?.getBoundingClientRect();
      const thumb = prefersReducedMotion() ? null : findThumbRect(image.id);
      const frames = thumb && stage ? thumbToStageFrames(media, thumb, stage) : null;
      if (frames) {
        const timing = { duration: 300, easing: CLOSE_EASING, fill: "forwards" as const };
        animations.push(media.animate(reversed(frames.outer), timing));
        const inner = innerLayer(media)?.animate(reversed(frames.inner), timing);
        if (inner) animations.push(inner);
      } else {
        animations.push(
          media.animate([{ opacity: 0 }], {
            duration: 180,
            easing: "ease-in",
            fill: "forwards",
          }),
        );
      }
    }

    Promise.allSettled(animations.map((a) => a.finished)).then(() => {
      // Unmount in the same frame the animation ends on. Left to React's
      // normal scheduling, a frame could paint in between.
      flushSync(onClose);
      // If the parent kept the viewer mounted anyway, don't leave it faded out.
      if (rootRef.current) {
        animations.forEach((a) => a.cancel());
        closingRef.current = false;
      }
    });
  }, [currentMedia, image, onClose]);

  // Reset caption draft / edit mode when the viewed image changes
  useEffect(() => {
    setDraft(image?.caption || "");
    setIsEditing(false);
  }, [image?.id, image?.caption]);

  // Sync outward: embla -> parent onNavigate
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      if (idx !== currentIndex) onNavigate(idx);
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onNavigate, currentIndex]);

  // Sync inward: parent currentIndex -> embla
  useEffect(() => {
    if (!emblaApi) return;
    if (emblaApi.selectedScrollSnap() !== currentIndex) {
      emblaApi.scrollTo(currentIndex);
    }
  }, [emblaApi, currentIndex]);

  const goPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const goNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditing) return;
      if (e.key === "Escape") requestClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [requestClose, goPrev, goNext, isEditing]);

  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    // Hiding the scrollbar widens the page; pad by the same amount so the feed
    // underneath doesn't shift sideways while the viewer is open.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  if (!image) return null;

  const hasCaption = !!image.caption?.trim();

  const startEdit = () => {
    setDraft(image.caption || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(image.caption || "");
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!onCaptionSave) return;
    setSaving(true);
    try {
      const trimmed = draft.trim();
      onCaptionSave(image.id, trimmed.length ? trimmed : null);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col"
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop is its own layer so it can fade independently of the photo */}
      <div
        data-viewer-chrome
        className="absolute inset-0 bg-inkstain/90"
      />

      {!hasCaption && !isEditing && (
        <div
          data-viewer-chrome
          className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2"
        >
          <span
            className="zissou-mono text-xs tracking-widest bg-cream text-inkstain zissou-border px-2.5 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {pad2(currentIndex + 1)} / {pad2(images.length)}
          </span>
        </div>
      )}

      <button
        data-viewer-chrome
        onClick={(e) => {
          e.stopPropagation();
          requestClose();
        }}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-cream text-inkstain zissou-border hover:bg-submarine-yellow/40 transition-colors cursor-pointer"
        aria-label="Close viewer"
      >
        <IconClose className="h-5 w-5" />
      </button>

      {/* Stage — embla. Clipped horizontally only, so the photo can travel to
          a thumbnail above or below the stage during the open/close transition. */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center overflow-x-clip"
        onClick={(e) => {
          // Clicks on the photo stay in the viewer; the empty space around it
          // bubbles up and closes, like the rest of the overlay. (Embla
          // swallows the click that ends a swipe, so dragging never closes.)
          if ((e.target as HTMLElement).closest("[data-viewer-media]")) {
            e.stopPropagation();
          }
        }}
      >
        <div ref={emblaRef} className="h-full w-full overflow-x-clip">
          <div className="flex h-full touch-pan-y items-center">
            {images.map((img, i) => (
              <div
                key={img.id}
                className="relative flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-[clamp(16px,2vw,32px)]"
                aria-hidden={i !== currentIndex}
              >
                {/* Only the current photo and its neighbours are mounted, so
                    opening a big post doesn't fetch and decode all of it. */}
                {Math.abs(i - currentIndex) <= 1 && <Media image={img} />}
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows — desktop only */}
        <button
          data-viewer-chrome
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          disabled={!canPrev}
          className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-inkstain zissou-border opacity-60 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity cursor-pointer sm:flex"
          aria-label="Previous image"
        >
          <IconChevron direction="left" className="h-6 w-6" />
        </button>
        <button
          data-viewer-chrome
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          disabled={!canNext}
          className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-inkstain zissou-border opacity-60 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity cursor-pointer sm:flex"
          aria-label="Next image"
        >
          <IconChevron direction="right" className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom: panel (caption or editing) or pill */}
      <div
        data-viewer-chrome
        className="relative z-20 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {hasCaption || isEditing ? (
          <CaptionPanel
            image={image}
            index={currentIndex}
            count={images.length}
            isOwner={!!isOwner}
            isEditing={isEditing}
            draft={draft}
            setDraft={setDraft}
            saving={saving}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            textareaRef={textareaRef}
            onLike={onLike}
            onFeaturedToggle={onFeaturedToggle}
          />
        ) : (
          <ControlPill
            image={image}
            isOwner={!!isOwner}
            onLike={onLike}
            onFeaturedToggle={onFeaturedToggle}
            onStartEdit={startEdit}
          />
        )}
      </div>
    </div>
  );
}

function ControlPill({
  image,
  isOwner,
  onLike,
  onFeaturedToggle,
  onStartEdit,
}: {
  image: PostImage;
  isOwner: boolean;
  onLike?: () => void;
  onFeaturedToggle?: (imageId: string) => void;
  onStartEdit: () => void;
}) {
  return (
    <div className="mx-auto mb-4 flex w-fit items-center gap-1 rounded-full bg-cream zissou-border px-2 py-1 shadow-[4px_4px_0px_rgba(0,0,0,0.15)]">
      <PillButton
        onClick={onLike}
        disabled={!onLike}
        active={image.likedByMe}
        ariaLabel={image.likedByMe ? "Unlike image" : "Like image"}
      >
        <IconHeart filled={image.likedByMe} className="h-4 w-4" />
        {image.likeCount > 0 && (
          <span className="zissou-mono text-xs">{image.likeCount}</span>
        )}
      </PillButton>

      {isOwner && onFeaturedToggle && (
        <PillButton
          onClick={() => onFeaturedToggle(image.id)}
          active={!!image.featured}
          ariaLabel={image.featured ? "Unpin as featured" : "Pin as featured"}
        >
          <IconPin filled={!!image.featured} className="h-4 w-4" />
        </PillButton>
      )}

      {isOwner && (
        <PillButton onClick={onStartEdit} ariaLabel="Add caption">
          <IconPencil className="h-4 w-4" />
        </PillButton>
      )}
    </div>
  );
}

function PillButton({
  children,
  onClick,
  disabled,
  active,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-tracksuit-red text-cream"
          : "text-inkstain hover:bg-submarine-yellow/40"
      }`}
    >
      {children}
    </button>
  );
}

function CaptionPanel({
  image,
  index,
  count,
  isOwner,
  isEditing,
  draft,
  setDraft,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  textareaRef,
  onLike,
  onFeaturedToggle,
}: {
  image: PostImage;
  index: number;
  count: number;
  isOwner: boolean;
  isEditing: boolean;
  draft: string;
  setDraft: (v: string) => void;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onLike?: () => void;
  onFeaturedToggle?: (imageId: string) => void;
}) {
  return (
    <div className="w-full border-t-2 border-inkstain bg-cream text-inkstain">
      <div className="mx-auto flex max-h-[35vh] w-full max-w-3xl flex-col gap-3 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="zissou-mono text-xs tracking-widest text-inkstain/70">
            {pad2(index + 1)} / {pad2(count)}
          </span>

          {isEditing ? (
            <div className="flex items-center gap-1">
              <IconAction
                onClick={onCancelEdit}
                ariaLabel="Cancel"
                disabled={saving}
              >
                <IconClose className="h-4 w-4" />
              </IconAction>
              <IconAction
                onClick={onSaveEdit}
                ariaLabel="Save caption"
                disabled={saving}
                primary
              >
                <IconCheck className="h-4 w-4" />
              </IconAction>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <IconAction
                onClick={onLike}
                ariaLabel={image.likedByMe ? "Unlike image" : "Like image"}
                disabled={!onLike}
                active={image.likedByMe}
              >
                <IconHeart filled={image.likedByMe} className="h-4 w-4" />
                {image.likeCount > 0 && (
                  <span className="zissou-mono text-xs">{image.likeCount}</span>
                )}
              </IconAction>

              {isOwner && onFeaturedToggle && (
                <IconAction
                  onClick={() => onFeaturedToggle(image.id)}
                  ariaLabel={
                    image.featured ? "Unpin as featured" : "Pin as featured"
                  }
                  active={!!image.featured}
                >
                  <IconPin filled={!!image.featured} className="h-4 w-4" />
                </IconAction>
              )}

              {isOwner && (
                <IconAction onClick={onStartEdit} ariaLabel="Edit caption">
                  <IconPencil className="h-4 w-4" />
                </IconAction>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a caption…"
            rows={3}
            className="w-full resize-none bg-transparent font-serif text-base text-inkstain placeholder:text-inkstain/40 focus:outline-none"
            disabled={saving}
          />
        ) : (
          <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-inkstain">
            {image.caption}
          </p>
        )}
      </div>
    </div>
  );
}

function IconAction({
  children,
  onClick,
  ariaLabel,
  disabled,
  active,
  primary,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
}) {
  const tone = primary
    ? "bg-tracksuit-red text-cream hover:bg-tracksuit-red/90"
    : active
      ? "bg-tracksuit-red text-cream"
      : "text-inkstain hover:bg-submarine-yellow/40";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${tone}`}
    >
      {children}
    </button>
  );
}
