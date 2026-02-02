import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { FilterBar } from "./FilterBar";

const meta: Meta<typeof FilterBar> = {
  title: "Composites/FilterBar",
  component: FilterBar,
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

const FilterBarWithState = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const tags = ['travel', 'photography', 'tech', 'thoughts', 'books', 'music'];

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <FilterBar
      tags={tags}
      selectedTags={selected}
      onTagToggle={toggle}
    />
  );
};

export const Default: Story = {
  render: () => <FilterBarWithState />,
};

export const WithSelection: Story = {
  args: {
    tags: ['travel', 'photography', 'tech', 'thoughts'],
    selectedTags: ['travel', 'photography'],
    onTagToggle: () => {},
  },
};

export const Empty: Story = {
  args: {
    tags: [],
    selectedTags: [],
    onTagToggle: () => {},
  },
};
