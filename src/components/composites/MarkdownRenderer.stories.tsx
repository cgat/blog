import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "Composites/MarkdownRenderer",
  component: MarkdownRenderer,
};

export default meta;
type Story = StoryObj<typeof MarkdownRenderer>;

const sampleMarkdown = `
# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

Here's a [link](https://example.com) and some code: \`const x = 1\`

- List item 1
- List item 2
- List item 3

> This is a blockquote
`;

export const Default: Story = {
  args: {
    content: sampleMarkdown,
  },
};

export const ShortPost: Story = {
  args: {
    content: 'Just a quick thought about **life** and *stuff*.',
  },
};

export const Truncated: Story = {
  args: {
    content: 'This is a longer post that will be truncated after a certain number of characters to show a preview in the feed.',
    truncate: 50,
  },
};
