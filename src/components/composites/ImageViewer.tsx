"use client";

import Image from "next/image";
import { PostImage } from "@/types/post";
import { useEffect, useState, useRef } from "react";
import { usePanelMode } from "../layout/AppLayout";

interface ImageViewerProps {
  image: PostImage;
  isOwner?: boolean;
  constrained?: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onLike?: () => void;
  onCaptionSave?: (imageId: string, caption: string | null) => void;
  onFeaturedToggle?: (imageId: string) => void;
}

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const ThumbsUpIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zm-9 11H3a2 2 0 01-2-2v-7a2 2 0 012-2h2"
    />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
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
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="zissou-border zissou-shadow overflow-hidden">
        <img src="/images/shame.jpg" alt="Shame!" className="w-48" />
      </div>
    </div>
  );
}

function ViewerCard({ image, isOwner, constrained, onClose, onPrev, onNext, onLike, onCaptionSave, onFeaturedToggle }: ImageViewerProps) {
  const [showShame, setShowShame] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(image.caption || "");
  const [isSaving, setIsSaving] = useState(false);
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft when image changes (navigating between images)
  useEffect(() => {
    setCaptionDraft(image.caption || "");
    setIsEditingCaption(false);
  }, [image.id, image.caption]);

  useEffect(() => {
    if (isEditingCaption && captionInputRef.current) {
      captionInputRef.current.focus();
      captionInputRef.current.selectionStart = captionInputRef.current.value.length;
    }
  }, [isEditingCaption]);

  const handleDislike = () => {
    setShowShame(true);
    setTimeout(() => setShowShame(false), 1000);
  };

  const handleCaptionSave = async () => {
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
      setCaptionDraft(image.caption || "");
      setIsEditingCaption(false);
    }
  };

  return (
    <div className={`bg-white zissou-border zissou-shadow flex flex-col ${constrained ? 'max-h-[calc(100vh-2rem)] w-fit max-w-full' : ''}`}>
      {/* Toolbar */}
      <div className="flex justify-between items-center px-4 py-2 border-b-2 border-inkstain shrink-0">
        <div className="flex gap-1">
          {onPrev && (
            <button
              onClick={onPrev}
              className="p-1 text-inkstain/40 hover:text-inkstain transition-colors"
              aria-label="Previous image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="p-1 text-inkstain/40 hover:text-inkstain transition-colors"
              aria-label="Next image"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isOwner && onFeaturedToggle && (
            <button
              onClick={() => onFeaturedToggle(image.id)}
              className={`p-1 transition-transform duration-150 active:scale-110 ${
                image.featured
                  ? 'text-submarine-yellow'
                  : 'text-inkstain/30 hover:text-inkstain/60'
              }`}
              aria-label={image.featured ? "Remove featured" : "Set as featured"}
            >
              <StarIcon filled={image.featured} />
            </button>
          )}
          <button
            onClick={onLike}
            className={`flex items-center gap-1 p-1 transition-transform duration-150 active:scale-110 ${
              image.likedByMe
                ? 'text-deep-ocean-teal'
                : 'text-inkstain/30 hover:text-inkstain/60'
            }`}
            aria-label="Like"
          >
            <ThumbsUpIcon filled={image.likedByMe} />
            {image.likeCount > 0 && (
              <span className="zissou-mono text-xs">{image.likeCount}</span>
            )}
          </button>
          <button
            onClick={handleDislike}
            className="p-1 text-inkstain/30 hover:text-inkstain/60 transition-transform duration-150 active:scale-110"
            aria-label="Dislike"
          >
            <ThumbsDownIcon />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-inkstain/40 hover:text-tracksuit-red transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Image / Video */}
      <div className="bg-inkstain/5 min-h-0">
        {image.mimeType?.startsWith('video/') ? (
          <video
            src={image.url}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto"
            style={constrained ? { maxHeight: 'calc(100vh - 10rem)' } : undefined}
          />
        ) : (
          <Image
            src={image.url}
            alt={image.alt || image.caption || "Image"}
            width={image.width}
            height={image.height}
            className="w-full h-auto"
            style={constrained ? { maxHeight: 'calc(100vh - 10rem)' } : undefined}
          />
        )}
      </div>

      {/* Caption */}
      {isOwner ? (
        <div className="px-4 py-3 border-t-2 border-inkstain shrink-0">
          {isEditingCaption ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={captionInputRef}
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                onKeyDown={handleCaptionKeyDown}
                placeholder="Add a caption..."
                rows={2}
                maxLength={500}
                className="w-full zissou-mono text-sm text-inkstain/80 leading-relaxed bg-transparent border-0 border-b-2 border-dashed border-inkstain/30 focus:border-solid focus:border-deep-ocean-teal outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setCaptionDraft(image.caption || "");
                    setIsEditingCaption(false);
                  }}
                  className="zissou-mono text-xs uppercase text-inkstain/40 hover:text-tracksuit-red"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaptionSave}
                  disabled={isSaving}
                  className="zissou-mono text-xs uppercase text-deep-ocean-teal hover:text-tracksuit-red disabled:text-inkstain/30"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingCaption(true)}
              className="w-full text-left group"
            >
              {image.caption ? (
                <p className="zissou-mono text-sm text-inkstain/80 leading-relaxed group-hover:text-inkstain">
                  {image.caption}
                  <span className="ml-2 text-inkstain/30 group-hover:text-deep-ocean-teal text-xs uppercase">Edit</span>
                </p>
              ) : (
                <p className="zissou-mono text-sm text-inkstain/30 hover:text-deep-ocean-teal">
                  + Add caption
                </p>
              )}
            </button>
          )}
        </div>
      ) : image.caption ? (
        <div className="px-4 py-3 border-t-2 border-inkstain shrink-0">
          <p className="zissou-mono text-sm text-inkstain/80 leading-relaxed">
            {image.caption}
          </p>
        </div>
      ) : null}
      <ShameToast visible={showShame} />
    </div>
  );
}

export function ImageViewer({
  image,
  isOwner,
  onClose,
  onPrev,
  onNext,
  onLike,
  onCaptionSave,
  onFeaturedToggle,
}: ImageViewerProps) {
  const mode = usePanelMode();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  if (mode === "inline") {
    return (
      <ViewerCard
        image={image}
        isOwner={isOwner}
        constrained
        onClose={onClose}
        onPrev={onPrev}
        onNext={onNext}
        onLike={onLike}
        onCaptionSave={onCaptionSave}
        onFeaturedToggle={onFeaturedToggle}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inkstain/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <ViewerCard
          image={image}
          isOwner={isOwner}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
          onCaptionSave={onCaptionSave}
        />
      </div>
    </div>
  );
}
