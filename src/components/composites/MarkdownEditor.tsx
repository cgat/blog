'use client';

import { useState } from 'react';
import { TextArea } from '../primitives/TextArea';
import { Button } from '../primitives/Button';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {showPreview ? (
        <div className="min-h-[120px] p-3 border-2 border-inkstain bg-cream">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="zissou-mono text-inkstain/40 italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoExpand
          rows={3}
        />
      )}
    </div>
  );
}
