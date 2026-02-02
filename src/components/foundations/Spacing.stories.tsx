import type { Meta, StoryObj } from "@storybook/react";
import { Spacing } from "./Spacing";

const meta: Meta<typeof Spacing> = {
  title: "Foundations/Spacing",
  component: Spacing,
};

export default meta;
type Story = StoryObj<typeof Spacing>;

export const Default: Story = {};
