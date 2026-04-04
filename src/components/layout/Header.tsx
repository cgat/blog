"use client";

import { useState, useRef, useEffect } from "react";
import { NavCards } from "../composites/NavCards";

export function Header() {
  const [showNav, setShowNav] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setShowNav(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b-2 border-inkstain bg-[white] sticky top-0 z-40" ref={navRef}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex flex-row">
          <img
            src="/filing_cabinet2.svg"
            alt=""
            width="56px"
            height="56px"
            className="mr-1 w-[2.6rem]"
          />
          <h2 className="zissou-heading text-[1.37rem] text-tracksuit-red font-black text-shadow-[2px_2px_0px_var(--submarine-yellow)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
            <span>The Archive</span>
            <span className="inline-block text-[1rem]">of Small Things</span>
          </h2>
        </a>

        {/* Folder tab toggle */}
        <button
          onClick={() => setShowNav(!showNav)}
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
        <div className="border-t-2 border-inkstain px-4 py-3">
          <NavCards horizontal />
        </div>
      )}
    </header>
  );
}
