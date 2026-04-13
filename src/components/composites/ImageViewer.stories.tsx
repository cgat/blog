import type { Meta, StoryObj } from "@storybook/react";
import { ImageViewer } from "./ImageViewer";
import { fn } from "storybook/test";

const meta: Meta<typeof ImageViewer> = {
  title: "The Dioramas/ImageViewer",
  component: ImageViewer,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 2.4: The Media Viewer. Displays a single image or video with controls for navigation, liking, and caption editing.",
      },
    },
  },
  args: {
    onClose: fn(),
    onPrev: fn(),
    onNext: fn(),
    onLike: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ImageViewer>;

export const WithImage: Story = {
  args: {
    image: {
      id: "1",
      url: "https://picsum.photos/seed/viewer/800/600",
      width: 800,
      height: 600,
      likeCount: 3,
      likedByMe: false,
    },
    isOwner: true,
  },
};

export const WithVideo: Story = {
  args: {
    image: {
      id: "v1",
      url: "https://www.w3schools.com/html/mov_bbb.mp4",
      width: 800,
      height: 450,
      mimeType: "video/mp4",
      likeCount: 1,
      likedByMe: false,
    },
    isOwner: true,
  },
};

export const WithCaption: Story = {
  args: {
    image: {
      id: "2",
      url: "https://picsum.photos/seed/caption/800/600",
      width: 800,
      height: 600,
      caption: "A lovely afternoon at the park",
      likeCount: 7,
      likedByMe: true,
    },
    isOwner: false,
  },
};
