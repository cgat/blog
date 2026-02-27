import type { Preview } from "@storybook/nextjs-vite";
import { createElement } from "react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "todo",
    },
  },
  decorators: [
    (Story) => {
      document.documentElement.style.setProperty(
        "--font-jost",
        '"Jost", sans-serif',
      );
      document.documentElement.style.setProperty(
        "--font-lora",
        '"Lora", serif',
      );
      document.documentElement.style.setProperty(
        "--font-courier-prime",
        '"Courier Prime", monospace',
      );
      return createElement(
        "div",
        { style: { maxWidth: "900px", margin: "0 auto" } },
        createElement(Story),
      );
    },
  ],
};

export default preview;
