import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  truncate?: number;
}

export function MarkdownRenderer({ content, truncate }: MarkdownRendererProps) {
  const displayContent = truncate && content.length > truncate
    ? content.slice(0, truncate) + '...'
    : content;

  return (
    <div className="prose prose-slate max-w-none prose-a:text-blue-green prose-headings:text-deep-space">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
