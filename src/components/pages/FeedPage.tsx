'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { Header } from '../layout/Header';
import { Composer } from '../composites/Composer';
import { FilterBar } from '../composites/FilterBar';
import { FeedLayout } from '../composites/FeedLayout';
import { ConfirmDialog } from '../composites/ConfirmDialog';
import { ShareMenu } from '../composites/ShareMenu';
import { Post, PostTag } from '@/types/post';

interface FeedPageProps {
  includePrivate?: boolean;
}

export function FeedPage({ includePrivate = false }: FeedPageProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasNewer, setHasNewer] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async (cursor?: Date, direction: 'older' | 'newer' = 'older') => {
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (cursor) params.set('cursor', cursor.toISOString());
    params.set('direction', direction);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (includePrivate) params.set('includePrivate', 'true');

    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();

    return data;
  }, [selectedTags, includePrivate]);

  const fetchTags = async () => {
    const res = await fetch('/api/tags');
    const data = await res.json();
    setTags(data.map((t: PostTag) => t.name));
  };

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      const [postsData] = await Promise.all([
        fetchPosts(),
        fetchTags(),
      ]);
      setPosts(postsData.posts.map((p: Post) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      })));
      setHasOlder(postsData.hasMore);
      setIsLoading(false);
    };

    loadInitial();
  }, [fetchPosts]);

  const handlePublish = async (data: { content: string; images: File[]; tags: string[]; isPrivate: boolean }) => {
    setIsSubmitting(true);

    try {
      // Upload images first
      const imageIds: string[] = [];
      for (const file of data.images) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/images', { method: 'POST', body: formData });
        const imageData = await res.json();
        imageIds.push(imageData.id);
      }

      // Create tags and get IDs
      const tagIds: string[] = [];
      for (const tagName of data.tags) {
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        });
        const tagData = await res.json();
        tagIds.push(tagData.id);
      }

      // Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          imageIds,
          tagIds,
          isPrivate: data.isPrivate,
        }),
      });

      const newPost = await res.json();
      setPosts((prev) => [{
        ...newPost,
        createdAt: new Date(newPost.createdAt),
        publishedAt: newPost.publishedAt ? new Date(newPost.publishedAt) : null,
      }, ...prev]);

      // Refresh tags
      await fetchTags();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePostId) return;

    await fetch(`/api/posts/${deletePostId}`, { method: 'DELETE' });
    setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
    setDeletePostId(null);
  };

  const handleLoadOlder = async () => {
    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    const data = await fetchPosts(lastPost.createdAt, 'older');
    setPosts((prev) => [...prev, ...data.posts.map((p: Post) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    }))]);
    setHasOlder(data.hasMore);
  };

  const handleLoadNewer = async () => {
    const firstPost = posts[0];
    if (!firstPost) return;

    const data = await fetchPosts(firstPost.createdAt, 'newer');
    setPosts((prev) => [...data.posts.map((p: Post) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    })), ...prev]);
    setHasNewer(data.hasMore);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const sharePost = posts.find((p) => p.id === sharePostId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {session && (
          <div className="mb-8">
            <Composer
              userAvatar={session.user?.image || undefined}
              userName={session.user?.name || undefined}
              existingTags={tags}
              onPublish={handlePublish}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        <FilterBar
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={toggleTag}
        />

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <FeedLayout
            posts={posts}
            isOwner={!!session}
            hasNewer={hasNewer}
            hasOlder={hasOlder}
            onLoadNewer={handleLoadNewer}
            onLoadOlder={handleLoadOlder}
            onPostEdit={(id) => alert(`Edit ${id} - not implemented`)}
            onPostDelete={setDeletePostId}
            onPostShare={setSharePostId}
          />
        )}
      </main>

      <ConfirmDialog
        isOpen={!!deletePostId}
        title="Delete post?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletePostId(null)}
      />

      {sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSharePostId(null)} />
          <div className="relative">
            <ShareMenu
              postUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${sharePost.id}`}
              postTitle={sharePost.content.slice(0, 60)}
              isOpen={true}
              onClose={() => setSharePostId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
