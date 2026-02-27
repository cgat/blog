import type { Meta, StoryObj } from "@storybook/react";
import { ColorPalette } from "./ColorPalette";

const meta: Meta<typeof ColorPalette> = {
  title: "The Equipment/ColorPalette",
  component: ColorPalette,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 0.0: The Official Palette. Six colors, carefully selected for maximum nostalgic resonance and minimum chromatic aggression. Each swatch is presented behind regulation borders.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPalette>;

export const Default: Story = {};
