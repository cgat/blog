import type { Meta, StoryObj } from "@storybook/react";
import { TextArea } from "./TextArea";

const meta: Meta<typeof TextArea> = {
  title: "Primitives/TextArea",
  component: TextArea,
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    placeholder: "What's on your mind?",
    rows: 3,
  },
};

export const AutoExpand: Story = {
  args: {
    placeholder: 'Start typing... the textarea will grow',
    autoExpand: true,
    rows: 1,
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Your thoughts',
    placeholder: 'Write something...',
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: 'Post content',
    error: 'Content is required',
    rows: 3,
  },
};

export const WithMarkdownHint: Story = {
  args: {
    placeholder: 'Markdown supported: **bold**, *italic*, [links](url)',
    rows: 4,
    autoExpand: true,
  },
};
