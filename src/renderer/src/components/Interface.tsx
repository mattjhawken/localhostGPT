import { ChatSettingsComponent } from '@renderer/components/ChatSettings'
import { MessageInput } from '@renderer/components/MessageInput'
import { MessageList } from '@renderer/components/MessageList'
import { useChat } from '@renderer/hooks/useChat'
import { useChatSettings } from '@renderer/hooks/useChatSettings'
import { useMarkdownEditor } from '@renderer/hooks/useInterface'
import { useMessages } from '@renderer/hooks/useMessages'
import { resetChatAtom, saveChatAtom } from '@renderer/store'
import { Message } from '@renderer/types/chat'
import { useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export const Interface = () => {
  const { selectedChat } = useMarkdownEditor()
  const saveChat = useSetAtom(saveChatAtom)
  const resetChat = useSetAtom(resetChatAtom)
  const [inputMessage, setInputMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Custom hooks for separated concerns
  const {
    availableModels,
    chatSettings,
    setChatSettings,
    isConnectingTensorlink,
    tensorlinkStats,
    connectToTensorlink,
    getTensorlinkStats
  } = useChatSettings()

  const { messages, addMessage, updateMessage, setMessages } = useMessages(selectedChat, saveChat)

  const { isLoading, isSending, sendMessage } = useChat()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSendMessage = async () => {
    if (!selectedChat) return

    // Simplified - let useMessages handle all saving
    const result = await sendMessage(
      inputMessage,
      messages,
      chatSettings,
      addMessage // useMessages.addMessage will handle saving automatically
    )

    if (result?.success) {
      setInputMessage('')
    }
  }

  const handleFeedback = (index: number, feedback: 'positive' | 'negative') => {
    updateMessage(index, { feedback })
  }

  const handleConnectionResult = (result: { success: boolean; message: string }) => {
    const systemMessage: Message = {
      role: 'system',
      content: result.message,
      timestamp: Date.now()
    }
    addMessage(systemMessage)
  }

  const handleResetChat = async () => {
    try {
      await resetChat()

      // Reset the messages in the UI to show the default welcome message
      const getDefaultWelcomeMessage = (): Message => ({
        role: 'system',
        content:
          '## Welcome to localhostGPT\n\nAn AI experience powered by local data and peer-to-peer computing with opt-in privacy enhancing features. Select an existing chat or create a new one to start chatting!',
        timestamp: Date.now()
      })

      setMessages([getDefaultWelcomeMessage()])

      // Optionally show a success message
      const successMessage: Message = {
        role: 'system',
        content: 'Chat cleared successfully',
        timestamp: Date.now()
      }
      setTimeout(() => addMessage(successMessage), 100)
    } catch (error) {
      console.error('Failed to reset chat:', error)
      // Show error message
      const errorMessage: Message = {
        role: 'system',
        content: 'Failed to reset chat',
        timestamp: Date.now()
      }
      addMessage(errorMessage)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat controls */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-white/20">
        <div ref={settingsRef}>
          <ChatSettingsComponent
            chatSettings={chatSettings}
            setChatSettings={setChatSettings}
            availableModels={availableModels}
            showSettings={showSettings}
            tensorlinkStats={tensorlinkStats}
            getTensorlinkStats={getTensorlinkStats}
            setShowSettings={setShowSettings}
            isConnectingTensorlink={isConnectingTensorlink}
            connectToTensorlink={connectToTensorlink}
            onConnectionResult={handleConnectionResult}
            onResetChat={handleResetChat}
          />
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} onFeedback={handleFeedback} />

      <div ref={messagesEndRef} />

      {/* Input */}
      <MessageInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSend={handleSendMessage}
        disabled={!selectedChat || isSending}
        isSending={isSending}
        selectedChat={selectedChat}
      />
    </div>
  )
}
