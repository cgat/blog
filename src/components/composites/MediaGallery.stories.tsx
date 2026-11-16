import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { MediaGallery } from "./MediaGallery";
import { MediaLayoutPicker } from "./MediaLayoutPicker";
import type { MediaLayout } from "@/lib/media-layout";

const meta: Meta<typeof MediaGallery> = {
  title: "The Dioramas/MediaGallery",
  component: MediaGallery,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 2.4: The Exhibition Hall. One set of photographs, six ways to hang them. The arrangement is chosen per post in the Composer.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-post p-6 zissou-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MediaGallery>;

const photo = (id: number, width: number, height: number, caption?: string) => ({
  id: `p${id}`,
  url: `https://picsum.photos/seed/gallery-${id}/${width}/${height}`,
  width,
  height,
  caption,
});

// A deliberately mixed bag of shapes: the layouts differ most in how they
// cope with portraits next to landscapes.
const photos = [
  photo(1, 1200, 800, "The harbour at first light."),
  photo(2, 800, 1200),
  photo(3, 1200, 900, "Lunch, eventually."),
  photo(4, 1000, 1000),
  photo(5, 1600, 900),
  photo(6, 900, 1200, "The long way down."),
  photo(7, 1200, 800),
  photo(8, 800, 1000),
  photo(9, 1400, 800, "Back at the boat."),
];

const video = {
  id: "v1",
  url: "https://www.w3schools.com/html/mov_bbb.mp4",
  width: 800,
  height: 450,
  mimeType: "video/mp4",
};

export const ShowcaseOne: Story = {
  args: { layout: "showcase", images: photos.slice(0, 1) },
};

export const ShowcaseTwo: Story = {
  args: { layout: "showcase", images: photos.slice(0, 2) },
};

export const ShowcaseThree: Story = {
  args: { layout: "showcase", images: [photos[0], photos[2], photos[4]] },
};

export const ShowcaseThreePortraitLead: Story = {
  args: { layout: "showcase", images: [photos[1], photos[0], photos[3]] },
};

export const Masonry: Story = {
  args: { layout: "masonry", images: photos },
};

export const Filmstrip: Story = {
  args: { layout: "filmstrip", images: photos },
};

export const Slides: Story = {
  args: { layout: "slides", images: photos },
};

export const Stack: Story = {
  args: { layout: "stack", images: photos },
};

export const Auto: Story = {
  args: { layout: "auto", images: photos },
};

export const MixedMedia: Story = {
  args: { layout: "filmstrip", images: [photos[0], video, photos[1], photos[2]] },
};

// Flip between arrangements with the same picker the Composer uses.
export const Playground: Story = {
  render: function PlaygroundStory() {
    const [layout, setLayout] = useState<MediaLayout>("showcase");
    return (
      <div className="flex flex-col gap-4">
        <MediaLayoutPicker value={layout} onChange={setLayout} />
        <MediaGallery images={photos} layout={layout} />
      </div>
    );
  },
};
