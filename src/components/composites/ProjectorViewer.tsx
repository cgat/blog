"use client";

import Image from "next/image";
import { PostImage } from "@/types/post";
import { useEffect, useCallback, useState, useRef } from "react";

// ============================================================================
// Projector body SVG — flat illustration, front-3/4 view
// ============================================================================

function ProjectorBody({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shadow beneath body */}
      <ellipse cx="140" cy="73" rx="110" ry="3" fill="#2c2c2c" opacity="0.22" />

      {/* Main body — rounded rect */}
      <rect
        x="34"
        y="6"
        width="212"
        height="52"
        rx="7"
        ry="7"
        fill="#d4b896"
        stroke="#8b7355"
        strokeWidth="1.2"
      />

      {/* Top body highlight */}
      <rect x="34" y="6" width="212" height="7" rx="7" ry="7" fill="#e8d4ad" opacity="0.5" />

      {/* Bottom body shadow */}
      <rect x="34" y="49" width="212" height="9" rx="2" ry="2" fill="#8b7355" opacity="0.2" />

      {/* Lens barrel — front-left */}
      <rect
        x="60"
        y="24"
        width="38"
        height="30"
        rx="3"
        fill="#b59a75"
        stroke="#8b7355"
        strokeWidth="1.2"
      />
      {/* Lens glass — restored to original size (r=11) */}
      <circle cx="79" cy="39" r="11" fill="#1a1a1a" stroke="#555" strokeWidth="1.4" />
      <circle cx="79" cy="39" r="7" fill="none" stroke="#666" strokeWidth="0.6" />
      <circle cx="79" cy="39" r="3.5" fill="#0d0d0d" />
      {/* Subtle lens reflection */}
      <ellipse cx="76.5" cy="36" rx="2" ry="1" fill="#fdf5e6" opacity="0.3" />

      {/* Vents on the left body edge */}
      <rect x="40" y="16" width="14" height="1.4" rx="0.5" fill="#8b7355" opacity="0.55" />
      <rect x="40" y="20" width="14" height="1.4" rx="0.5" fill="#8b7355" opacity="0.55" />
      <rect x="40" y="24" width="14" height="1.4" rx="0.5" fill="#8b7355" opacity="0.55" />

      {/* Speaker grille dots — mid-right */}
      <circle cx="145" cy="17" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="151" cy="17" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="157" cy="17" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="145" cy="21" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="151" cy="21" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="157" cy="21" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="145" cy="25" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="151" cy="25" r="0.85" fill="#8b7355" opacity="0.5" />
      <circle cx="157" cy="25" r="0.85" fill="#8b7355" opacity="0.5" />

      {/* Clicker mount — wider pill so two buttons sit comfortably inside */}
      <rect x="175" y="19" width="68" height="22" rx="11" fill="#8b7355" opacity="0.3" />
      <rect x="177" y="20.5" width="64" height="19" rx="9.5" fill="#b59a75" stroke="#8b7355" strokeWidth="0.7" />

      {/* Feet */}
      <rect x="54" y="58" width="22" height="4" rx="1.5" fill="#4a3a25" />
      <rect x="204" y="58" width="22" height="4" rx="1.5" fill="#4a3a25" />
    </svg>
  );
}

// ============================================================================
// Slide tray — dots on top of the projector, animated active indicator
// ============================================================================

const DOT_SIZE = 6;
const DOT_GAP = 6;
const CELL_WIDTH = DOT_SIZE + DOT_GAP;
const ACTIVE_SIZE = 10;

