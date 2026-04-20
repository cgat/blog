"use client";

import Image from "next/image";
import { PostImage } from "@/types/post";
import { useEffect, useCallback, useState, useRef } from "react";
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

function Media({ image }: { image: PostImage }) {
  if (isVideo(image)) {
    return (
      <video
        src={image.url}
        controls
        playsInline
        className="block"
        style={{ maxHeight: "85vh", maxWidth: "min(90vw, 1400px)" }}
      />
    );
  }
  return (
    <Image
      src={image.url}
      alt={image.alt || "Image"}
      width={image.width}
      height={image.height}
      sizes="(max-width: 768px) 90vw, min(90vw, 1400px)"
      className="block"
      style={{
        maxHeight: "85vh",
        maxWidth: "min(90vw, 1400px)",
        width: "auto",
        height: "auto",
      }}
    />
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

function IconChevron({ direction, className }: { direction: "left" | "right"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {direction === "left" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

function IconHeart({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconPin({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
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
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext, isEditing]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
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
      className="fixed inset-0 z-50 flex flex-col bg-inkstain/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {!hasCaption && !isEditing && (
        <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2">
          <span
            className="zissou-mono text-xs tracking-widest bg-cream text-inkstain zissou-border px-2.5 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {pad2(currentIndex + 1)} / {pad2(images.length)}
          </span>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-cream text-inkstain zissou-border hover:bg-submarine-yellow/40 transition-colors cursor-pointer"
        aria-label="Close viewer"
      >
        <IconClose className="h-5 w-5" />
      </button>

      {/* Stage — embla */}
      <div
        className="relative flex flex-1 items-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={emblaRef} className="h-full w-full overflow-hidden">
          <div className="flex h-full touch-pan-y items-center">
            {images.map((img, i) => (
              <div
                key={img.id}
                className="relative flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-[clamp(16px,2vw,32px)]"
                aria-hidden={i !== currentIndex}
              >
                <Media image={img} />
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows — desktop only */}
        <button
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
              <IconAction onClick={onCancelEdit} ariaLabel="Cancel" disabled={saving}>
                <IconClose className="h-4 w-4" />
              </IconAction>
              <IconAction onClick={onSaveEdit} ariaLabel="Save caption" disabled={saving} primary>
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
                  ariaLabel={image.featured ? "Unpin as featured" : "Pin as featured"}
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
