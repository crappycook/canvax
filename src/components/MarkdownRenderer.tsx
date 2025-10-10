import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
        // Customize rendering for specific elements
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
        ),
        code: ({ node, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match
          
          if (isInline) {
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            )
          }
          
          return (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },
        pre: ({ node, ...props }) => (
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 my-2" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-6 my-2 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="text-sm" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="my-2 text-sm leading-relaxed" {...props} />
        ),
        h1: ({ node, ...props }) => (
          <h1 className="text-xl font-bold my-3" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-bold my-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-bold my-2" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-2" {...props} />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border-collapse border border-muted" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th className="border border-muted bg-muted/50 px-3 py-2 text-left font-semibold text-sm" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-muted px-3 py-2 text-sm" {...props} />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
