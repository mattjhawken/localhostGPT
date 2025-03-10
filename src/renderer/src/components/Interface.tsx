import {
  MDXEditor,
  codeBlockPlugin,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin
} from '@mdxeditor/editor'
import { useMarkdownEditor } from '@renderer/hooks/useInterface'
import { saveChatAtom } from '@renderer/store'
import { ChatContent } from '@shared/models'
import { useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

interface ChatSettings {
  modelName: string
  temperature: number
  maxTokens: number
  isTensorLinkConnected: boolean
}

export const Interface = () => {
  const { editorRef, selectedChat, handleAutoSaving, handleBlur } = useMarkdownEditor()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const saveChat = useSetAtom(saveChatAtom)

  // Default chat settings
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    modelName: 'default-model',
    temperature: 0.7,
    maxTokens: 1024,
    isTensorLinkConnected: false
  })

  // Available models
  const availableModels = [
    { id: 'default-model', name: 'Default Model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    { id: 'llama-3-70b', name: 'Llama 3 70B' },
    { id: 'mistral-large', name: 'Mistral Large' }
  ]

  // Initialize messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      try {
        const parsedMessages = JSON.parse(selectedChat.content) as Message[]
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages)
        } else {
          setMessages([
            {
              role: 'system',
              content: 'Previous note converted to chat:\n\n' + selectedChat.content,
              timestamp: Date.now()
            }
          ])
        }
      } catch (e) {
        if (selectedChat.content && selectedChat.content.trim()) {
          setMessages([
            {
              role: 'system',
              content: 'Previous note converted to chat:\n\n' + selectedChat.content,
              timestamp: Date.now()
            }
          ])
        } else {
          setMessages([
            {
              role: 'system',
              content:
                '# Welcome to Chat Mode\n\nThis note has been converted to a chat interface. Type a message below to start chatting!',
              timestamp: Date.now()
            }
          ])
        }
      }
    } else {
      setMessages([
        {
          role: 'system',
          content:
            '# Select or create a chat\n\nPlease select an existing note or create a new one to start chatting.',
          timestamp: Date.now()
        }
      ])
    }
  }, [selectedChat])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat is selected
  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedChat])

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [inputMessage])

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [settingsRef])

  // Save messages to chat content
  const saveMessages = async (newMessages: Message[]) => {
    if (!selectedChat) return
    const content = JSON.stringify(newMessages) as ChatContent
    await saveChat(content)
  }

  const connectToTensorLink = () => {
    // Placeholder for TensorLink connection logic
    setChatSettings({
      ...chatSettings,
      isTensorLinkConnected: !chatSettings.isTensorLinkConnected
    })

    // Add system message about connection status
    const connectionMessage: Message = {
      role: 'system',
      content: chatSettings.isTensorLinkConnected
        ? 'Disconnected from TensorLink.'
        : 'Connected to TensorLink. Enhanced model capabilities are now available.',
      timestamp: Date.now()
    }

    const updatedMessages = [...messages, connectionMessage]
    setMessages(updatedMessages)
    saveMessages(updatedMessages)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat || isSending) return

    setIsSending(true)

    // Add user message with timestamp
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: Date.now()
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    saveMessages(newMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      // Simulate API call with more realistic delay (variable between 1-3 seconds)
      const delay = 1000 + Math.random() * 2000

      setTimeout(() => {
        const defaultResponses = [
          `I'm a placeholder response from the ${chatSettings.modelName} model (Temperature: ${chatSettings.temperature}).`,
          `When you connect your API, I'll be replaced with real responses from ${chatSettings.modelName}.`,
          'This is a simulated response. Replace the sendMessage function with actual API calls.',
          `Using ${chatSettings.modelName} (${
            chatSettings.isTensorLinkConnected ? 'with' : 'without'
          } TensorLink). This is a placeholder message.`,
          `Your message was received by ${chatSettings.modelName}. Connect your API for real interactions.`
        ]

        const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
        const assistantMessage: Message = {
          role: 'assistant',
          content: randomResponse,
          timestamp: Date.now()
        }

        const updatedMessages = [...newMessages, assistantMessage]
        setMessages(updatedMessages)
        saveMessages(updatedMessages)
        setIsLoading(false)
        setIsSending(false)
      }, delay)

      /* 
      // Uncomment and modify this code when your API is ready
      try {
        const response = await fetch('http://your-api-url/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: inputMessage,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            settings: chatSettings
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add assistant response with timestamp
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.response,
          timestamp: Date.now() 
        };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          role: 'system',
          content: 'Error: Could not process your message. Please try again later.',
          timestamp: Date.now()
        };
        const updatedMessages = [...newMessages, errorMessage];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      } finally {
        setIsLoading(false);
        setIsSending(false);
      }
      */
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'system',
        content: 'Error: Could not process your message. Please try again later.',
        timestamp: Date.now()
      }
      const updatedMessages = [...newMessages, errorMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
      setIsLoading(false)
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format timestamp for messages
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat controls */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/20">
        <div className="flex space-x-2 items-center">
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-1"
            >
              <span>
                {availableModels.find((m) => m.id === chatSettings.modelName)?.name ||
                  'Select Model'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showSettings && (
              <div className="absolute z-10 mt-1 w-64 bg-gray-800 rounded-md shadow-lg p-2 border border-white/20">
                <div className="mb-2">
                  <label className="text-xs text-white/70 block mb-1">Model</label>
                  <select
                    value={chatSettings.modelName}
                    onChange={(e) =>
                      setChatSettings({ ...chatSettings, modelName: e.target.value })
                    }
                    className="w-full bg-gray-700 text-white text-sm rounded-md px-2 py-1"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="text-xs text-white/70 block mb-1">
                    Temperature: {chatSettings.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={chatSettings.temperature}
                    onChange={(e) =>
                      setChatSettings({ ...chatSettings, temperature: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/50">
                    <span>More Precise</span>
                    <span>More Creative</span>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="text-xs text-white/70 block mb-1">
                    Max Tokens: {chatSettings.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="256"
                    value={chatSettings.maxTokens}
                    onChange={(e) =>
                      setChatSettings({ ...chatSettings, maxTokens: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={connectToTensorLink}
            className={`px-3 py-2 rounded-md text-sm ${
              chatSettings.isTensorLinkConnected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {chatSettings.isTensorLinkConnected ? 'TensorLink ✓' : 'Connect TensorLink'}
          </button>
        </div>

        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm"
          onClick={() => {
            // Placeholder for fine-tuning action
            const fineTuningMessage: Message = {
              role: 'system',
              content:
                '**Fine-tuning initiated.** This process will analyze your chat history to improve future responses.',
              timestamp: Date.now()
            }

            const updatedMessages = [...messages, fineTuningMessage]
            setMessages(updatedMessages)
            saveMessages(updatedMessages)
          }}
        >
          Fine-tune Model
        </button>
      </div>

      {/* Chat messages container */}
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
            </div>
          </div>
        ))}

        {/* Loading indicator - improved animation */}
        {isLoading && (
          <div className="flex justify-start items-center my-4 pl-4">
            <div className="flex space-x-2">
              <div
                className="h-3 w-3 bg-gray-400 rounded-full animate-pulse"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="h-3 w-3 bg-gray-400 rounded-full animate-pulse"
                style={{ animationDelay: '300ms' }}
              ></div>
              <div
                className="h-3 w-3 bg-gray-400 rounded-full animate-pulse"
                style={{ animationDelay: '600ms' }}
              ></div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-end">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedChat ? 'Type your message here...' : 'Select a chat to start messaging...'
            }
            className="flex-1 bg-gray-800 text-white rounded-lg p-3 outline-none resize-none min-h-[40px] max-h-[150px] transition-all overflow-y-auto"
            disabled={!selectedChat || isSending}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !selectedChat || !inputMessage.trim() || isSending}
            className={`ml-2 text-white p-3 rounded-lg transition-all ${
              isLoading || !selectedChat || !inputMessage.trim() || isSending
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
            aria-label="Send message"
          >
            {isSending ? (
              <svg
                className="animate-spin h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        {selectedChat && (
          <div className="text-xs text-white/50 mt-2 px-1">
            Press Enter to send message, Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  )
}
