'use client';

import { useEffect, useRef } from 'react';

interface ShareMenuProps {
  postUrl: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export function ShareMenu({ postUrl, postTitle, isOpen, onClose }: ShareMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 bg-cream zissou-border zissou-shadow py-2 z-50 min-w-[200px]"
    >
      <button
        onClick={shareToFacebook}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-submarine-yellow/30 text-inkstain zissou-mono text-sm transition-none"
      >
        <FacebookIcon />
        <span>Share to Facebook</span>
      </button>
      <button
        onClick={copyLink}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-submarine-yellow/30 text-inkstain zissou-mono text-sm transition-none"
      >
        <CopyIcon />
        <span>Copy link</span>
      </button>
    </div>
  );
}
