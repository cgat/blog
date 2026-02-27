import type { Meta, StoryObj } from "@storybook/react";
import { ImageGrid } from "./ImageGrid";

const meta: Meta<typeof ImageGrid> = {
  title: "The Dioramas/ImageGrid",
  component: ImageGrid,
  parameters: {
    docs: {
      description: {
        component: 'Fig 2.3: The Photographic Evidence Grid. Displays one to four images in a measured grid formation. Additional images beyond four are noted with a count overlay, filed but not immediately visible.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageGrid>;

const mockImages = [
  { id: '1', url: 'https://picsum.photos/seed/1/800/600', width: 800, height: 600 },
  { id: '2', url: 'https://picsum.photos/seed/2/800/600', width: 800, height: 600 },
  { id: '3', url: 'https://picsum.photos/seed/3/800/600', width: 800, height: 600 },
  { id: '4', url: 'https://picsum.photos/seed/4/800/600', width: 800, height: 600 },
  { id: '5', url: 'https://picsum.photos/seed/5/800/600', width: 800, height: 600 },
];

export const SingleImage: Story = {
  args: {
    images: [mockImages[0]],
  },
};

export const TwoImages: Story = {
  args: {
    images: mockImages.slice(0, 2),
  },
};

export const ThreeImages: Story = {
  args: {
    images: mockImages.slice(0, 3),
  },
};

export const FourImages: Story = {
  args: {
    images: mockImages.slice(0, 4),
  },
};

export const MoreThanFour: Story = {
  args: {
    images: mockImages,
  },
};

export const ExpandedView: Story = {
  args: {
    images: mockImages,
    expanded: true,
  },
};
