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
    </aside>
  );
}
