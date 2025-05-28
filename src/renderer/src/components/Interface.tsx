import { ChatSettingsComponent } from '@renderer/components/ChatSettings'
import { MessageInput } from '@renderer/components/MessageInput'
import { MessageList } from '@renderer/components/MessageList'
import { useChat } from '@renderer/hooks/useChat'
import { useChatSettings } from '@renderer/hooks/useChatSettings'
import { useMarkdownEditor } from '@renderer/hooks/useInterface'
import { useMessages } from '@renderer/hooks/useMessages'
import { saveChatAtom } from '@renderer/store'
import { Message } from '@renderer/types/chat'
import { useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export const Interface = () => {
  const { selectedChat } = useMarkdownEditor()
  const saveChat = useSetAtom(saveChatAtom)
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

  const { messages, addMessage, updateMessage } = useMessages(selectedChat, saveChat)

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
