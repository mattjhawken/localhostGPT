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

const API_URL = 'http://127.0.0.1:5053/api'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  feedback?: 'positive' | 'negative' | null
}

interface ChatSettings {
  modelName?: string
  temperature: number
  maxTokens: number
  isTensorlinkConnected: boolean
  isModelInitialized: false
}

interface Model {
  id: string
  name: string
  requires_tensorlink: boolean
}

export const Interface = () => {
  const { editorRef, selectedChat, handleAutoSaving, handleBlur } = useMarkdownEditor()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [isConnectingTensorlink, setIsConnectingTensorlink] = useState(false)
  const [showTensorlinkModal, setShowTensorlinkModal] = useState(false)
  const [fineTuningJobs, setFineTuningJobs] = useState<Record<string, any>>({})
  const [isInitializingModel, setIsInitializingModel] = useState(false)
  const [showModelModal, setShowModelModal] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const saveChat = useSetAtom(saveChatAtom)

  // Check if we should show the initial modal
  useEffect(() => {
    const hasSeenTensorlinkPrompt = sessionStorage.getItem('hasSeenTensorlinkPrompt')
    if (!false) {
      setShowTensorlinkModal(true)
    } else {
      setShowTensorlinkModal(false)
    }
  }, [])

  // Add this function to handle the user's choice
  const handleTensorlinkChoice = async (connect) => {
    // Save that the user has seen this prompt
    sessionStorage.setItem('hasSeenTensorlinkPrompt', 'true')

    if (connect) {
      // User chose to connect to Tensorlink
      await connectToTensorlink()
    } else {
      // User chose to continue with limited capabilities
      const infoMessage: Message = {
        role: 'system',
        content: 'You are using local capabilities only. Some features will be limited.',
        timestamp: Date.now()
      }
      const updatedMessages = [...messages, infoMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
    }

    setShowTensorlinkModal(false)
  }

  // Default chat settings
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    modelName: 'default-model',
    temperature: 0.7,
    maxTokens: 1024,
    isTensorlinkConnected: false,
    isModelInitialized: false
  })

  // Fetch available models and tensorlink status
  useEffect(() => {
    fetchModels()
    checkTensorlinkStatus()
  }, [])

  useEffect(() => {
    // If the selected model doesn't exist in available models, select the first one
    if (availableModels.length > 0) {
      const modelExists = availableModels.some((model) => model.id === chatSettings.modelName)
      if (!modelExists) {
        setChatSettings((prev) => ({ ...prev, modelName: availableModels[0].id }))
      }
    }
  }, [availableModels])

  // Initialize messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      try {
        const parsedMessages = JSON.parse(selectedChat.content) as Message[]
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages)

          const assistantMessages = parsedMessages.filter((m) => m.role === 'assistant')

          if (assistantMessages.length > 0) {
            const latestMessage = assistantMessages[assistantMessages.length - 1]
            if (latestMessage) {
              // Reset
              setChatSettings((prev) => ({
                ...prev,
                isModelInitialized: false
              }))

              if (chatSettings.isTensorlinkConnected) {
                setShowModelModal(true)
              }
            }
          }
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
                '## Welcome to localhostGPT\n\nA private AI experience powered by local data and peer-to-peer computing. Select an existing chat or type a message below to start chatting!',
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
            '## Select or create a chat\n\nPlease select an existing note or create a new one to start chatting.',
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

  // Fetch available models from API
  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_URL}/models`)
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }
      const models = await response.json()
      setAvailableModels(models)
    } catch (error) {
      console.error(`Error fetching models:`, error)
      setAvailableModels([
        { id: 'default-model', name: 'Default Model', requires_tensorlink: false }
      ])
    }
  }

  // Check Tensorlink connection status
  const checkTensorlinkStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`)
      if (!response.ok) {
        throw new Error(`Failed to check Tensorlink status: ${response.status}`)
      }
      const data = await response.json()
      setChatSettings((prev) => ({ ...prev, isTensorlinkConnected: data.connected }))

      // Refresh models after checking Tensorlink status
      fetchModels()
    } catch (error) {
      console.error('Error checking Tensorlink status:', error)
    }
  }

  const connectToTensorlink = async () => {
    // Placeholder for Tensorlink connection logic
    try {
      setIsConnectingTensorlink(true)
      const response = await fetch(`${API_URL}/connect`)

      if (!response.ok) {
        throw new Error(`Failed to connect to Tensorlink: ${response.status}`)
      }

      const data = await response.json()
      setChatSettings((prev) => ({ ...prev, isTensorlinkConnected: true }))

      // Add system message about connection status
      const connectionMessage: Message = {
        role: 'system',
        content: chatSettings.isTensorlinkConnected
          ? 'Disconnected from Tensorlink.'
          : 'Connected to Tensorlink. Enhanced model capabilities are now available.',
        timestamp: Date.now()
      }

      const updatedMessages = [...messages, connectionMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
      setShowTensorlinkModal(false)

      // Refresh available models
      fetchModels()
    } catch (error) {
      console.error(`Error connecting to Tensorlink:`, error)
      const errorMessage: Message = {
        role: 'system',
        content: 'Error: Could not connect to Tensorlink.',
        timestamp: Date.now()
      }

      const updatedMessages = [...messages, errorMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
    } finally {
      setIsConnectingTensorlink(false)
    }
  }

  // Initiate fine-tuning
  const initiateFinetuning = async () => {
    if (!selectedChat) return

    try {
      const response = await fetch(`${API_URL}/finetune`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelName: chatSettings.modelName,
          chatHistory: messages.filter((m) => m.role !== 'system'),
          feedbackData: messages
            .filter((m) => m.role === 'assistant' && m.feedback)
            .map((m) => ({
              messageId: messages.indexOf(m),
              feedback: m.feedback
            }))
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initiate fine-tuning: ${response.status}`)
      }

      const data = await response.json()

      // Add system message about fine-tuning
      const fineTuningMessage: Message = {
        role: 'system',
        content:
          data.message ||
          '**Fine-tuning initiated.** This process will analyze your chat history to improve future responses.',
        timestamp: Date.now()
      }

      const updatedMessages = [...messages, fineTuningMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)

      // Add job to fine-tuning jobs
      if (data.job_id) {
        setFineTuningJobs((prev) => ({
          ...prev,
          [data.job_id]: {
            model: chatSettings.modelName,
            status: 'processing',
            progress: 0,
            created_at: Date.now()
          }
        }))

        // Start polling job status
        pollFineTuningStatus(data.job_id)
      }
    } catch (error) {
      console.error('Error initiating fine-tuning:', error)
      const errorMessage: Message = {
        role: 'system',
        content: 'Error: Could not initiate fine-tuning. Please try again later.',
        timestamp: Date.now()
      }

      const updatedMessages = [...messages, errorMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
    }
  }

  // Poll fine-tuning job status
  const pollFineTuningStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/finetune/${jobId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch fine-tuning status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.job) {
        setFineTuningJobs((prev) => ({
          ...prev,
          [jobId]: data.job
        }))

        // Continue polling if job is still processing
        if (data.job.status === 'processing') {
          setTimeout(() => pollFineTuningStatus(jobId), 5000)
        } else if (data.job.status === 'completed') {
          // Add system message about completion
          const completionMessage: Message = {
            role: 'system',
            content: `**Fine-tuning completed.** The model has been updated based on your chat history.`,
            timestamp: Date.now()
          }

          const updatedMessages = [...messages, completionMessage]
          setMessages(updatedMessages)
          saveMessages(updatedMessages)
        }
      }
    } catch (error) {
      console.error('Error polling fine-tuning status:', error)
    }
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
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          settings: chatSettings
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      const updatedMessages = [...newMessages, assistantMessage]
      setMessages(updatedMessages)
      saveMessages(updatedMessages)
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
    } finally {
      setIsLoading(false)
      setIsSending(false)
    }
  }

  const handleFeedback = (index: number, feedback: 'positive' | 'negative') => {
    const updatedMessages = [...messages]
    updatedMessages[index] = {
      ...updatedMessages[index],
      feedback: feedback
    }
    setMessages(updatedMessages)
    saveMessages(updatedMessages)
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
            onClick={connectToTensorlink}
            disabled={isConnectingTensorlink}
            className={`px-3 py-2 rounded-md text-sm ${
              isConnectingTensorlink
                ? 'bg-gray-600 text-white/70 cursor-not-allowed'
                : chatSettings.isTensorlinkConnected
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isConnectingTensorlink
              ? 'Connecting...'
              : chatSettings.isTensorlinkConnected
                ? 'Tensorlink ✓'
                : 'Connect Tensorlink'}
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
              {/* Inside the message rendering map function */}
              {message.role === 'assistant' && (
                <div className="flex mt-2 space-x-2 justify-end">
                  <button
                    onClick={() => handleFeedback(index, 'positive')}
                    className={`p-1 rounded ${
                      message.feedback === 'positive'
                        ? 'bg-green-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label="Good response"
                    title="Mark as helpful"
                  >
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
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleFeedback(index, 'negative')}
                    className={`p-1 rounded ${
                      message.feedback === 'negative'
                        ? 'bg-red-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label="Bad response"
                    title="Mark as unhelpful"
                  >
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
                        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
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

      {/* Your existing Tensorlink connection modal (if any) */}
      {showTensorlinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Initialize Tensorlink?</h2>
            <p className="text-white/80 mb-6">
              Tensorlink enables larger and more advanced models by leveraging peer-to-peer
              computation.
            </p>
            <p className="text-red-500 mb-6">Currently requires UPnP.</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTensorlinkModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={connectToTensorlink}
                disabled={isConnectingTensorlink}
                className={`px-4 py-2 rounded-md ${
                  isConnectingTensorlink
                    ? 'bg-gray-600 text-white/70 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isConnectingTensorlink ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
