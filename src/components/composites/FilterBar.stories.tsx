import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { FilterBar } from "./FilterBar";

const meta: Meta<typeof FilterBar> = {
  title: "The Dioramas/FilterBar",
  component: FilterBar,
  parameters: {
    docs: {
      description: {
        component: 'Fig 2.6: The Classification Filter. A horizontal array of classification tablets. Select one or more to filter the dispatch archive. A \'Clear filters\' link appears when filters are active \u2014 monospaced, understated, effective.',
      },
    },
  },
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
