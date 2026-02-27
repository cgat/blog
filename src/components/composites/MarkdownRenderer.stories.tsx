import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "The Dioramas/MarkdownRenderer",
  component: MarkdownRenderer,
  parameters: {
    docs: {
      description: {
        component: 'Fig 2.5: The Typesetting Engine. Converts raw markdown into properly formatted prose. Headings are set in Jost, body in Lora, and hyperlinks in deep ocean teal. Bare URLs are replaced with Reference Cards when preview data is available.',
      },
    },
  },
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

export const WithLinkPreview: Story = {
  args: {
    content: `Check out this article:

https://example.com/blog/nextjs-guide

It really helped me understand the App Router.`,
    linkPreviews: {
      'https://example.com/blog/nextjs-guide': {
        url: 'https://example.com/blog/nextjs-guide',
        title: 'The Complete Guide to Next.js App Router',
        description: 'Learn everything about the new App Router in Next.js, including server components, layouts, and data fetching patterns.',
        imageUrl: 'https://picsum.photos/800/400',
        domain: 'example.com',
      },
    },
  },
};

export const WithLinkPreviewNoImage: Story = {
  args: {
    content: `https://example.com/article`,
    linkPreviews: {
      'https://example.com/article': {
        url: 'https://example.com/article',
        title: 'An Interesting Article',
        description: 'This article has no OG image, so it renders as a text-only card.',
        imageUrl: null,
        domain: 'example.com',
      },
    },
  },
};

export const WithInlineAndBareLinks: Story = {
  args: {
    content: `I found [this resource](https://example.com/inline) very helpful.

https://example.com/bare-url

The inline link above should remain a normal link, while the bare URL gets a preview card.`,
    linkPreviews: {
      'https://example.com/bare-url': {
        url: 'https://example.com/bare-url',
        title: 'Bare URL Gets a Preview',
        description: 'Only bare URLs on their own line get preview cards.',
        imageUrl: 'https://picsum.photos/800/400',
        domain: 'example.com',
      },
    },
  },
};
