"use client";

import Link from "next/link";
import { relativeTime } from "@/lib/relative-time";

type ActivityRowKind = "post-like" | "photo-like" | "comment" | "guestbook";

interface ActivityRowProps {
  kind: ActivityRowKind;
  createdAt: Date | string;
  postId?: string;
  postExcerpt?: string;
  name?: string | null;
  snippet?: string | null;
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function GuestbookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <circle cx="9" cy="11" r="2" fill="currentColor" stroke="none" />
      <path d="M21 17l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ActivityRow({ kind, createdAt, postId, postExcerpt, name, snippet }: ActivityRowProps) {
  const dateObj = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const time = !Number.isNaN(dateObj.getTime()) ? relativeTime(dateObj) : null;
  const actor = name?.trim() ? name : "Someone";

  const renderPostLink = () =>
    postId && postExcerpt ? (
      <Link
        href={`/posts/${postId}`}
        className="text-deep-ocean-teal underline decoration-dotted underline-offset-2 hover:text-tracksuit-red"
      >
        “{postExcerpt}”
      </Link>
    ) : null;

  let icon: React.ReactNode;
  let body: React.ReactNode;
  let iconClass = "text-deep-ocean-teal";

  switch (kind) {
    case "post-like":
      icon = <HeartIcon />;
      iconClass = "text-tracksuit-red";
      body = <>Someone liked {renderPostLink()}</>;
      break;
    case "photo-like":
      icon = <PhotoIcon />;
      iconClass = "text-tracksuit-red";
      body = <>Someone liked a photo on {renderPostLink()}</>;
      break;
    case "comment":
      icon = <CommentIcon />;
      body = (
        <>
          <span className="font-bold">{actor}</span> commented on {renderPostLink()}
          {snippet && (
            <span className="text-inkstain/70"> — “{snippet}”</span>
          )}
        </>
      );
      break;
    case "guestbook":
      icon = <GuestbookIcon />;
      body = (
        <>
          <span className="font-bold">{actor}</span> signed the guestbook
          {snippet && <span className="text-inkstain/70"> — “{snippet}”</span>}
        </>
      );
      break;
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 shrink-0 ${iconClass}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="zissou-mono text-sm text-inkstain leading-snug">{body}</p>
        {time && (
          <p className="zissou-mono text-[11px] text-inkstain/50 mt-0.5">{time}</p>
        )}
      </div>
    </div>
  );
}
