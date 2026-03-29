"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar } from "../primitives/Avatar";
import { Button } from "../primitives/Button";
import { useState, useRef, useEffect } from "react";

interface SidebarProps {
  minimized?: boolean;
}

export function Sidebar({ minimized = false }: SidebarProps) {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="sticky top-0 h-screen p-4 flex flex-col overflow-hidden">
      {/* Logo + Branding */}
      <div className="flex flex-row items-start gap-1">
        <img
          src="/filing_cabinet2.svg"
          alt="The Archive of Small Things"
          width="56px"
          height="56px"
          className="shrink-0 w-[2.6rem]"
        />
        {!minimized && (
          <h2 className="zissou-heading text-[1.37rem] text-tracksuit-red font-black text-shadow-[2px_2px_0px_var(--submarine-yellow)] tracking-[0.2px]! leading-[1.1]! flex flex-col">
            <span>The Archive</span>
            <span className="inline-block text-[1rem]">of Small Things</span>
          </h2>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Auth */}
      <div className="relative" ref={dropdownRef}>
        {status === "loading" ? (
          <div className="w-10 h-10 bg-cream zissou-border rounded-full" />
        ) : session ? (
          <>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2"
            >
              <Avatar
                src={session.user?.image}
                fallback={session.user?.name || ""}
                size="sm"
              />
              {!minimized && (
                <svg
                  className="w-4 h-4 text-inkstain"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {showDropdown && (
              <div className="absolute left-0 bottom-full mb-2 bg-cream zissou-border zissou-shadow py-2 min-w-[150px]">
                <a
                  href="/private"
                  className="block px-4 py-2 zissou-mono text-sm text-inkstain hover:bg-submarine-yellow/30 transition-none"
                >
                  Private feed
                </a>
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left zissou-mono text-sm text-inkstain hover:bg-submarine-yellow/30 transition-none"
                >
                  Sign out
                </button>
              </div>
            )}
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => signIn("google")}>
            {minimized ? "..." : "Sign in"}
          </Button>
        )}
      </div>
    </aside>
  );
}
