import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "The Props/Toggle",
  component: Toggle,
  parameters: {
    docs: {
      description: {
        component: "Fig 1.6: The Binary Selector. A physical flip-switch rendered in digital form. The knob — submarine yellow — travels between states with a deliberate, stop-motion snap. There are only two positions. There is no ambiguity."
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

const ToggleDemo = () => {
  const [checked, setChecked] = useState(false);
  return <Toggle checked={checked} onChange={() => setChecked(!checked)} label={checked ? "ON" : "OFF"} />;
};

export const Default: Story = {
  render: () => <ToggleDemo />,
};

const PrivacyDemo = () => {
  const [isPrivate, setIsPrivate] = useState(false);
  return <Toggle checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} label={isPrivate ? "PRIVATE" : "PUBLIC"} />;
};

export const PrivacyToggle: Story = {
  render: () => <PrivacyDemo />,
};

export const Checked: Story = {
  args: {
    checked: true,
    label: "ACTIVE",
  },
};

export const Unchecked: Story = {
  args: {
    checked: false,
    label: "INACTIVE",
  },
};
