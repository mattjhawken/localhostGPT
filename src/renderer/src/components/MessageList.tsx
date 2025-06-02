import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin
} from '@mdxeditor/editor'
import React from 'react'
import { Message } from '../types/chat'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onFeedback: (index: number, feedback: 'positive' | 'negative') => void
}

// Minimal language list
const codeBlockLanguages = {
  '': 'Plain text',
  javascript: 'JavaScript',
  jsx: 'JSX',
  typescript: 'TypeScript',
  python: 'Python',
  json: 'JSON',
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML'
}

// Simple fallback renderer for problematic content
const FallbackRenderer = ({ content }) => {
  // Basic markdown-like rendering for common patterns
  const renderContent = (text) => {
    // Handle code blocks
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        })
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || '',
        content: match[2]
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }

  const parts = renderContent(content)

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="bg-gray-800 rounded p-3 overflow-x-auto">
              {part.language && <div className="text-xs text-gray-400 mb-2">{part.language}</div>}
              <pre className="text-sm whitespace-pre-wrap">
                <code>{part.content}</code>
              </pre>
            </div>
          )
        } else {
          // Simple text rendering with basic formatting
          const textContent = part.content.split('\n').map((line, lineIndex) => (
            <div key={lineIndex} className={line.trim() === '' ? 'h-4' : ''}>
              {line || '\u00A0'}
            </div>
          ))

          return <div key={index}>{textContent}</div>
        }
      })}
    </div>
  )
}

// Robust markdown renderer with better error handling
const RobustMarkdownRenderer = ({ content }) => {
  const [shouldUseFallback, setShouldUseFallback] = React.useState(false)

  // Check if content might cause issues
  const hasProblematicContent = React.useMemo(() => {
    // Check for JSX outside of code blocks
    const codeBlockRegex = /```[\s\S]*?```/g
    const contentWithoutCodeBlocks = content.replace(codeBlockRegex, '')

    // Look for JSX-like patterns
    const jsxPattern = /<[A-Z][a-zA-Z0-9]*[\s\S]*?>/
    const hasJSX = jsxPattern.test(contentWithoutCodeBlocks)

    // Check for other potentially problematic patterns
    const hasComplexMarkdown = /\$\$[\s\S]*?\$\$|\${[\s\S]*?}/.test(content)

    return hasJSX || hasComplexMarkdown
  }, [content])

  // Use fallback for potentially problematic content
  if (shouldUseFallback || hasProblematicContent) {
    return <FallbackRenderer content={content} />
  }

  // Try MDXEditor with error boundary
  return (
    <ErrorBoundary
      fallback={<FallbackRenderer content={content} />}
      onError={() => setShouldUseFallback(true)}
    >
      <MDXEditor
        readOnly
        markdown={content}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
          codeBlockPlugin({
            defaultCodeBlockLanguage: '',
            codeBlockLanguages: codeBlockLanguages
          }),
          codeMirrorPlugin({
            codeBlockLanguages: codeBlockLanguages
          }),
          linkPlugin()
        ]}
        contentEditableClassName="outline-none max-w-none text-base prose prose-invert prose-p:my-1 prose-p:leading-relaxed prose-headings:my-2 prose-blockquote:my-2 prose-ul:my-1 prose-li:my-0 prose-code:px-1 prose-code:text-red-300 prose-code:before:content-[''] prose-code:after:content-['']"
      />
    </ErrorBoundary>
  )
}

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Markdown rendering error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onFeedback }) => {
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-auto px-4 py-2">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-4 ${
            message.role === 'user'
              ? 'ml-auto max-w-[80%]'
              : message.role === 'system'
                ? 'mx-auto max-w-[90%]'
                : 'mr-auto max-w-[80%]'
          }`}
        >
          <div
            className={`relative p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : message.role === 'system'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700 text-white rounded-bl-none'
            }`}
          >
            {message.timestamp && (
              <div className="text-xs text-white/70 mb-1">
                {message.role === 'user'
                  ? 'You'
                  : message.role === 'assistant'
                    ? 'Assistant'
                    : 'System'}{' '}
                • {formatTime(message.timestamp)}
              </div>
            )}

            <div className="markdown-content">
              <RobustMarkdownRenderer content={message.content} />
            </div>

            {message.role === 'assistant' && (
              <div className="flex mt-2 space-x-2 justify-end">
                <button
                  onClick={() => onFeedback(index, 'positive')}
                  className={`p-1 rounded ${
                    message.feedback === 'positive'
                      ? 'bg-green-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title="Mark as helpful"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.60L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => onFeedback(index, 'negative')}
                  className={`p-1 rounded ${
                    message.feedback === 'negative' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title="Mark as unhelpful"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412-.608 2.006L17 13V4m-7 10h2"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start items-center my-4 pl-4">
          <div className="flex space-x-2">
            {[0, 300, 600].map((delay, i) => (
              <div
                key={i}
                className="h-3 w-3 bg-gray-400 rounded-full animate-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
