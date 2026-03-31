'use client';

import { useEffect, useRef, useState } from 'react';

interface ShareMenuProps {
  postUrl: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export function ShareMenu({ postUrl, postTitle, isOpen, onClose }: ShareMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const copyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        // Fallback for iOS Safari and non-secure contexts
        const textarea = document.createElement('textarea');
        textarea.value = postUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => onClose(), 600);
    } catch {
      // Last resort: prompt user to copy manually
      window.prompt('Copy this link:', postUrl);
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 bg-cream zissou-border zissou-shadow py-2 z-50 min-w-[200px]"
    >
      <button
        onClick={copyLink}
        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-submarine-yellow/30 text-inkstain zissou-mono text-sm transition-none"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span>{copied ? 'Copied!' : 'Copy link'}</span>
      </button>
    </div>
  );
}
