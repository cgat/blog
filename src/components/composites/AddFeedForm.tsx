"use client";

import { useState } from "react";
import { Input } from "@/components/primitives/Input";
import { Button } from "@/components/primitives/Button";

interface AddFeedFormProps {
  onAdd: (url: string) => Promise<void>;
}

export function AddFeedForm({ onAdd }: AddFeedFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd(url.trim());
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        type="url"
        placeholder="https://example.com/feed.xml"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isSubmitting}
        error={error ?? undefined}
        aria-label="Feed URL"
      />
      <Button
        type="submit"
        size="sm"
        variant="primary"
        disabled={isSubmitting || !url.trim()}
      >
        {isSubmitting ? "Adding…" : "Add feed"}
      </Button>
    </form>
  );
}
