"use client";

import { useState, useRef, useEffect } from "react";
import { NavCards } from "../composites/NavCards";
import { useTheme } from "@/components/providers/ThemeProvider";

interface SidebarProps {
  minimized?: boolean;
}

export function Sidebar({ minimized = false }: SidebarProps) {
  const theme = useTheme();
  const Branding = theme.Branding;
  const [showRssCard, setShowRssCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const rssRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showRssCard) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rssRef.current && !rssRef.current.contains(e.target as Node)) {
        setShowRssCard(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRssCard(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showRssCard]);

  useEffect(() => {
    if (!showRssCard) setCopied(false);
  }, [showRssCard]);

  const feedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/feed.xml`
    : "/feed.xml";

  const copyFeedUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(feedUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = feedUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this feed URL:", feedUrl);
    }
  };

  return (
    <aside className="sticky top-0 h-screen p-4 flex flex-col overflow-hidden">
      {/* Logo + Branding */}
      {minimized ? (
        <a href="/">
          <img
            src={theme.logo}
            alt={theme.siteName.join(" ")}
            width="56px"
            height="56px"
            className="shrink-0 w-[2.6rem]"
          />
        </a>
      ) : (
        <Branding />
      )}

      {/* Nav Cards */}
      <div className="mt-6">
        <NavCards minimized={minimized} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* RSS */}
      {!minimized && (
        <div className="relative" ref={rssRef}>
          <button
            onClick={() => setShowRssCard(!showRssCard)}
            className="flex items-center gap-2 px-1 pb-2 group cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-tracksuit-red shrink-0">
              <circle cx="6" cy="18" r="3" fill="currentColor" />
              <path d="M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M4 11a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <span className="zissou-heading text-[0.7rem] font-black text-tracksuit-red text-shadow-[1px_1px_0px_var(--submarine-yellow)] group-hover:text-inkstain transition-none">
              RSS Feed
            </span>
          </button>

          {showRssCard && (
            <div className="absolute bottom-full left-0 mb-2 bg-cream zissou-border zissou-shadow p-4 z-50 w-[230px]">
              <p className="zissou-heading text-xs font-bold text-inkstain mb-2">
                What&apos;s RSS?
              </p>
              <p className="zissou-mono text-[10px] text-inkstain/60 leading-relaxed mb-3">
                RSS lets you subscribe to this site in a newsreader app like Feedly, NetNewsWire, or Inoreader. New posts show up automatically — no algorithms.
              </p>
              <button
                onClick={copyFeedUrl}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-tracksuit-red text-cream zissou-heading text-xs font-bold hover:bg-inkstain transition-none cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Feed URL
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