function SlideTray({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}) {
  if (total <= 1) return null;

  const maxDots = 12;
  let startIndex = 0;
  let endIndex = total;
  if (total > maxDots) {
    const half = Math.floor(maxDots / 2);
    startIndex = Math.max(0, current - half);
    endIndex = startIndex + maxDots;
    if (endIndex > total) {
      endIndex = total;
      startIndex = endIndex - maxDots;
    }
  }

  const dotCount = endIndex - startIndex;
  const activePosInWindow = current - startIndex;
  // Center of dot N = N * CELL_WIDTH + DOT_SIZE/2
  // Indicator left = that center - ACTIVE_SIZE/2
  const indicatorX =
    activePosInWindow * CELL_WIDTH + DOT_SIZE / 2 - ACTIVE_SIZE / 2;

  return (
    <div className="flex items-center justify-center gap-1.5 select-none">
      {startIndex > 0 && (
        <span className="zissou-mono text-[10px] text-cream/30">&hellip;</span>
      )}
      <div
        className="relative flex items-center"
        style={{ gap: DOT_GAP, height: ACTIVE_SIZE + 2 }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const idx = startIndex + i;
          return (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onDotClick(idx);
              }}
              className="block rounded-full cursor-pointer hover:scale-125 transition-transform"
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                backgroundColor: "rgba(253,245,230,0.4)",
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          );
        })}
        {/* Animated active indicator */}
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{
            width: ACTIVE_SIZE,
            height: ACTIVE_SIZE,
            top: "50%",
            left: 0,
            backgroundColor: "var(--color-submarine-yellow)",
            boxShadow: "0 0 6px rgba(230,204,87,0.6)",
            border: "1.5px solid rgba(253,245,230,0.5)",
            transform: `translate(${indicatorX}px, -50%)`,
            transition: "transform 300ms cubic-bezier(0.2, 0, 0, 1)",
          }}
        />
      </div>
      {endIndex < total && (
        <span className="zissou-mono text-[10px] text-cream/30">&hellip;</span>
      )}
    </div>
  );
}

// ============================================================================
// Clicker button — overlays the mount ring on the projector body
// ============================================================================

function Clicker({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev: () => void;
}) {
  const buttonStyle = {
    width: 22,
    height: 22,
    backgroundColor: "#b59a75",
    boxShadow:
      "inset 0 1px 0 rgba(232,212,173,0.55), 0 1px 1.5px rgba(74,58,37,0.4)",
    border: "1.3px solid #8b7355",
    transition: "transform 120ms ease-out",
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="rounded-full flex items-center justify-center active:scale-90 cursor-pointer"
        style={buttonStyle}
        aria-label="Previous slide"
      >
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8L10 13"
            stroke="#4a3a25"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="rounded-full flex items-center justify-center active:scale-90 cursor-pointer"
        style={buttonStyle}
        aria-label="Next slide"
      >
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3L11 8L6 13"
            stroke="#4a3a25"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// Simple square prev / next nav buttons (white bg, black border)
// ============================================================================

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      style={{
        width: 28,
        height: 28,
        backgroundColor: "#ffffff",
        border: "2px solid var(--inkstain)",
        color: "var(--inkstain)",
        fontFamily: "var(--font-courier-prime), monospace",
        fontWeight: 700,
        fontSize: 15,
        lineHeight: 1,
      }}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
    >
      {direction === "prev" ? "<" : ">"}
    </button>
  );
}

// ============================================================================
// Screen stand — the tripod legs below the screen
// ============================================================================

function ScreenStand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 50"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line
        x1="100"
        y1="0"
        x2="100"
        y2="16"
        stroke="#8b7355"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="16"
        x2="52"
        y2="46"
        stroke="#8b7355"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="16"
        x2="148"
        y2="46"
        stroke="#8b7355"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="52" cy="46" r="2.5" fill="#8b7355" />
      <circle cx="148" cy="46" r="2.5" fill="#8b7355" />
      <circle cx="100" cy="16" r="3" fill="#c4a882" stroke="#8b7355" strokeWidth="1.5" />
    </svg>
  );
}

// ============================================================================
// Icons
// ============================================================================

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const ThumbsUpIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zm-9 11H3a2 2 0 01-2-2v-7a2 2 0 012-2h2"
    />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zm9-13h2a2 2 0 012 2v7a2 2 0 01-2 2h-2"
    />
  </svg>
);

function ShameToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="zissou-border zissou-shadow overflow-hidden">
        <img src="/images/shame.jpg" alt="Shame!" className="w-48" />
      </div>
    </div>
  );
}

// ============================================================================
// Main ProjectorViewer
// ============================================================================

