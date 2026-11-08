'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Render Markdown without executing embedded HTML or loading remote images. */
export function MarkdownView({ text }: { text: string }) {
  return (
    <div className="meeting-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        img: ({ alt }) => <span className="muted">[이미지: {alt || '첨부 이미지'}]</span>,
        table: ({ children }) => <div className="markdown-table"><table>{children}</table></div>,
      }}>{text}</ReactMarkdown>
    </div>
  );
}
