import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "./PostCard";
import { Post } from "@/types/post";

const meta: Meta<typeof PostCard> = {
  title: "Composites/PostCard",
  component: PostCard,
};

export default meta;
type Story = StoryObj<typeof PostCard>;

const textPost: Post = {
  id: '1',
  content: 'Just finished reading **Thinking, Fast and Slow** by Daniel Kahneman. Incredible insights into how we make decisions. Highly recommend for anyone interested in psychology or behavioral economics.',
  type: 'text',
  images: [],
  tags: [
    { id: '1', name: 'books', slug: 'books' },
    { id: '2', name: 'thoughts', slug: 'thoughts' },
  ],
  createdAt: new Date('2026-01-30T10:30:00'),
  publishedAt: new Date('2026-01-30T10:30:00'),
};

const photoPost: Post = {
  id: '2',
  content: 'Beautiful sunset at the beach today. Sometimes you just need to stop and appreciate the moment.',
  type: 'photo',
  images: [
    { id: '1', url: 'https://picsum.photos/seed/sunset/800/600', width: 800, height: 600 },
    { id: '2', url: 'https://picsum.photos/seed/beach/800/600', width: 800, height: 600 },
  ],
  tags: [
    { id: '3', name: 'photography', slug: 'photography' },
    { id: '4', name: 'travel', slug: 'travel' },
  ],
  createdAt: new Date('2026-01-29T18:45:00'),
  publishedAt: new Date('2026-01-29T18:45:00'),
};

const longPost: Post = {
  id: '3',
  content: `# My Thoughts on Modern Web Development

The landscape of web development has changed dramatically over the past few years. We've seen the rise of meta-frameworks like Next.js, Remix, and SvelteKit that blur the line between client and server.

## Key Observations

1. **Server-first is back** - After years of SPAs, we're returning to server rendering
2. **Edge computing** - Deploy globally, run everywhere
3. **TypeScript everywhere** - Type safety is no longer optional

What do you think about these trends?`,
  type: 'text',
  images: [],
  tags: [
    { id: '5', name: 'tech', slug: 'tech' },
  ],
  createdAt: new Date('2026-01-28T14:00:00'),
  publishedAt: new Date('2026-01-28T14:00:00'),
};

export const TextPost: Story = {
  args: {
    post: textPost,
  },
};

export const TextPostExpanded: Story = {
  args: {
    post: textPost,
    expanded: true,
  },
};

export const PhotoPost: Story = {
  args: {
    post: photoPost,
  },
};

export const PhotoPostExpanded: Story = {
  args: {
    post: photoPost,
    expanded: true,
  },
};

export const LongPostCollapsed: Story = {
  args: {
    post: longPost,
  },
};

export const LongPostExpanded: Story = {
  args: {
    post: longPost,
    expanded: true,
  },
};

export const WithOwnerActions: Story = {
  args: {
    post: textPost,
    isOwner: true,
    onEdit: () => alert('Edit clicked'),
    onDelete: () => alert('Delete clicked'),
    onShare: () => alert('Share clicked'),
  },
};