interface ProjectorViewerProps {
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

export function ProjectorViewer({
  images,
  currentIndex,
  isOwner,
  onClose,
  onNavigate,
  onLike,
  onCaptionSave,
  onFeaturedToggle,
}: ProjectorViewerProps) {
  const image = images[currentIndex];

  // --- Caption editing state ---
  const [showShame, setShowShame] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(image?.caption || "");
  const [isSaving, setIsSaving] = useState(false);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCaptionDraft(image?.caption || "");
    setIsEditingCaption(false);
  }, [image?.id, image?.caption]);

  useEffect(() => {
    if (isEditingCaption && captionInputRef.current) {
      captionInputRef.current.focus();
      captionInputRef.current.selectionStart =
        captionInputRef.current.value.length;
    }
  }, [isEditingCaption]);

  const handleDislike = () => {
    setShowShame(true);
    setTimeout(() => setShowShame(false), 1000);
  };

  const handleCaptionSave = async () => {
    if (!image) return;
    const trimmed = captionDraft.trim();
    const newCaption = trimmed || null;
    if (newCaption === (image.caption || null)) {
      setIsEditingCaption(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/image-captions/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: newCaption }),
      });
      if (res.ok) {
        onCaptionSave?.(image.id, newCaption);
        setIsEditingCaption(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCaptionSave();
    }
    if (e.key === "Escape") {
      setCaptionDraft(image?.caption || "");
      setIsEditingCaption(false);
    }
  };

  // --- Crossfade state machine ---
  // baseIdx: image currently shown as the fully-opaque base layer.
  // overlayIdx: image being faded IN on top (null = no active transition).
  // When overlayIdx's fade animation ends, we commit it to base.
  // If a new navigate arrives mid-transition, we commit the in-flight overlay
  // to base immediately (so the user never sees a pop back to an older image)
  // and start a new overlay.
  const [baseIdx, setBaseIdx] = useState(currentIndex);
  const [overlayIdx, setOverlayIdx] = useState<number | null>(null);

  useEffect(() => {
    if (currentIndex === baseIdx && overlayIdx === null) return;
    if (currentIndex === overlayIdx) return;

    // If mid-transition, commit the in-flight overlay to base before starting
    // the new fade.
    if (overlayIdx !== null && overlayIdx !== currentIndex) {
      setBaseIdx(overlayIdx);
    }

    if (currentIndex !== baseIdx) {
      setOverlayIdx(currentIndex);
    } else {
      // Navigated back to the base image while a transition was in flight.
      setOverlayIdx(null);
    }
  }, [currentIndex, baseIdx, overlayIdx]);

  const handleOverlayAnimationEnd = useCallback(() => {
    setBaseIdx((prev) => (overlayIdx !== null ? overlayIdx : prev));
    setOverlayIdx(null);
  }, [overlayIdx]);

  // --- Navigation handlers ---
  const handlePrev = useCallback(() => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, images.length, onNavigate]);

  // --- Keyboard navigation ---
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (isEditingCaption) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, handlePrev, handleNext, isEditingCaption]);

  // --- Lock body scroll while open ---
  // Uses the `position: fixed` technique so touchmove/wheel on the modal
  // can't scroll-chain into the page underneath (including iOS rubber-band).
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const original = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.overflow = original.overflow;
      body.style.position = original.position;
      body.style.top = original.top;
      body.style.width = original.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // --- Touch swipe ---
  const touchStartRef = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartRef.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current;
      touchStartRef.current = null;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) handleNext();
        else handlePrev();
      }
    },
    [handleNext, handlePrev],
  );

  if (!image) return null;

  const baseImage = images[baseIdx] ?? image;
  const overlayImage = overlayIdx !== null ? images[overlayIdx] : null;

  // Neighbor preload targets (skip videos, dedupe, skip current)
  const preloadIndices = Array.from(
    new Set(
      [currentIndex - 1, currentIndex + 1].map((i) =>
        i < 0 ? images.length - 1 : i >= images.length ? 0 : i,
      ),
    ),
  ).filter((i) => i !== currentIndex && i !== baseIdx && !isVideo(images[i]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain"
      style={{ touchAction: "none" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-inkstain/80" onClick={onClose} />

      {/* Assembly — screen size is capped by both viewport width and the
          remaining vertical budget (assembly chrome below the screen) so the
          screen scales up on tall viewports without the toolbar falling off
          the bottom. */}
      <div
        className="relative flex flex-col items-center
          w-[min(94vw,672px,calc((100vh-320px)*3/4))]
          md:w-[min(94vw,960px,calc((100vh-260px)*4/3))]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-inkstain/60 hover:bg-tracksuit-red text-cream/70 hover:text-cream transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Mobile-only caption above screen (full width) */}
        <div className="md:hidden w-full mb-2">
          <CaptionPlaque
            image={image}
            isOwner={isOwner}
            isEditing={isEditingCaption}
            draft={captionDraft}
            isSaving={isSaving}
            inputRef={captionInputRef}
            onStartEdit={() => setIsEditingCaption(true)}
            onDraftChange={setCaptionDraft}
            onSave={handleCaptionSave}
            onCancel={() => {
              setCaptionDraft(image?.caption || "");
              setIsEditingCaption(false);
            }}
            onKeyDown={handleCaptionKeyDown}
          />
        </div>

        {/* Housing bar — roller at top of pull-down screen */}
        <div
          className="w-full h-3 rounded-t-sm"
          style={{
            backgroundColor: "#c4a882",
            borderBottom: "1.5px solid #8b7355",
            boxShadow:
              "inset 0 1px 0 rgba(232,212,173,0.6), 0 1px 2px rgba(0,0,0,0.15)",
          }}
        />

        {/* Screen assembly — with brightness flicker on slide change */}
        <div
          className="relative w-full aspect-3/4 md:aspect-4/3 bg-cream overflow-hidden"
          style={{
            boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
            borderLeft: "1.5px solid #d4b896",
            borderRight: "1.5px solid #d4b896",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Base layer — always fully opaque, swapped when a transition
              completes. */}
          <div className="absolute inset-0">
            {isVideo(baseImage) ? (
              <video
                key={baseImage.url}
                src={baseImage.url}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={baseImage.url}
                alt={baseImage.alt || baseImage.caption || "Image"}
                fill
                sizes="(max-width: 768px) 90vw, 768px"
                style={{ objectFit: "contain" }}
                priority
              />
            )}
          </div>

          {/* Overlay layer — keyed on overlayIdx so each transition remounts
              fresh and plays the fade-in once. */}
          {overlayIdx !== null && overlayImage && (
            <div
              key={`overlay-${overlayIdx}`}
              className="absolute inset-0"
              style={{
                animation: "projector-fade-in 180ms ease-out forwards",
              }}
              onAnimationEnd={handleOverlayAnimationEnd}
            >
              {isVideo(overlayImage) ? (
                <video
                  key={overlayImage.url}
                  src={overlayImage.url}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={overlayImage.url}
                  alt={overlayImage.alt || overlayImage.caption || "Image"}
                  fill
                  sizes="(max-width: 768px) 90vw, 768px"
                  style={{ objectFit: "contain" }}
                  priority
                />
              )}
            </div>
          )}

          {/* Hidden neighbor preload */}
          <div
            aria-hidden
            className="pointer-events-none"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              overflow: "hidden",
            }}
          >
            {preloadIndices.map((i) => (
              <Image
                key={`preload-${images[i].id}`}
                src={images[i].url}
                alt=""
                width={images[i].width || 800}
                height={images[i].height || 600}
                sizes="(max-width: 768px) 90vw, 768px"
              />
            ))}
          </div>
        </div>

        {/* Screen bottom pull-tab */}
        <div
          className="w-full h-1.5"
          style={{ backgroundColor: "#d4b896", borderTop: "1px solid #c4a882" }}
        />
        <div
          className="w-8 h-2 rounded-b-sm"
          style={{ backgroundColor: "#c4a882" }}
        />

        {/* Below-screen area — tripod centered; on desktop the caption
            floats absolutely at the right (300px). The projector illustration
            is commented out until the look is ready.  */}
        <div
          className="relative w-full flex flex-col items-center"
          style={{
            minHeight:
              (isOwner || image.caption) && images.length >= 1 ? 90 : undefined,
          }}
        >
          <ScreenStand className="w-24 h-auto mt-0 pointer-events-none select-none opacity-60" />

          {/* Desktop-only caption at the right (300px) */}
          <div
            className="hidden md:block absolute top-0 right-0 pointer-events-auto"
            style={{ width: 300 }}
          >
            <CaptionPlaque
              image={image}
              isOwner={isOwner}
              isEditing={isEditingCaption}
              draft={captionDraft}
              isSaving={isSaving}
              inputRef={captionInputRef}
              onStartEdit={() => setIsEditingCaption(true)}
              onDraftChange={setCaptionDraft}
              onSave={handleCaptionSave}
              onCancel={() => {
                setCaptionDraft(image?.caption || "");
                setIsEditingCaption(false);
              }}
              onKeyDown={handleCaptionKeyDown}
            />
          </div>

          {/*
          // --- Projector illustration (disabled until design is ready) ---
          // Kept here so we can re-enable without re-deriving the math.
          {images.length > 1 && (
            <div
              className="absolute pointer-events-auto"
              style={{
                top: 0,
                left: 0,
                width: "clamp(220px, 42%, 320px)",
              }}
            >
              <div
                className="relative"
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
              >
                <ProjectorBody className="block w-full h-auto" />
                <div
                  className="absolute"
                  style={{
                    top: "37.5%",
                    left: "74.6%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Clicker onNext={handleNext} onPrev={handlePrev} />
                </div>
                <div
                  key={`lens-${currentIndex}`}
                  aria-hidden
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    top: "48.75%",
                    left: "28.2%",
                    width: "10%",
                    aspectRatio: "1 / 1",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "var(--color-submarine-yellow)",
                    boxShadow: "0 0 14px 6px rgba(230,204,87,0.65)",
                    animation: "projector-lens-pulse 360ms ease-out",
                    opacity: 0,
                  }}
                />
              </div>
            </div>
          )}
          */}
        </div>

        {/* Navigation row — square prev / next buttons flanking the dots */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <NavButton direction="prev" onClick={handlePrev} />
            <SlideTray
              total={images.length}
              current={currentIndex}
              onDotClick={onNavigate}
            />
            <NavButton direction="next" onClick={handleNext} />
          </div>
        )}

        {/* Toolbar — white bg, black border, square aesthetic */}
        <div
          className="flex items-center gap-3 mt-3 px-3 py-1.5 bg-white"
          style={{ border: "2px solid var(--inkstain)" }}
        >
          {isOwner && onFeaturedToggle && (
            <button
              onClick={() => onFeaturedToggle(image.id)}
              className={`p-1 transition-transform duration-150 active:scale-110 cursor-pointer ${
                image.featured
                  ? "text-submarine-yellow"
                  : "text-inkstain/40 hover:text-inkstain"
              }`}
              aria-label={image.featured ? "Remove featured" : "Set as featured"}
            >
              <StarIcon filled={image.featured} />
            </button>
          )}
          <button
            onClick={onLike}
            className={`flex items-center gap-1 p-1 transition-transform duration-150 active:scale-110 cursor-pointer ${
              image.likedByMe
                ? "text-deep-ocean-teal"
                : "text-inkstain/40 hover:text-inkstain"
            }`}
            aria-label="Like"
          >
            <ThumbsUpIcon filled={image.likedByMe} />
            {image.likeCount > 0 && (
              <span className="zissou-mono text-xs text-inkstain/70">
                {image.likeCount}
              </span>
            )}
          </button>
          <button
            onClick={handleDislike}
            className="p-1 text-inkstain/40 hover:text-inkstain transition-transform duration-150 active:scale-110 cursor-pointer"
            aria-label="Dislike"
          >
            <ThumbsDownIcon />
          </button>
        </div>
      </div>

      <ShameToast visible={showShame} />
    </div>
  );
}

