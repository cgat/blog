import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { ShareMenu } from "./ShareMenu";
import { Button } from "../primitives/Button";

const meta: Meta<typeof ShareMenu> = {
  title: "The Dioramas/ShareMenu",
  component: ShareMenu,
  parameters: {
    docs: {
      description: {
        component: 'Fig 2.8: The Distribution Panel. A dropdown menu offering two methods of dispatch distribution: Facebook syndication and clipboard link duplication. Monospaced labels. Submarine yellow hover states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ShareMenu>;

const ShareMenuDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="relative inline-block">
      <Button onClick={() => setIsOpen(!isOpen)}>Share</Button>
      <ShareMenu
        postUrl="https://myblog.com/posts/abc123"
        postTitle="My awesome post"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <ShareMenuDemo />,
};
