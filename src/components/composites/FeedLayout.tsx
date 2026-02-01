'use client';

import { Post } from '@/types/post';
import { PostCard } from './PostCard';
import { Button } from '../primitives/Button';

interface FeedLayoutProps {
  posts: Post[];
  focusedPostId?: string;
  isOwner?: boolean;
  hasNewer?: boolean;
  hasOlder?: boolean;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
  onPostExpand?: (postId: string) => void;
  onPostEdit?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onPostShare?: (postId: string) => void;
}

export function FeedLayout({
  posts,
  focusedPostId,
  isOwner = false,
  hasNewer = false,
  hasOlder = false,
  onLoadNewer,
  onLoadOlder,
  onPostExpand,
  onPostEdit,
  onPostDelete,
  onPostShare,
}: FeedLayoutProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">This is your space. What&apos;s on your mind?</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          expanded={post.id === focusedPostId}
          isOwner={isOwner}
          onExpand={() => onPostExpand?.(post.id)}
          onEdit={() => onPostEdit?.(post.id)}
          onDelete={() => onPostDelete?.(post.id)}
          onShare={() => onPostShare?.(post.id)}
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
