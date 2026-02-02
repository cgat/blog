import type { Meta, StoryObj } from "@storybook/react";
import { ColorPalette } from "./ColorPalette";

const meta: Meta<typeof ColorPalette> = {
  title: "Foundations/ColorPalette",
  component: ColorPalette,
};

export default meta;
type Story = StoryObj<typeof ColorPalette>;

export const Default: Story = {};
