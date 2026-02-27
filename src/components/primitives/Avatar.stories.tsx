import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "The Props/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component: "Fig 1.5: The Porthole. A circular viewport displaying the crew member's likeness. The 2px border evokes a submarine observation window. Falls back to initials when no photograph is on file.",
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=demo',
    alt: 'User avatar',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'John Doe',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
    </div>
  ),
};
