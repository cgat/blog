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

        {/* Entry form */}
        <div className="bg-white zissou-border zissou-shadow mb-10">
          <div className="px-4 py-2 border-b-2 border-inkstain">
            <h3 className="text-sm font-bold text-inkstain">{prompt}</h3>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-3 space-y-2">
            <input
              type="text"
              placeholder="Name (optional)"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-inkstain/20 focus:border-deep-ocean-teal rounded px-3 py-2 text-sm outline-none"
            />
            <textarea
              placeholder="Write something..."
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full border-2 border-inkstain/20 focus:border-deep-ocean-teal rounded px-3 py-2 text-sm outline-none resize-none"
            />
            {error && (
              <p className="text-xs text-tracksuit-red zissou-mono">{error}</p>
            )}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="bg-deep-ocean-teal text-white px-4 py-2 rounded text-sm font-medium hover:bg-deep-ocean-teal/90 disabled:opacity-50"
            >
              {isSubmitting ? "Filing..." : "Sign the book"}
            </button>
          </form>
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-inkstain">
                    {entry.name || (
                      <span className="font-normal italic text-inkstain/60">
                        Anonymous
                      </span>
                    )}
                  </span>
                  <span className="zissou-mono text-xs text-inkstain/40 ml-2">
                    {timeAgo(new Date(entry.createdAt))}
                  </span>
                </div>
              </div>
              <p className="text-sm text-inkstain mt-0.5">{entry.content}</p>
            </div>
          ))}

          {entries.length === 0 && (
            <p className="text-sm text-inkstain/40 zissou-mono text-center py-6">
              No entries yet. Be the first to sign.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
