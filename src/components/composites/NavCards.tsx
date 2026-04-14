"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { emoji: "📬", label: "About", href: "/about", desc: "A postcard from the archivist explaining the purpose of this collection" },
  { emoji: "📓", label: "Guestbook", href: "/guestbook", desc: "Leave a note for the archive and see what other visitors have written" },
  { emoji: "📸", label: "The Little Picture", href: "/thelittlepicture", desc: "A curated feed of small photographs and visual moments worth keeping" },
];



interface NavCardsProps {
  minimized?: boolean;
  horizontal?: boolean;
}

export function NavCards({ minimized = false, horizontal = false }: NavCardsProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.href !== pathname);

  if (visibleItems.length === 0) return null;

  return (
    <div
      className={
        horizontal
          ? "flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-none"
          : "flex flex-col gap-3"
      }
    >
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bg-[white] hover:bg-submarine-yellow/20 transition-none block ${
            minimized ? "zissou-border text-center" : "zissou-border zissou-shadow px-3 py-2"
          } ${horizontal ? "shrink-0 max-w-[235px]" : ""}`}
        >
          {minimized ? (
            <span className="text-lg">{item.emoji}</span>
          ) : (
            <>
              <span className="zissou-heading text-xs font-bold text-inkstain block">
                {item.emoji} {item.label}
              </span>
              <span className="zissou-mono text-[10px] text-inkstain/50 leading-tight block mt-1">
                {item.desc}
              </span>
            </>
          )}
        </Link>
      ))}

      {/* RSS card — horizontal (mobile) only */}
      {horizontal && (
        <a
          href="/feed.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[white] hover:bg-submarine-yellow/20 transition-none block zissou-border zissou-shadow px-3 py-2 shrink-0 max-w-[235px]"
        >
          <span className="zissou-heading text-xs font-bold text-tracksuit-red text-shadow-[1px_1px_0px_var(--submarine-yellow)] block">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="inline-block mr-1 -mt-0.5 text-tracksuit-red">
              <circle cx="6" cy="18" r="3" fill="currentColor" />
              <path d="M4 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M4 11a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            RSS Feed
          </span>
          <span className="zissou-mono text-[10px] text-inkstain/50 leading-tight block mt-1">
            Subscribe to new posts from the archive
          </span>
        </a>
      )}
    </div>
  );
}
