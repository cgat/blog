import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { ImageViewer } from "./ImageViewer";
import { PostImage } from "@/types/post";

const sampleImages: PostImage[] = [
  {
    id: "1",
    url: "https://picsum.photos/seed/viewer-1/1600/1200",
    alt: "Landscape one",
    caption:
      "A long caption to test the bottom panel treatment. When a caption exists, the full cream panel slides up with readable serif text, a counter, and the action row on the right.",
    width: 1600,
    height: 1200,
    featured: true,
    likeCount: 4,
    likedByMe: false,
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/viewer-2/1200/1600",
    alt: "Portrait",
    width: 1200,
    height: 1600,
    likeCount: 0,
    likedByMe: true,
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/viewer-3/1600/1000",
    alt: "Landscape two",
    caption: "Short caption.",
    width: 1600,
    height: 1000,
    likeCount: 12,
    likedByMe: false,
  },
  {
    id: "4",
    url: "https://picsum.photos/seed/viewer-4/1000/1500",
    alt: "Portrait two",
    width: 1000,
    height: 1500,
    likeCount: 2,
    likedByMe: false,
  },
  {
    id: "5",
    url: "https://picsum.photos/seed/viewer-5/1800/1200",
    alt: "Landscape three",
    width: 1800,
    height: 1200,
    likeCount: 0,
    likedByMe: false,
  },
];

function ViewerHarness({
  images,
  isOwner,
  startIndex = 0,
}: {
  images: PostImage[];
  isOwner?: boolean;
  startIndex?: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const [state, setState] = useState(images);
  return (
    <ImageViewer
      images={state}
      currentIndex={index}
      isOwner={isOwner}
      onClose={() => alert("close")}
      onNavigate={setIndex}
      onLike={() =>
        setState((prev) =>
          prev.map((img, i) =>
            i === index
              ? {
                  ...img,
                  likedByMe: !img.likedByMe,
                  likeCount: img.likeCount + (img.likedByMe ? -1 : 1),
                }
              : img,
          ),
        )
      }
      onCaptionSave={(id, caption) =>
        setState((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, caption: caption ?? undefined } : img,
          ),
        )
      }
      onFeaturedToggle={(id) =>
        setState((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, featured: !img.featured } : img,
          ),
        )
      }
    />
  );
}

const meta: Meta<typeof ViewerHarness> = {
  title: "Composites/ImageViewer",
  component: ViewerHarness,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ViewerHarness>;

export const Viewer: Story = {
  args: { images: sampleImages, isOwner: false, startIndex: 0 },
};

export const Owner: Story = {
  args: { images: sampleImages, isOwner: true, startIndex: 0 },
};

export const NoCaption: Story = {
  args: { images: sampleImages, isOwner: false, startIndex: 1 },
};

export const OwnerNoCaption: Story = {
  args: { images: sampleImages, isOwner: true, startIndex: 1 },
};

export const AtFirst: Story = {
  args: { images: sampleImages, isOwner: true, startIndex: 0 },
};

export const AtLast: Story = {
  args: { images: sampleImages, isOwner: true, startIndex: sampleImages.length - 1 },
};
