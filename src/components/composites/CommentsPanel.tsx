"use client";

import { useEffect, useState, useCallback } from "react";
import { usePanelMode } from "../layout/AppLayout";

interface CommentsPanelProps {
  postId: string;
  postPreview: string;
  isOwner: boolean;
  onClose: () => void;
  onCommentCountChange: (postId: string, delta: number) => void;
}

interface Comment {
  id: string;
  postId: string;
  name: string | null;
  content: string;
  isPrivate: boolean;
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
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

function CommentsPanelCard({
  postId,
  postPreview,
  isOwner,
  onClose,
  onCommentCountChange,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), name: name.trim() || undefined, isPrivate }),
      });

      if (res.status === 429) {
        setError("Too many comments. Try again later.");
        return;
      }

      if (!res.ok) {
        setError("Failed to post comment.");
        return;
      }

      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setContent("");
      onCommentCountChange(postId, 1);
    } catch {
      setError("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentCountChange(postId, -1);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="bg-white zissou-border zissou-shadow flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-inkstain">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-inkstain">Comments</h3>
          <p className="text-xs text-inkstain/60 truncate zissou-mono">
            {postPreview}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-inkstain/40 hover:text-tracksuit-red transition-colors ml-2 flex-shrink-0"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <p className="text-sm text-inkstain/40 zissou-mono">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-inkstain/40 zissou-mono text-center py-6">
            No comments yet
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-inkstain">
                    {comment.name || (
                      <span className="font-normal italic text-inkstain/60">
                        Anonymous
                      </span>
                    )}
                  </span>
                  <span className="zissou-mono text-xs text-inkstain/40 ml-2">
                    {timeAgo(new Date(comment.createdAt))}
                  </span>
                  {comment.isPrivate && (
                    <span className="zissou-mono text-xs text-amber-flame ml-2">
                      private
                    </span>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-inkstain/30 hover:text-inkstain/60 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    aria-label="Delete comment"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              <p className="text-sm text-inkstain mt-0.5">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t-2 border-inkstain px-4 py-3 space-y-2">
        <input
          type="text"
          placeholder="Name (optional)"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-2 border-inkstain/20 focus:border-deep-ocean-teal rounded px-3 py-2 text-sm outline-none"
        />
        <textarea
          placeholder="Write a comment..."
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full border-2 border-inkstain/20 focus:border-deep-ocean-teal rounded px-3 py-2 text-sm outline-none resize-none"
        />
        <label className="flex items-center gap-2 text-sm text-inkstain/60">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="accent-deep-ocean-teal"
          />
          <span className="zissou-mono text-xs">Private (only visible to you)</span>
        </label>
        {error && (
          <p className="text-xs text-tracksuit-red zissou-mono">{error}</p>
        )}
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="bg-deep-ocean-teal text-white px-4 py-2 rounded text-sm font-medium hover:bg-deep-ocean-teal/90 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>
    </div>
  );
}

export function CommentsPanel(props: CommentsPanelProps) {
  const mode = usePanelMode();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [props.onClose]);

  if (mode === "inline") {
    return <CommentsPanelCard {...props} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inkstain/60" onClick={props.onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CommentsPanelCard {...props} />
      </div>
    </div>
  );
}
