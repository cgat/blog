import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { MarkdownEditor } from "./MarkdownEditor";

const meta: Meta<typeof MarkdownEditor> = {
  title: "Composites/MarkdownEditor",
  component: MarkdownEditor,
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

const MarkdownEditorWithState = () => {
  const [value, setValue] = useState('');
  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      placeholder="What's on your mind? Markdown supported..."
    />
  );
};

export const Default: Story = {
  render: () => <MarkdownEditorWithState />,
};

const PrefilledEditor = () => {
  const [value, setValue] = useState('# Hello World\n\nThis is **bold** and *italic* text.');
  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      placeholder="What's on your mind?"
    />
  );
};

export const WithContent: Story = {
  render: () => <PrefilledEditor />,
};
