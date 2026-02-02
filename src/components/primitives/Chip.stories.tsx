import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "Primitives/Chip",
  component: Chip,
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
      <span className="text-blue-green text-sm cursor-pointer hover:underline">+ Add tag</span>
    </div>
  ),
};
