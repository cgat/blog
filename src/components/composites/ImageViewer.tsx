"use client";

import Image from "next/image";
import { PostImage } from "@/types/post";
import { useEffect } from "react";
import { usePanelMode } from "../layout/AppLayout";

interface ImageViewerProps {
  image: PostImage;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function ViewerCard({ image, onClose, onPrev, onNext }: ImageViewerProps) {
  return (
    <div className="bg-white zissou-border zissou-shadow flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center px-4 py-2 border-b-2 border-inkstain">
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

      {/* Image */}
      <div className="bg-inkstain/5">
        <Image
          src={image.url}
          alt={image.alt || image.caption || "Image"}
          width={image.width}
          height={image.height}
          className="w-full h-auto"
        />
      </div>

      {/* Caption */}
      {image.caption && (
        <div className="px-4 py-3 border-t-2 border-inkstain">
          <p className="zissou-mono text-sm text-inkstain/80 leading-relaxed">
            {image.caption}
          </p>
        </div>
      )}
    </div>
  );
}

export function ImageViewer({
  image,
  onClose,
  onPrev,
  onNext,
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
        onClose={onClose}
        onPrev={onPrev}
        onNext={onNext}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inkstain/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <ViewerCard
          image={image}
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
