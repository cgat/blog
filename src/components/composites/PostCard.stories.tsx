import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "./PostCard";
import { Post } from "@/types/post";

const meta: Meta<typeof PostCard> = {
  title: "The Dioramas/PostCard",
  component: PostCard,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 2.0: The Dispatch Record. A complete unit of published communication, mounted behind glass. Contains the full text of the dispatch, any accompanying photographic evidence, and its official classification tablets.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PostCard>;

const textPost: Post = {
  id: "1",
  content:
    "Just finished reading **Thinking, Fast and Slow** by Daniel Kahneman. Incredible insights into how we make decisions. Highly recommend for anyone interested in psychology or behavioral economics.",
  type: "text",
  images: [],
  tags: [
    { id: "1", name: "books", slug: "books" },
    { id: "2", name: "thoughts", slug: "thoughts" },
  ],
  linkPreviews: {},
  isPrivate: false,
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: new Date("2026-01-30T10:30:00"),
  updatedAt: new Date("2026-01-30T10:30:00"),
  publishedAt: new Date("2026-01-30T10:30:00"),
};

const photoPost: Post = {
  id: "2",
  content:
    "Beautiful sunset at the beach today. Sometimes you just need to stop and appreciate the moment.",
  type: "photo",
  images: [
    {
      id: "1",
      url: "https://picsum.photos/seed/sunset/800/600",
      width: 800,
      height: 600,
      likeCount: 0,
      likedByMe: false,
    },
    {
      id: "2",
      url: "https://picsum.photos/seed/beach/800/600",
      width: 800,
      height: 600,
      likeCount: 0,
      likedByMe: false,
    },
  ],
  tags: [
    { id: "3", name: "photography", slug: "photography" },
    { id: "4", name: "travel", slug: "travel" },
  ],
  linkPreviews: {},
  isPrivate: false,
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: new Date("2026-01-29T18:45:00"),
  updatedAt: new Date("2026-01-29T18:45:00"),
  publishedAt: new Date("2026-01-29T18:45:00"),
};

const longPost: Post = {
  id: "3",
  content: `# My Thoughts on Modern Web Development

The landscape of web development has changed dramatically over the past few years. We've seen the rise of meta-frameworks like Next.js, Remix, and SvelteKit that blur the line between client and server.

## Key Observations

1. **Server-first is back** - After years of SPAs, we're returning to server rendering
2. **Edge computing** - Deploy globally, run everywhere
3. **TypeScript everywhere** - Type safety is no longer optional

What do you think about these trends?`,
  type: "text",
  images: [],
  tags: [{ id: "5", name: "tech", slug: "tech" }],
  linkPreviews: {},
  isPrivate: false,
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: new Date("2026-01-28T14:00:00"),
  updatedAt: new Date("2026-01-28T14:00:00"),
  publishedAt: new Date("2026-01-28T14:00:00"),
};

export const TextPost: Story = {
  args: {
    post: textPost,
  },
};

export const PhotoPost: Story = {
  args: {
    post: photoPost,
  },
};

export const LongPost: Story = {
  args: {
    post: longPost,
  },
};

export const WithOwnerActions: Story = {
  args: {
    post: textPost,
    isOwner: true,
    onEdit: () => alert("Edit clicked"),
    onDelete: () => alert("Delete clicked"),
  },
};
