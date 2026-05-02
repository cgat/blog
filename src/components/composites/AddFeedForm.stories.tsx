import type { Meta, StoryObj } from "@storybook/react";
import { AddFeedForm } from "./AddFeedForm";

const meta: Meta<typeof AddFeedForm> = {
  title: "The Props/AddFeedForm",
  component: AddFeedForm,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 7.3: The intake slip. Drop in a feed URL; the archivist will fetch it and file the items.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AddFeedForm>;

export const Default: Story = {
  args: {
    onAdd: async () => new Promise((r) => setTimeout(r, 500)),
  },
};

export const WithError: Story = {
  args: {
    onAdd: async () => {
      await new Promise((r) => setTimeout(r, 300));
      throw new Error("Could not parse feed at that URL");
    },
  },
};
