import { useState } from 'react'
import { ApiService } from '../services/api'
import { ChatSettings, Message } from '../types/chat'

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const sendMessage = async (
    messageContent: string,
    messages: Message[],
    settings: ChatSettings,
    onMessageAdd: (message: Message) => void
    // Removed onSaveChat parameter - let useMessages handle saving
  ) => {
    if (!messageContent.trim() || isSending) return

    setIsSending(true)

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: Date.now()
    }

    // Add user message to UI (useMessages will handle saving)
    const updatedMessagesWithUser = onMessageAdd(userMessage)

    setIsLoading(true)

    try {
      const response = await ApiService.sendChatMessage(
        userMessage.content,
        updatedMessagesWithUser.map((m) => ({ role: m.role, content: m.content })),
        settings
      )

      const responseText =
        typeof response.response === 'string'
          ? response.response
          : response.response?.response || response.response || 'No response received'

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      }

      // Add assistant message (useMessages will handle saving)
      onMessageAdd(assistantMessage)

      return { success: true }
    } catch (error) {
      console.error('🔴 API Error:', error)
      const errorMessage: Message = {
        role: 'system',
        content: 'Error: Could not process your message. Please try again later.',
        timestamp: Date.now()
      }

      // Add error message (useMessages will handle saving)
      onMessageAdd(errorMessage)

      return { success: false, error }
    } finally {
      setIsLoading(false)
      setIsSending(false)
    }
  }

  return {
    isLoading,
    isSending,
    sendMessage
  }
}
