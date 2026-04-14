"use client";

import { useState, useRef, useEffect } from "react";
import { NavCards } from "../composites/NavCards";
import { useTheme } from "@/components/providers/ThemeProvider";

interface HeaderProps {
  onNavToggle?: (open: boolean) => void;
}

export function Header({ onNavToggle }: HeaderProps) {
  const theme = useTheme();
  const Branding = theme.Branding;
  const [showNav, setShowNav] = useState(false);

  const toggleNav = (open: boolean) => {
    setShowNav(open);
    onNavToggle?.(open);
  };
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        toggleNav(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b-2 border-inkstain bg-nav-card sticky top-0 z-40" ref={navRef}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Branding />

        {/* Folder tab toggle */}
        <button
          onClick={() => toggleNav(!showNav)}
          className="p-2 hover:bg-submarine-yellow/20 transition-none"
          aria-label="Navigation"
        >
          {/* File folder tab icon — Wes Anderson index card style */}
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none" className="text-inkstain">
            <path
              d="M2 6h24v16H2V6z"
              stroke="currentColor"
              strokeWidth="2"
              fill="var(--cream)"
            />
            <path
              d="M2 6l3-4h8l3 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="var(--submarine-yellow)"
            />
          </svg>
        </button>
      </div>

      {/* Expandable nav tray */}
      {showNav && (
        <div className="py-3 overflow-x-auto">
          <NavCards horizontal />
        </div>
      )}
    </header>
  );
}
