"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { emoji: "📬", label: "About", href: "/about" },
  { emoji: "📓", label: "Guestbook", href: "/guestbook" },
  { emoji: "📸", label: "The Little Picture", href: "/thelittlepicture" },
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
          ? "flex gap-3 overflow-x-auto pb-2 scrollbar-none"
          : "flex flex-col gap-3"
      }
    >
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`zissou-border zissou-shadow bg-cream hover:bg-submarine-yellow/20 transition-none block ${
            horizontal ? "shrink-0" : ""
          } ${minimized ? "px-2 py-2 text-center" : "px-3 py-2"}`}
        >
          {minimized ? (
            <span className="text-lg">{item.emoji}</span>
          ) : (
            <span className="zissou-mono text-sm text-inkstain">
              {item.emoji} {item.label}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