// ============================================================================
// Caption plaque — extracted for reuse in single / multi image layouts
// ============================================================================

function CaptionPlaque({
  image,
  isOwner,
  isEditing,
  draft,
  isSaving,
  inputRef,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  onKeyDown,
}: {
  image: PostImage;
  isOwner?: boolean;
  isEditing: boolean;
  draft: string;
  isSaving: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onStartEdit: () => void;
  onDraftChange: (s: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  if (!isOwner && !image.caption) return null;

  return (
    <div
      className="w-full bg-white px-4 py-3"
      style={{ border: "2px solid var(--inkstain)" }}
    >
      {isOwner ? (
        isEditing ? (
          <>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Add a caption..."
              rows={2}
              maxLength={500}
              className="w-full zissou-mono text-xs text-inkstain leading-relaxed bg-transparent border-0 border-b border-dashed border-inkstain/30 focus:border-inkstain outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={onCancel}
                className="zissou-mono text-xs uppercase text-inkstain/50 hover:text-tracksuit-red cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="zissou-mono text-xs uppercase text-inkstain hover:text-tracksuit-red disabled:text-inkstain/30 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onStartEdit}
            className="w-full text-left group cursor-pointer"
          >
            {image.caption ? (
              <p className="zissou-mono text-xs text-inkstain leading-relaxed line-clamp-2">
                {image.caption}
                <span className="ml-2 text-inkstain/40 group-hover:text-inkstain text-xs uppercase">
                  Edit
                </span>
              </p>
            ) : (
              <p className="zissou-mono text-xs text-inkstain/50 hover:text-inkstain">
                + Add caption
              </p>
            )}
          </button>
        )
      ) : (
        <p className="zissou-mono text-xs text-inkstain leading-relaxed line-clamp-2">
          {image.caption}
        </p>
      )}
    </div>
  );
}
