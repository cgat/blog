"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

interface GuestbookEntry {
  id: string;
  name: string | null;
  content: string;
  createdAt: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

const PROMPTS = [
  "What brings you to the archive today?",
  "Leave a note for the archivist.",
  "What small thing are you thinking about?",
  "Sign the guestbook, if you please.",
  "What would you like to file away?",
];

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    fetch("/api/guestbook")
      .then((res) => res.json())
      .then(setEntries);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), name: name.trim() || undefined }),
      });

      if (res.status === 429) {
        setError("Too many entries — the archivist needs a moment to file these.");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        return;
      }

      const entry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="zissou-heading text-2xl text-tracksuit-red font-black mb-2">
          📓 The Guestbook
        </h1>
        <p className="zissou-mono text-sm text-inkstain/60 mb-8">
          A record of visitors to the archive. All are welcome.
        </p>

        {/* Entry form — notebook style */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="zissou-border bg-[white] p-6 relative" style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, var(--deep-ocean-teal) 27px, var(--deep-ocean-teal) 28px)",
            backgroundPosition: "0 40px",
          }}>
            {/* Red margin line */}
            <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-tracksuit-red/30" />

            <p className="zissou-mono text-sm text-inkstain/60 italic mb-4 pl-6">
              {prompt}
            </p>

            <div className="pl-6">
              <input
                type="text"
                placeholder="Your name (or leave blank for Anonymous)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full bg-transparent zissou-mono text-sm text-inkstain placeholder:text-inkstain/30 outline-none mb-4 pb-1"
              />
              <textarea
                placeholder="Write something..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full bg-transparent zissou-mono text-sm text-inkstain placeholder:text-inkstain/30 outline-none resize-none leading-[28px]"
              />
            </div>

            {error && (
              <p className="zissou-mono text-xs text-tracksuit-red mt-2 pl-6">{error}</p>
            )}

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="zissou-mono text-xs uppercase px-4 py-2 bg-inkstain text-cream zissou-border hover:bg-tracksuit-red disabled:opacity-50 transition-none"
              >
                {isSubmitting ? "Filing..." : "Sign the book"}
              </button>
            </div>
          </div>
        </form>

        {/* Entries */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="zissou-border bg-[white] p-5 relative"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, var(--deep-ocean-teal) 27px, var(--deep-ocean-teal) 28px)",
                backgroundPosition: "0 12px",
              }}
            >
              <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-tracksuit-red/30" />
              <div className="pl-6">
                <p className="zissou-mono text-sm text-inkstain leading-[28px] whitespace-pre-wrap">
                  {entry.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2">
                  <span className="zissou-mono text-xs text-inkstain/60 font-bold">
                    — {entry.name || "Anonymous"}
                  </span>
                  <span className="zissou-mono text-xs text-inkstain/40">
                    {timeAgo(new Date(entry.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <p className="zissou-mono text-sm text-inkstain/40 text-center py-8 italic">
              The guestbook is empty. Be the first to sign it.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
