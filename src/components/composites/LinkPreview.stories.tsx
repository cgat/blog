import type { Meta, StoryObj } from "@storybook/react";
import { LinkPreview } from "./LinkPreview";

const meta: Meta<typeof LinkPreview> = {
  title: "Composites/LinkPreview",
  component: LinkPreview,
};

export default meta;
type Story = StoryObj<typeof LinkPreview>;

export const WithImage: Story = {
  args: {
    url: "https://example.com/article",
    title: "How to Build a Personal Blog with Next.js",
    description: "A comprehensive guide to building your own blog using Next.js, TypeScript, and SQLite. Learn about the POSSE model and why owning your content matters.",
    imageUrl: "https://picsum.photos/800/400",
    domain: "example.com",
  },
};

export const WithoutImage: Story = {
  args: {
    url: "https://example.com/article",
    title: "How to Build a Personal Blog with Next.js",
    description: "A comprehensive guide to building your own blog using Next.js, TypeScript, and SQLite.",
    imageUrl: null,
    domain: "example.com",
  },
};

export const LongTitle: Story = {
  args: {
    url: "https://example.com/article",
    title: "This Is an Extremely Long Article Title That Should Be Truncated After Two Lines Because Otherwise It Would Take Up Too Much Space in the Card Layout",
    description: "Short description.",
    imageUrl: "https://picsum.photos/800/400",
    domain: "example.com",
  },
};

export const NoDescription: Story = {
  args: {
    url: "https://github.com/vercel/next.js",
    title: "vercel/next.js",
    description: null,
    imageUrl: "https://picsum.photos/800/400",
    domain: "github.com",
  },
};

export const MinimalData: Story = {
  args: {
    url: "https://example.com",
    title: null,
    description: null,
    imageUrl: null,
    domain: "example.com",
  },
};
