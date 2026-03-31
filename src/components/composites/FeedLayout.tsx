"use client";

import { ReactNode } from "react";
import { Post, PostImage } from "@/types/post";
import { PostCard } from "./PostCard";
import { Button } from "../primitives/Button";

interface FeedLayoutProps {
  posts: Post[];
  isOwner?: boolean;
  hasNewer?: boolean;
  hasOlder?: boolean;
  editingPostId?: string | null;
  renderEditComposer?: (post: Post) => ReactNode;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
  onPostEdit?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onPostShare?: (postId: string) => void;
  onPostPublish?: (postId: string) => void;
  onPostLike?: (postId: string) => void;
  onImageClick?: (image: PostImage, post: Post) => void;
}

export function FeedLayout({
  posts,
  isOwner = false,
  hasNewer = false,
  hasOlder = false,
  editingPostId,
  renderEditComposer,
  onLoadNewer,
  onLoadOlder,
  onPostEdit,
  onPostDelete,
  onPostShare,
  onPostPublish,
  onPostLike,
  onImageClick,
}: FeedLayoutProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="zissou-mono text-inkstain/60 text-lg">
          This is your space. What&apos;s on your mind?
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasNewer && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onLoadNewer}>
            Load newer posts
          </Button>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwner={isOwner}
          isEditing={editingPostId === post.id}
          editComposer={editingPostId === post.id ? renderEditComposer?.(post) : undefined}
          onEdit={() => onPostEdit?.(post.id)}
          onDelete={() => onPostDelete?.(post.id)}
          onShare={() => onPostShare?.(post.id)}
          onPublish={() => onPostPublish?.(post.id)}
          onLike={() => onPostLike?.(post.id)}
          onImageClick={(image) => onImageClick?.(image, post)}
        />
      ))}

      {hasOlder && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onLoadOlder}>
            Load older posts
          </Button>
        </div>
      )}
    </div>
  );
}
