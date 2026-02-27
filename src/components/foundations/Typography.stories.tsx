import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "./Typography";

const meta: Meta<typeof Typography> = {
  title: "The Equipment/Typography",
  component: Typography,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 0.1: The Type Specimen. Three typefaces comprise the official communications system: Jost for headings and labels, Lora for body text, and Courier Prime for data, timestamps, and classified information.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Default: Story = {};
