import type { Meta, StoryObj } from "@storybook/react";
import { FeedLayout } from "./FeedLayout";
import { Post } from "@/types/post";

const meta: Meta<typeof FeedLayout> = {
  title: "The Dioramas/FeedLayout",
  component: FeedLayout,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 2.9: The Archive Display. Arranges dispatch records in reverse chronological order with optional pagination controls. When the archive is empty, a monospaced invitation appears.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedLayout>;

const mockPosts: Post[] = [
  {
    id: "1",
    content:
      "Just finished reading **Thinking, Fast and Slow**. Incredible book about decision making.",
    type: "text",
    images: [],
    tags: [{ id: "1", name: "books", slug: "books" }],
    linkPreviews: {},
    isPrivate: false,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: new Date("2026-01-30T10:30:00"),
    updatedAt: new Date("2026-01-30T10:30:00"),
    publishedAt: new Date("2026-01-30T10:30:00"),
  },
  {
    id: "2",
    content: "Beautiful sunset at the beach today.",
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
    ],
    tags: [{ id: "2", name: "photography", slug: "photography" }],
    linkPreviews: {},
    isPrivate: false,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: new Date("2026-01-29T18:45:00"),
    updatedAt: new Date("2026-01-29T18:45:00"),
    publishedAt: new Date("2026-01-29T18:45:00"),
  },
  {
    id: "3",
    content: "Working on a new side project. More details soon!",
    type: "text",
    images: [],
    tags: [{ id: "3", name: "tech", slug: "tech" }],
    linkPreviews: {},
    isPrivate: false,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: new Date("2026-01-28T14:00:00"),
    updatedAt: new Date("2026-01-28T14:00:00"),
    publishedAt: new Date("2026-01-28T14:00:00"),
  },
];

export const Default: Story = {
  args: {
    posts: mockPosts,
    hasOlder: true,
    onLoadOlder: () => alert("Loading older posts..."),
  },
};

export const WithPagination: Story = {
  args: {
    posts: mockPosts,
    hasNewer: true,
    hasOlder: true,
    onLoadNewer: () => alert("Loading newer posts..."),
    onLoadOlder: () => alert("Loading older posts..."),
  },
};

export const AsOwner: Story = {
  args: {
    posts: mockPosts,
    isOwner: true,
    hasOlder: true,
    onPostEdit: (id) => alert(`Edit post ${id}`),
    onPostDelete: (id) => alert(`Delete post ${id}`),
  },
};

export const Empty: Story = {
  args: {
    posts: [],
  },
};
