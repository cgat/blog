import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "The Props/Chip",
  component: Chip,
  parameters: {
    docs: {
      description: {
        component: "Fig 1.3: The Classification Tablet. A compact label used for categorization purposes. When selected, it assumes the deep ocean teal of official designation. When idle, cream.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    children: 'travel',
  },
};

export const Selected: Story = {
  args: {
    children: 'photography',
    selected: true,
  },
};

export const Removable: Story = {
  args: {
    children: 'thoughts',
    removable: true,
    onRemove: () => alert('Remove clicked'),
  },
};

export const FilterChips: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Chip selected>All</Chip>
      <Chip>travel</Chip>
      <Chip>photography</Chip>
      <Chip>tech</Chip>
      <Chip>thoughts</Chip>
    </div>
  ),
};

export const TagInput: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap items-center">
      <Chip removable onRemove={() => {}}>travel</Chip>
      <Chip removable onRemove={() => {}}>photography</Chip>
      <span className="text-deep-ocean-teal zissou-mono text-xs uppercase cursor-pointer hover:underline">+ Add tag</span>
    </div>
  ),
};
