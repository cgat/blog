import type { Meta, StoryObj } from "@storybook/react";
const action = (name: string) => (...args: unknown[]) => console.log(`[${name}]`, ...args);
import { useState } from "react";
import { ProjectorViewer } from "./ProjectorViewer";
import type { PostImage } from "@/types/post";

const mockImage = (id: string, index: number): PostImage => ({
  id,
  url: `https://picsum.photos/seed/${id}/800/600`,
  width: 800,
  height: 600,
  likeCount: index,
  likedByMe: false,
});

const singleImage = [mockImage("solo", 0)];

const fiveImages = Array.from({ length: 5 }, (_, i) =>
  mockImage(`img-${i}`, i),
);

const manyImages = Array.from({ length: 18 }, (_, i) =>
  mockImage(`many-${i}`, i),
);

const captionedImage: PostImage = {
  ...mockImage("captioned", 2),
  caption: "The view from Darjeeling, just before the train departed.",
};

const ownerImages: PostImage[] = [
  { ...mockImage("own-0", 3), featured: true, caption: "The hero shot" },
  mockImage("own-1", 1),
  { ...mockImage("own-2", 0), caption: "Behind the scenes" },
];

function InteractiveWrapper(
  props: React.ComponentProps<typeof ProjectorViewer>,
) {
  const [index, setIndex] = useState(props.currentIndex);
  return (
    <ProjectorViewer
      {...props}
      currentIndex={index}
      onNavigate={(i) => {
        setIndex(i);
        action("onNavigate")(i);
      }}
    />
  );
}

const meta: Meta<typeof ProjectorViewer> = {
  title: "The Dioramas/ProjectorViewer",
  component: ProjectorViewer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A full-viewport modal image viewer styled as a vintage slide projector. Features a circular slide tray, crossfade transitions, keyboard/swipe navigation, and a clicker remote.",
      },
    },
  },
  argTypes: {
    onClose: { action: "onClose" },
    onNavigate: { action: "onNavigate" },
    onLike: { action: "onLike" },
    onCaptionSave: { action: "onCaptionSave" },
    onFeaturedToggle: { action: "onFeaturedToggle" },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectorViewer>;

export const SingleImage: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    images: singleImage,
    currentIndex: 0,
    onClose: action("onClose"),
    onNavigate: action("onNavigate"),
    onLike: action("onLike"),
  },
};

export const MultipleImages: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    images: fiveImages,
    currentIndex: 0,
    onClose: action("onClose"),
    onNavigate: action("onNavigate"),
    onLike: action("onLike"),
  },
};

export const WithCaption: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    images: [captionedImage],
    currentIndex: 0,
    onClose: action("onClose"),
    onNavigate: action("onNavigate"),
    onLike: action("onLike"),
  },
};

export const OwnerMode: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    images: ownerImages,
    currentIndex: 0,
    isOwner: true,
    onClose: action("onClose"),
    onNavigate: action("onNavigate"),
    onLike: action("onLike"),
    onCaptionSave: action("onCaptionSave"),
    onFeaturedToggle: action("onFeaturedToggle"),
  },
};

export const ManyImages: Story = {
  render: (args) => <InteractiveWrapper {...args} />,
  args: {
    images: manyImages,
    currentIndex: 9,
    onClose: action("onClose"),
    onNavigate: action("onNavigate"),
    onLike: action("onLike"),
  },
};
