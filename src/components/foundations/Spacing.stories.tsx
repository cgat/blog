import type { Meta, StoryObj } from "@storybook/react";
import { Spacing } from "./Spacing";

const meta: Meta<typeof Spacing> = {
  title: "The Equipment/Spacing",
  component: Spacing,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 0.2: The Measured Intervals. A precise scale of spatial units, from 4 pixels to 32 pixels. Consistency in spacing is the hallmark of a well-organized expedition.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spacing>;

export const Default: Story = {};
