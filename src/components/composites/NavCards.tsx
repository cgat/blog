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
    </div>
  );
}
