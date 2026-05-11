import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { TagCombobox } from "./TagCombobox";

const sampleTags = [
  { name: "travel", count: 24 },
  { name: "photography", count: 18 },
  { name: "tech", count: 12 },
  { name: "thoughts", count: 9 },
  { name: "Movie Review", count: 6 },
  { name: "Book Review", count: 5 },
  { name: "music", count: 4 },
  { name: "food", count: 3 },
  { name: "trail-running", count: 2 },
  { name: "cooking", count: 2 },
  { name: "obscure-tag", count: 1 },
];

const meta: Meta<typeof TagCombobox> = {
  title: "The Props/TagCombobox",
  component: TagCombobox,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 1.7: The Searchable Classification Index. Type to filter known tags by frequency, or invent a new one on the fly. Arrow keys to navigate, Enter to commit, Escape to dismiss.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagCombobox>;

const Interactive = ({
  initialSelected = [],
}: {
  initialSelected?: string[];
}) => {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  return (
    <div className="p-12">
      <div className="flex gap-2 flex-wrap items-center">
        {selected.map((tag) => (
          <span
            key={tag}
            className="zissou-mono text-xs uppercase px-2 py-1 zissou-border bg-deep-ocean-teal text-white"
          >
            {tag}
          </span>
        ))}
        <TagCombobox
          allTags={sampleTags}
          selectedTags={selected}
          onAdd={(tag) => setSelected((prev) => [...prev, tag])}
        />
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <Interactive />,
};

export const WithSelected: Story = {
  render: () => <Interactive initialSelected={["travel", "photography"]} />,
};

export const Empty: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div className="p-12">
        <TagCombobox
          allTags={[]}
          selectedTags={selected}
          onAdd={(tag) => setSelected((prev) => [...prev, tag])}
        />
      </div>
    );
  },
};
