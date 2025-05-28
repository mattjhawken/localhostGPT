import { useEffect, useState } from 'react'
import { Message } from '../types/chat'

export const useMessages = (selectedChat: any, saveChat: any) => {
  const [messages, setMessages] = useState<Message[]>([])

  const getDefaultWelcomeMessage = (): Message => ({
    role: 'system',
    content:
      '## Welcome to localhostGPT\n\nAn AI experience powered by local data and peer-to-peer computing with opt-in privacy enhancing features. Select an existing chat or create a new one to start chatting!',
    timestamp: Date.now()
  })

  useEffect(() => {
    if (selectedChat) {
      try {
        const parsedMessages = JSON.parse(selectedChat.content) as Message[]
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages)
        } else {
          // Convert single content to system message
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
          setMessages([getDefaultWelcomeMessage()])
        }
      }
    } else {
      setMessages([getDefaultWelcomeMessage()])
    }
  }, [selectedChat])

  const saveMessages = async (newMessages: Message[]) => {
    if (!selectedChat) return
    const content = JSON.stringify(newMessages)
    await saveChat(content)
  }

  const addMessage = (message: Message) => {
    const newMessages = [...messages, message]
    setMessages(newMessages)
    saveMessages(newMessages)
    return newMessages
  }

  const updateMessage = (index: number, updates: Partial<Message>) => {
    const updatedMessages = [...messages]
    updatedMessages[index] = { ...updatedMessages[index], ...updates }
    setMessages(updatedMessages)
    saveMessages(updatedMessages)
    return updatedMessages
  }

  const addMessages = (newMessages: Message[]) => {
    const allMessages = [...messages, ...newMessages]
    setMessages(allMessages)
    saveMessages(allMessages)
    return allMessages
  }

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    addMessages,
    saveMessages
  }
}
