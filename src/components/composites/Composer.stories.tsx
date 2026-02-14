import type { Meta, StoryObj } from "@storybook/react";
import { Composer } from "./Composer";

const meta: Meta<typeof Composer> = {
  title: "Composites/Composer",
  component: Composer,
};

export default meta;
type Story = StoryObj<typeof Composer>;

export const Default: Story = {
  args: {
    userName: 'John Doe',
    existingTags: ['travel', 'photography', 'tech', 'thoughts'],
    onPublish: (data) => {
      console.log('Publishing:', data);
      alert(`Publishing:\n${JSON.stringify(data, null, 2)}`);
    },
  },
};

export const WithAvatar: Story = {
  args: {
    userAvatar: 'https://i.pravatar.cc/150?u=demo',
    userName: 'John Doe',
    existingTags: ['travel', 'photography'],
    onPublish: (data) => console.log('Publishing:', data),
  },
};

export const Submitting: Story = {
  args: {
    userName: 'John Doe',
    existingTags: ['travel'],
    onPublish: () => {},
    isSubmitting: true,
  },
};

export const EmptyState: Story = {
  args: {
    userName: 'New User',
    existingTags: [],
    onPublish: (data) => console.log('Publishing:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'This is your space. What\'s on your mind?',
      },
    },
  },
};

export const WithContentSources: Story = {
  args: {
    userName: 'John Doe',
    existingTags: ['travel', 'photography', 'Movie Review'],
    onPublish: (data) => {
      console.log('Publishing:', data);
      alert(`Publishing:\n${JSON.stringify(data, null, 2)}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Composer with content source buttons (Movie). Click the Movie button to reveal the search input.',
      },
    },
  },
};
