"use client";

import { NavCards } from "../composites/NavCards";

interface SidebarProps {
  minimized?: boolean;
}

export function Sidebar({ minimized = false }: SidebarProps) {
  return (
    <aside className="sticky top-0 h-screen p-4 flex flex-col overflow-hidden">
      {/* Logo + Branding */}
      <div className="flex flex-row items-start gap-1">
        <a href="/">
          <img
            src="/filing_cabinet2.svg"
            alt="The Archive of Small Things"
            width="56px"
            height="56px"
            className="shrink-0 w-[2.6rem]"
          />
        </a>
        {!minimized && (
          <a href="/">
            <h2 className="zissou-heading text-[1.37rem] text-tracksuit-red font-black text-shadow-[2px_2px_0px_var(--submarine-yellow)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
              <span>The Archive</span>
              <span className="inline-block text-[1rem]">of Small Things</span>
            </h2>
          </a>
        )}
      </div>

      {/* Nav Cards */}
      <div className="mt-6">
        <NavCards minimized={minimized} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* RSS link */}
      {!minimized && (
        <a
          href="/feed.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-1 pb-2 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-tracksuit-red shrink-0">
            <circle cx="6" cy="18" r="3" fill="currentColor" />
            <path d="M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M4 11a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
          <span className="zissou-heading text-[0.7rem] font-black text-tracksuit-red text-shadow-[1px_1px_0px_var(--submarine-yellow)] group-hover:text-inkstain transition-none">
            RSS Feed
          </span>
        </a>
      )}
    </aside>
  );
}
