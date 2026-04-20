"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "../layout/AppLayout";
import { Composer } from "../composites/Composer";
import { FeedLayout } from "../composites/FeedLayout";
import { ConfirmDialog } from "../composites/ConfirmDialog";

import { ImageViewer } from "../composites/ImageViewer";
import { CommentsPanel } from "../composites/CommentsPanel";
import { Post, PostImage, PostTag } from "@/types/post";

interface FeedPageProps {
  includePrivate?: boolean;
  initialTags?: string[];
  focusPostId?: string;
}

export function FeedPage({ includePrivate = false, initialTags = [], focusPostId }: FeedPageProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [hasNewer, setHasNewer] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<PostImage | null>(null);
  const [viewerPostId, setViewerPostId] = useState<string | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (cursor?: Date, direction: "older" | "newer" = "older") => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (cursor) params.set("cursor", cursor.toISOString());
      params.set("direction", direction);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      if (includePrivate) params.set("includePrivate", "true");
      if (showDrafts) params.set("draftsOnly", "true");

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      return data;
    },
    [selectedTags, includePrivate, showDrafts],
  );

  const fetchTags = async () => {
    const res = await fetch("/api/tags");
    const data = await res.json();
    setTags(data.map((t: PostTag) => t.name));
  };

  useEffect(() => {
    const parsePosts = (posts: Post[]) =>
      posts.map((p: Post) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      }));

    const loadInitial = async () => {
      setIsLoading(true);

      if (focusPostId) {
        // Load posts around the focused post
        const params = new URLSearchParams();
        params.set("around", focusPostId);
        if (includePrivate) params.set("includePrivate", "true");

        const [aroundRes] = await Promise.all([
          fetch(`/api/posts?${params}`),
          fetchTags(),
        ]);
        const aroundData = await aroundRes.json();
        setPosts(parsePosts(aroundData.posts));
        setHasOlder(aroundData.hasMore);
        setHasNewer(aroundData.hasNewer ?? false);
      } else {
        const [postsData] = await Promise.all([fetchPosts(), fetchTags()]);
        setPosts(parsePosts(postsData.posts));
        setHasOlder(postsData.hasMore);
      }

      setIsLoading(false);
    };

    loadInitial();
  }, [fetchPosts, focusPostId, includePrivate]);

  // Scroll to focused post once loaded
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (!focusPostId || isLoading || hasScrolled.current) return;
    const el = document.querySelector(`[data-post-id="${focusPostId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "center" });
      hasScrolled.current = true;
    }
  }, [focusPostId, isLoading, posts]);

  const handlePublish = async (data: {
    content: string;
    images: File[];
    tags: string[];
    isPrivate: boolean;
    isDraft?: boolean;
  }) => {
    setIsSubmitting(true);

    try {
      const imageIds: string[] = [];
      for (const file of data.images) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });
        const imageData = await res.json();
        imageIds.push(imageData.id);
      }

      const tagIds: string[] = [];
      for (const tagName of data.tags) {
        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: tagName }),
        });
        const tagData = await res.json();
        tagIds.push(tagData.id);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          imageIds,
          tagIds,
          isPrivate: data.isPrivate,
          isDraft: data.isDraft,
        }),
      });

      const newPost = await res.json();
      const isDraft = !newPost.publishedAt;
      // Only add to current view if it matches the filter
      if ((isDraft && showDrafts) || (!isDraft && !showDrafts)) {
        setPosts((prev) => [
          {
            ...newPost,
            createdAt: new Date(newPost.createdAt),
            updatedAt: new Date(newPost.updatedAt),
            publishedAt: newPost.publishedAt
              ? new Date(newPost.publishedAt)
              : null,
          },
          ...prev,
        ]);
      }

      await fetchTags();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePostId) return;

    await fetch(`/api/posts/${deletePostId}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
    setDeletePostId(null);
  };

  const handleSaveEdit = async (postId: string, data: {
    content: string;
    images: File[];
    existingImageIds: string[];
    tags: string[];
    isPrivate: boolean;
    publish?: boolean;
    publishedAt?: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Upload new images
      const newImageIds: string[] = [];
      for (const file of data.images) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/images", { method: "POST", body: formData });
        const imageData = await res.json();
        newImageIds.push(imageData.id);
      }

      // Resolve tag IDs
      const tagIds: string[] = [];
      for (const tagName of data.tags) {
        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: tagName }),
        });
        const tagData = await res.json();
        tagIds.push(tagData.id);
      }

      const allImageIds = [...data.existingImageIds, ...newImageIds];

      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          tagIds,
          imageIds: allImageIds,
          isPrivate: data.isPrivate,
          publish: data.publish,
          publishedAt: data.publishedAt,
        }),
      });

      const updatedPost = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...updatedPost,
                createdAt: new Date(updatedPost.createdAt),
                updatedAt: new Date(updatedPost.updatedAt),
                publishedAt: updatedPost.publishedAt ? new Date(updatedPost.publishedAt) : null,
              }
            : p
        ).filter((p) => {
          // If we just published a draft and we're viewing drafts, remove it
          if (data.publish && showDrafts && p.id === postId) return false;
          return true;
        })
      );

      setEditingPostId(null);
      await fetchTags();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraft = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish: true }),
    });

    if (res.ok) {
      // Remove from drafts view
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();
      // Sync with server truth
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likeCount: data.likeCount, likedByMe: data.likedByMe }
            : p
        )
      );
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        )
      );
    }
  };

  const handleLoadOlder = async () => {
    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    const data = await fetchPosts(lastPost.createdAt, "older");
    setPosts((prev) => [
      ...prev,
      ...data.posts.map((p: Post) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      })),
    ]);
    setHasOlder(data.hasMore);
  };

  const handleLoadNewer = async () => {
    const firstPost = posts[0];
    if (!firstPost) return;

    const data = await fetchPosts(firstPost.createdAt, "newer");
    setPosts((prev) => [
      ...data.posts.map((p: Post) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      })),
      ...prev,
    ]);
    setHasNewer(data.hasMore);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };


  // Image viewer navigation
  const viewerPost = viewerPostId
    ? posts.find((p) => p.id === viewerPostId)
    : null;
  const viewerImageIndex =
    viewerPost && viewerImage
      ? viewerPost.images.findIndex((img) => img.id === viewerImage.id)
      : -1;

  const handleImageClick = (image: PostImage, post: Post) => {
    setViewerImage(image);
    setViewerPostId(post.id);
    setCommentPostId(null); // close comments if open
  };

  const handleViewerClose = () => {
    setViewerImage(null);
    setViewerPostId(null);
  };

  const handleCaptionSave = (imageId: string, caption: string | null) => {
    // Update the image caption in local state
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        images: p.images.map((img) =>
          img.id === imageId ? { ...img, caption: caption ?? undefined } : img
        ),
      }))
    );
    // Also update the viewer image if it's the one being viewed
    setViewerImage((prev) =>
      prev && prev.id === imageId ? { ...prev, caption: caption ?? undefined } : prev
    );
  };

  const handleFeaturedToggle = async (imageId: string) => {
    if (!viewerPostId) return;

    try {
      const res = await fetch(`/api/image-featured/${imageId}`, { method: "PATCH" });
      if (!res.ok) return;
      const data = await res.json();

      // Update all images in the post: unfeatured others, toggle this one
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? {
                ...p,
                images: p.images.map((img) =>
                  img.id === imageId
                    ? { ...img, featured: data.featured }
                    : { ...img, featured: false }
                ),
              }
            : p
        )
      );
      setViewerImage((prev) =>
        prev ? { ...prev, featured: prev.id === imageId ? data.featured : false } : prev
      );
    } catch {
      // silently fail
    }
  };

  const handleImageLike = async () => {
    if (!viewerImage || !viewerPostId) return;
    const imageId = viewerImage.id;

    // Optimistic update
    const updateImageLike = (liked: boolean, count: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === viewerPostId
            ? {
                ...p,
                images: p.images.map((img) =>
                  img.id === imageId ? { ...img, likedByMe: liked, likeCount: count } : img
                ),
              }
            : p
        )
      );
      setViewerImage((prev) =>
        prev && prev.id === imageId ? { ...prev, likedByMe: liked, likeCount: count } : prev
      );
    };

    const wasLiked = viewerImage.likedByMe;
    const newCount = wasLiked ? viewerImage.likeCount - 1 : viewerImage.likeCount + 1;
    updateImageLike(!wasLiked, newCount);

    try {
      const res = await fetch(`/api/image-likes/${imageId}`, { method: 'POST' });
      const data = await res.json();
      updateImageLike(data.likedByMe, data.likeCount);
    } catch {
      updateImageLike(wasLiked, viewerImage.likeCount);
    }
  };

  const handleComment = (postId: string) => {
    setCommentPostId(postId);
    // Close image viewer if open
    setViewerImage(null);
    setViewerPostId(null);
  };

  const handleCommentClose = () => {
    setCommentPostId(null);
  };

  const handleCommentCountChange = (postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + delta } : p
      )
    );
  };

  // Build panel content for AppLayout
  const commentPost = commentPostId ? posts.find((p) => p.id === commentPostId) : null;

  const panel = commentPost ? (
    <CommentsPanel
      postId={commentPost.id}
      postPreview={commentPost.content.slice(0, 60)}
      isOwner={!!session}
      onClose={handleCommentClose}
      onCommentCountChange={handleCommentCountChange}
    />
  ) : null;

  return (
    <>
    {viewerImage && viewerPost && (
      <ImageViewer
        images={viewerPost.images}
        currentIndex={viewerImageIndex}
        isOwner={!!session}
        onClose={handleViewerClose}
        onNavigate={(i) => setViewerImage(viewerPost.images[i])}
        onLike={handleImageLike}
        onCaptionSave={handleCaptionSave}
        onFeaturedToggle={handleFeaturedToggle}
      />
    )}
    <AppLayout panel={panel}>
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

      {session && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowDrafts(false)}
            className={`zissou-mono text-xs uppercase px-3 py-1 ${!showDrafts ? 'bg-inkstain text-cream' : 'text-inkstain/60 hover:text-inkstain'}`}
          >
            Published
          </button>
          <button
            onClick={() => setShowDrafts(true)}
            className={`zissou-mono text-xs uppercase px-3 py-1 ${showDrafts ? 'bg-inkstain text-cream' : 'text-inkstain/60 hover:text-inkstain'}`}
          >
            Drafts
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="zissou-mono text-inkstain/60">Loading...</p>
        </div>
      ) : (
        <FeedLayout
          posts={posts}
          isOwner={!!session}
          hasNewer={hasNewer}
          hasOlder={hasOlder}
          editingPostId={editingPostId}
          renderEditComposer={(post) => (
            <Composer
              userAvatar={session?.user?.image || undefined}
              userName={session?.user?.name || undefined}
              existingTags={tags}
              onPublish={handlePublish}
              isSubmitting={isSubmitting}
              editPost={{
                id: post.id,
                content: post.content,
                tags: post.tags.map((t) => t.name),
                isPrivate: post.isPrivate,
                images: post.images.map((img) => ({ id: img.id, url: img.url, mimeType: img.mimeType })),
                isDraft: !post.publishedAt,
                publishedAt: post.publishedAt,
              }}
              onSave={(data) => handleSaveEdit(post.id, data)}
              onCancel={() => setEditingPostId(null)}
            />
          )}
          onLoadNewer={handleLoadNewer}
          onLoadOlder={handleLoadOlder}
          onPostEdit={setEditingPostId}
          onPostDelete={setDeletePostId}

          onPostPublish={(id) => handlePublishDraft(id)}
          onPostLike={handleLike}
          onImageClick={handleImageClick}
          onPostComment={handleComment}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletePostId}
        title="Delete post?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletePostId(null)}
      />

    </AppLayout>
    </>
  );
}
