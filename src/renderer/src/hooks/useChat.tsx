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
    onMessageAdd: (message: Message) => Message[],
    onMessagesAdd: (messages: Message[]) => Message[]
  ) => {
    if (!messageContent.trim() || isSending) return

    setIsSending(true)

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: Date.now()
    }

    const newMessages = onMessageAdd(userMessage)
    setIsLoading(true)

    try {
      const response = await ApiService.sendChatMessage(
        userMessage.content,
        messages.map((m) => ({ role: m.role, content: m.content })),
        settings
      )

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: Date.now()
      }

      onMessageAdd(assistantMessage)
      return { success: true }
    } catch (error) {
      const errorMessage: Message = {
        role: 'system',
        content: 'Error: Could not process your message. Please try again later.',
        timestamp: Date.now()
      }
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
