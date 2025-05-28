import {
  MDXEditor,
  codeBlockPlugin,
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
            <MDXEditor
              readOnly
              markdown={message.content}
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                markdownShortcutPlugin(),
                codeBlockPlugin(),
                linkPlugin()
              ]}
              contentEditableClassName="outline-none max-w-none text-base prose prose-invert prose-p:my-1 prose-p:leading-relaxed prose-headings:my-2 prose-blockquote:my-2 prose-ul:my-1 prose-li:my-0 prose-code:px-1 prose-code:text-red-300 prose-code:before:content-[''] prose-code:after:content-['']"
            />

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
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
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
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2"
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
