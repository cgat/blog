import type { Meta, StoryObj } from "@storybook/react";
import { FeedItemCard } from "./FeedItemCard";

const meta: Meta<typeof FeedItemCard> = {
  title: "The Dioramas/FeedItemCard",
  component: FeedItemCard,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 4.1: A clipping pinned to the bulletin board. One row of an inbound RSS dispatch — title, source, and a small excerpt. The red gutter on the left marks an item as unread.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedItemCard>;

const baseArgs = {
  title: "On the Quiet Pleasures of a Well-Indexed Archive",
  url: "https://example.com/article",
  feedTitle: "Daring Fireball",
  accentClassName: "bg-tracksuit-red",
  author: "John Gruber",
  publishedAt: new Date(Date.now() - 1000 * 60 * 47),
  summary:
    "A short reflection on why the small mechanical pleasures of organizing things — labels, folders, indices — endure even as the systems that hold them evolve.",
};

export const Unread: Story = {
  args: { ...baseArgs, isUnread: true },
};

export const Read: Story = {
  args: { ...baseArgs, isUnread: false },
};

export const NoSummary: Story = {
  args: {
    title: "Something happened today",
    url: "https://example.com/article2",
    feedTitle: "Microblog",
    accentClassName: "bg-deep-ocean-teal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isUnread: true,
  },
};

export const LongTitle: Story = {
  args: {
    ...baseArgs,
    title:
      "This Is an Extremely Long Article Title That Probably Wraps to Two or Three Lines and Tests the Layout",
    accentClassName: "bg-submarine-yellow",
    isUnread: true,
  },
};
