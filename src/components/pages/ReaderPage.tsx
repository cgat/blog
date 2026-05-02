"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../layout/AppLayout";
import { FeedItemCard } from "../composites/FeedItemCard";
import { AddFeedForm } from "../composites/AddFeedForm";
import { Button } from "../primitives/Button";
import { feedAccentClass } from "@/lib/feed-accent";

interface FeedSummary {
  id: string;
  url: string;
  title: string;
  siteUrl: string | null;
  lastFetchedAt: string | null;
  lastError: string | null;
  unreadCount: number;
  totalCount: number;
}

interface FeedItem {
  id: string;
  feedId: string;
  feedTitle: string;
  url: string;
  title: string;
  summary: string | null;
  author: string | null;
  publishedAt: string | null;
  readAt: string | null;
}

const ALL_FEEDS = "__all__";

export function ReaderPage() {
  const [feeds, setFeeds] = useState<FeedSummary[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string>(ALL_FEEDS);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const fetchFeeds = useCallback(async () => {
    const res = await fetch("/api/reader/feeds");
    if (!res.ok) return;
    const data = await res.json();
    setFeeds(data.feeds ?? []);
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    const params = new URLSearchParams();
    if (unreadOnly) params.set("unread", "1");
    if (selectedFeedId !== ALL_FEEDS) params.set("feedId", selectedFeedId);
    params.set("limit", "100");
    const res = await fetch(`/api/reader/items?${params}`);
    if (!res.ok) {
      setIsLoadingItems(false);
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
    setIsLoadingItems(false);
  }, [selectedFeedId, unreadOnly]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchFeeds();
      if (cancelled) return;
      setIsLoadingFeeds(false);
      // Lazy refresh on mount, then re-pull items + feed counts.
      setIsRefreshing(true);
      try {
        const res = await fetch("/api/reader/refresh", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.added > 0) {
            setRefreshNotice(`${data.added} new item${data.added === 1 ? "" : "s"}`);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
      if (cancelled) return;
      await Promise.all([fetchFeeds(), fetchItems()]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddFeed = async (url: string) => {
    const res = await fetch("/api/reader/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to add feed");
    }
    await Promise.all([fetchFeeds(), fetchItems()]);
  };

  const handleDeleteFeed = async (id: string) => {
    if (!confirm("Delete this feed and all its items?")) return;
    const res = await fetch(`/api/reader/feeds/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (selectedFeedId === id) setSelectedFeedId(ALL_FEEDS);
    await Promise.all([fetchFeeds(), fetchItems()]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      const res = await fetch("/api/reader/refresh?force=1", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRefreshNotice(
          data?.added > 0
            ? `${data.added} new item${data.added === 1 ? "" : "s"}`
            : "Up to date",
        );
      }
    } finally {
      setIsRefreshing(false);
    }
    await Promise.all([fetchFeeds(), fetchItems()]);
  };

  const handleOpen = async (item: FeedItem) => {
    if (item.readAt) return;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i)),
    );
    setFeeds((prev) =>
      prev.map((f) =>
        f.id === item.feedId ? { ...f, unreadCount: Math.max(0, f.unreadCount - 1) } : f,
      ),
    );
    try {
      await fetch(`/api/reader/items/${item.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // rollback on failure
      await Promise.all([fetchFeeds(), fetchItems()]);
    }
  };

  const handleToggleRead = async (item: FeedItem) => {
    const nextRead = !item.readAt;
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, readAt: nextRead ? new Date().toISOString() : null } : i,
      ),
    );
    try {
      await fetch(`/api/reader/items/${item.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: nextRead }),
      });
      await fetchFeeds();
    } catch {
      await Promise.all([fetchFeeds(), fetchItems()]);
    }
  };

  const handleMarkAllRead = async () => {
    const feedId = selectedFeedId === ALL_FEEDS ? undefined : selectedFeedId;
    if (!confirm(feedId ? "Mark all items in this feed as read?" : "Mark every item as read?")) {
      return;
    }
    await fetch("/api/reader/items/read-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedId ? { feedId } : {}),
    });
    await Promise.all([fetchFeeds(), fetchItems()]);
  };

  const totalUnread = useMemo(
    () => feeds.reduce((acc, f) => acc + f.unreadCount, 0),
    [feeds],
  );

  const visibleItems = unreadOnly ? items.filter((i) => !i.readAt) : items;

  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Feeds panel */}
        <aside className="space-y-4">
          <div>
            <h2 className="zissou-heading text-xs font-bold tracking-widest text-inkstain mb-2">
              Subscriptions
            </h2>
            <AddFeedForm onAdd={handleAddFeed} />
          </div>

          <nav className="zissou-border bg-cream divide-y-2 divide-dashed divide-inkstain/20">
            <FeedRow
              label="All feeds"
              count={totalUnread}
              isActive={selectedFeedId === ALL_FEEDS}
              onClick={() => setSelectedFeedId(ALL_FEEDS)}
            />
            {isLoadingFeeds && (
              <div className="px-3 py-2 zissou-mono text-xs text-inkstain/50">
                Loading…
              </div>
            )}
            {!isLoadingFeeds && feeds.length === 0 && (
              <div className="px-3 py-3 zissou-mono text-xs text-inkstain/50">
                No feeds yet. Add one above.
              </div>
            )}
            {feeds.map((feed) => (
              <FeedRow
                key={feed.id}
                label={feed.title}
                count={feed.unreadCount}
                hasError={!!feed.lastError}
                isActive={selectedFeedId === feed.id}
                onClick={() => setSelectedFeedId(feed.id)}
                onDelete={() => handleDeleteFeed(feed.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Items panel */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              size="sm"
              variant={unreadOnly ? "primary" : "secondary"}
              onClick={() => setUnreadOnly((v) => !v)}
            >
              {unreadOnly ? "Unread" : "All"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
            {refreshNotice && (
              <span className="zissou-mono text-xs text-deep-ocean-teal ml-1">
                {refreshNotice}
              </span>
            )}
          </div>

          {isLoadingItems ? (
            <p className="zissou-mono text-sm text-inkstain/50">Loading…</p>
          ) : visibleItems.length === 0 ? (
            <p className="zissou-mono text-sm text-inkstain/50">
              {unreadOnly ? "Inbox zero." : "No items here yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <FeedItemCard
                  key={item.id}
                  title={item.title}
                  url={item.url}
                  feedTitle={item.feedTitle}
                  accentClassName={feedAccentClass(item.feedId)}
                  summary={item.summary}
                  author={item.author}
                  publishedAt={item.publishedAt}
                  isUnread={!item.readAt}
                  onOpen={() => handleOpen(item)}
                  onToggleRead={() => handleToggleRead(item)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

interface FeedRowProps {
  label: string;
  count: number;
  isActive: boolean;
  hasError?: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

function FeedRow({ label, count, isActive, hasError, onClick, onDelete }: FeedRowProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 group ${
        isActive ? "bg-submarine-yellow/30" : ""
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 flex items-center justify-between text-left"
      >
        <span
          className={`zissou-mono text-sm truncate ${
            count > 0 ? "text-inkstain font-bold" : "text-inkstain/60"
          }`}
        >
          {hasError && <span className="text-tracksuit-red mr-1" title="Last fetch failed">⚠</span>}
          {label}
        </span>
        {count > 0 && (
          <span className="zissou-mono text-[11px] text-deep-ocean-teal ml-2 shrink-0">
            {count}
          </span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete feed"
          className="opacity-0 group-hover:opacity-100 text-inkstain/40 hover:text-tracksuit-red text-sm leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
