"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar } from "../primitives/Avatar";
import { Button } from "../primitives/Button";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  blogName?: string;
}

export function Header({
  blogName = "The Archive of Small Things",
}: HeaderProps) {
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
    <header className="border-b-2 border-inkstain bg-[white] sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex flex-row">
          <img
            src="/filing_cabinet2.svg"
            alt=""
            width="56px"
            height="56px"
            className="mr-1"
          />
          <h2 className="zissou-heading text-3xl text-tracksuit-red font-black text-shadow-[2px_2px_0px_var(--submarine-yellow)]  tracking-[0.2px]! leading-[1.1]! flex flex-col">
            <span className="">The Archive</span>
            <span className="inline-block text-[22px]">of Small Things</span>
          </h2>
        </div>

        {status === "loading" ? (
          <div className="w-10 h-10 bg-cream zissou-border rounded-full" />
        ) : session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2"
            >
              <Avatar
                src={session.user?.image}
                fallback={session.user?.name || ""}
                size="sm"
              />
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
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-cream zissou-border zissou-shadow py-2 min-w-[150px]">
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
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => signIn("google")}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
