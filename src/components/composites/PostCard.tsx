"use client";

import { ReactNode, useState, useEffect } from "react";
import { Post, PostImage } from "@/types/post";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageGrid } from "./ImageGrid";
import { ShareMenu } from "./ShareMenu";
import { Chip } from "../primitives/Chip";
import { IconButton } from "../primitives/IconButton";

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  isEditing?: boolean;
  editComposer?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onImageClick?: (image: PostImage) => void;
}

const ShareIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const PublishIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 10l7-7m0 0l7 7m-7-7v18"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ThumbsUpIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    className="w-5 h-5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zm-9 11H3a2 2 0 01-2-2v-7a2 2 0 012-2h2"
    />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zm9-13h2a2 2 0 012 2v7a2 2 0 01-2 2h-2"
    />
  </svg>
);

const CommentIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

function ShameToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="zissou-border zissou-shadow overflow-hidden">
        <img src="/images/shame.jpg" alt="Shame!" className="w-48" />
      </div>
    </div>
  );
}

export function PostCard({
  post,
  isOwner = false,
  isEditing,
  editComposer,
  onEdit,
  onDelete,
  onPublish,
  onLike,
  onComment,
  onImageClick,
}: PostCardProps) {
  const [showShame, setShowShame] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [charLimit, setCharLimit] = useState(800);

  useEffect(() => {
    setCharLimit(window.innerWidth < 768 ? 300 : 800);
  }, []);

  const isTruncatable = post.content.length > charLimit;

  const handleDislike = () => {
    setShowShame(true);
    setTimeout(() => setShowShame(false), 1000);
  };

  if (isEditing && editComposer) {
    return (
      <article data-post-id={post.id} className="bg-post zissou-border zissou-shadow p-6">
        {editComposer}
      </article>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(post.createdAt);

  return (
    <article data-post-id={post.id} className="bg-post zissou-border zissou-shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <time className="zissou-mono text-xs text-inkstain/60">
            {formattedDate}
          </time>
          {!post.publishedAt && (
            <span className="flex items-center gap-1 text-submarine-yellow zissou-mono text-xs uppercase">
              Draft
            </span>
          )}
          {post.isPrivate && (
            <span className="flex items-center gap-1 text-tracksuit-red zissou-mono text-xs uppercase">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Private
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <div className="relative">
            <IconButton icon={<ShareIcon />} label="Share" onClick={() => setShowShareMenu(!showShareMenu)} />
            <ShareMenu
              postUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/posts/${post.id}`}
              postTitle={post.content.slice(0, 60)}
              isOpen={showShareMenu}
              onClose={() => setShowShareMenu(false)}
            />
          </div>
          {isOwner && (
            <>
              {!post.publishedAt && onPublish && (
                <IconButton
                  icon={<PublishIcon />}
                  label="Publish"
                  onClick={onPublish}
                />
              )}
              <IconButton icon={<EditIcon />} label="Edit" onClick={onEdit} />
              <IconButton
                icon={<TrashIcon />}
                label="Delete"
                variant="danger"
                onClick={onDelete}
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <MarkdownRenderer
          content={post.content}
          truncate={!expanded && isTruncatable ? charLimit : undefined}
          linkPreviews={post.linkPreviews}
        />
        {isTruncatable && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="zissou-mono text-xs text-deep-ocean-teal hover:text-tracksuit-red mt-2 uppercase"
          >
            Read more
          </button>
        )}
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="mb-4">
          <ImageGrid images={post.images} expanded onImageClick={onImageClick} />
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <Chip key={tag.id}>{tag.name}</Chip>
          ))}
        </div>
      )}

      {/* Likes */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 transition-transform duration-150 active:scale-110 ${
            post.likedByMe
              ? 'text-deep-ocean-teal'
              : 'text-inkstain/30 hover:text-inkstain/60'
          }`}
        >
          <ThumbsUpIcon filled={post.likedByMe} />
          {post.likeCount > 0 && (
            <span className="zissou-mono text-xs">{post.likeCount}</span>
          )}
        </button>
        <button
          onClick={handleDislike}
          className="text-inkstain/30 hover:text-inkstain/60 transition-transform duration-150 active:scale-110"
        >
          <ThumbsDownIcon />
        </button>
        {onComment && (
          <button
            onClick={onComment}
            className="flex items-center gap-1.5 text-inkstain/30 hover:text-inkstain/60 transition-transform duration-150 active:scale-110 ml-1"
          >
            <CommentIcon />
            {post.commentCount > 0 && (
              <span className="zissou-mono text-xs">{post.commentCount}</span>
            )}
          </button>
        )}
      </div>
      <ShameToast visible={showShame} />
    </article>
  );
}
