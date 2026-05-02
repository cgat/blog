import type { Meta, StoryObj } from "@storybook/react";
import { ActivityRow } from "./ActivityRow";

const meta: Meta<typeof ActivityRow> = {
  title: "The Dioramas/ActivityRow",
  component: ActivityRow,
  parameters: {
    docs: {
      description: {
        component:
          "Fig 9.1: One line in the archivist's daily log — a like, a comment, or a guestbook signing.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityRow>;

export const PostLike: Story = {
  args: {
    kind: "post-like",
    createdAt: new Date(Date.now() - 1000 * 60 * 12),
    postId: "abc",
    postExcerpt: "On the Quiet Pleasures of a Well-Indexed Archive",
  },
};

export const PhotoLike: Story = {
  args: {
    kind: "photo-like",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    postId: "abc",
    postExcerpt: "A walk that went somewhere unexpected",
  },
};

export const Comment: Story = {
  args: {
    kind: "comment",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    postId: "abc",
    postExcerpt: "A meal that was particularly good",
    name: "alice",
    snippet: "this reminds me of the place near the canal",
  },
};

export const AnonymousComment: Story = {
  args: {
    kind: "comment",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
    postId: "abc",
    postExcerpt: "A meal that was particularly good",
    name: null,
    snippet: "looks delicious",
  },
};

export const Guestbook: Story = {
  args: {
    kind: "guestbook",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    name: "Tomas",
    snippet: "hello from Tokyo — long time fan",
  },
};
