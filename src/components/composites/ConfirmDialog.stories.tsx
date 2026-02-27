import type { Meta, StoryObj } from "@storybook/react";
import { useState } from 'react';
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "../primitives/Button";

const meta: Meta<typeof ConfirmDialog> = {
  title: "The Dioramas/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    docs: {
      description: {
        component: 'Fig 2.7: The Confirmation Bureau. A modal dialog that requires explicit authorization before proceeding with consequential actions. The danger variant employs tracksuit red to convey the gravity of deletion.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

const DeleteDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Delete Post</Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Delete post?"
        message="This action cannot be undone. The post will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          alert('Deleted!');
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
};

export const DeleteConfirmation: Story = {
  render: () => <DeleteDemo />,
};

const DefaultDemo = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Show Dialog</Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Publish post?"
        message="Your post will be visible to everyone."
        confirmLabel="Publish"
        onConfirm={() => {
          alert('Published!');
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <DefaultDemo />,
};
