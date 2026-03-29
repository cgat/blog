"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LinkPreview } from "./LinkPreview";
import type { LinkPreviewData } from "@/types/post";

interface MarkdownRendererProps {
  content: string;
  truncate?: number;
  linkPreviews?: Record<string, LinkPreviewData>;
}

export function MarkdownRenderer({
  content,
  truncate,
  linkPreviews,
}: MarkdownRendererProps) {
  const displayContent =
    truncate && content.length > truncate
      ? content.slice(0, truncate) + "..."
      : content;

  return (
    <div className="prose max-w-none prose-a:text-deep-ocean-teal prose-headings:text-inkstain">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children, node, ...props }) => {
            const childArray = React.Children.toArray(children);
            if (childArray.length === 1 && linkPreviews) {
              const child = childArray[0];
              if (
                React.isValidElement(child) &&
                child.type === "a" &&
                typeof child.props.href === "string"
              ) {
                const href = child.props.href;
                const text = child.props.children;
                if (
                  typeof text === "string" &&
                  text === href &&
                  linkPreviews[href]
                ) {
                  const preview = linkPreviews[href];
                  return (
                    <LinkPreview
                      url={preview.url}
                      title={preview.title}
                      description={preview.description}
                      imageUrl={preview.imageUrl}
                      domain={preview.domain}
                    />
                  );
                }
              }
            }
            return <p {...props}>{children}</p>;
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
