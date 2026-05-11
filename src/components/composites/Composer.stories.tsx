import type { Meta, StoryObj } from "@storybook/react";
import { Composer } from "./Composer";

const meta: Meta<typeof Composer> = {
  title: "The Dioramas/Composer",
  component: Composer,
  parameters: {
    docs: {
      description: {
        component: 'Fig 2.1: The Composition Station. The primary apparatus for drafting new dispatches. Equipped with markdown formatting, photographic attachment, content source search, classification management, and a privacy toggle. Observe the submarine yellow Publish button at lower right.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

export const Default: Story = {
  args: {
    userName: 'John Doe',
    existingTags: [
      { name: 'travel', count: 24 },
      { name: 'photography', count: 18 },
      { name: 'tech', count: 12 },
      { name: 'thoughts', count: 9 },
    ],
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
    existingTags: [
      { name: 'travel', count: 24 },
      { name: 'photography', count: 18 },
    ],
    onPublish: (data) => console.log('Publishing:', data),
  },
};

export const Submitting: Story = {
  args: {
    userName: 'John Doe',
    existingTags: [{ name: 'travel', count: 24 }],
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
    existingTags: [
      { name: 'travel', count: 24 },
      { name: 'photography', count: 18 },
      { name: 'Movie Review', count: 6 },
    ],
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
