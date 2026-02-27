"use client";

import { Post } from "@/types/post";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ImageGrid } from "./ImageGrid";
import { Chip } from "../primitives/Chip";
import { IconButton } from "../primitives/IconButton";

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
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

export function PostCard({
  post,
  isOwner = false,
  onEdit,
  onDelete,
  onShare,
}: PostCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(post.createdAt);

  return (
    <article className="bg-[white] zissou-border zissou-shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <time className="zissou-mono text-xs text-inkstain/60">
            {formattedDate}
          </time>
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
          <IconButton icon={<ShareIcon />} label="Share" onClick={onShare} />
          {isOwner && (
            <>
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
          linkPreviews={post.linkPreviews}
        />
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="mb-4">
          <ImageGrid images={post.images} expanded />
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
    </article>
  );
}
