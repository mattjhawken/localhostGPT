import { useEffect, useState } from 'react'
import { Message } from '../types/chat'

export const useMessages = (selectedChat: any, saveChat: any) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const getDefaultWelcomeMessage = (): Message => ({
    role: 'system',
    content:
      '## Welcome to localhostGPT\n\nAn AI experience powered by local data and peer-to-peer computing with opt-in privacy enhancing features. Select an existing chat or create a new one to start chatting!',
    timestamp: Date.now()
  })

  useEffect(() => {
    if (selectedChat) {
      try {
        // Try to parse as JSON first (new format)
        const parsedMessages = JSON.parse(selectedChat.content) as Message[]
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages)
          setIsInitialized(true)
          return
        }
      } catch (e) {
        // JSON parsing failed, try to handle legacy formats
      }

      // Handle legacy markdown format or plain text
      if (selectedChat.content && selectedChat.content.trim()) {
        // Check if it's the old markdown format
        if (
          selectedChat.content.includes('**user**:') ||
          selectedChat.content.includes('**assistant**:')
        ) {
          // Parse markdown format back to messages
          const messageBlocks = selectedChat.content.split('\n\n').filter((block) => block.trim())
          const parsedMessages: Message[] = []

          for (const block of messageBlocks) {
            const match = block.match(/\*\*(user|assistant|system)\*\*:\s*([\s\S]*)/)
            if (match) {
              parsedMessages.push({
                role: match[1] as 'user' | 'assistant' | 'system',
                content: match[2].trim(),
                timestamp: Date.now()
              })
            }
          }

          if (parsedMessages.length > 0) {
            setMessages(parsedMessages)
            // Convert to new JSON format
            const content = JSON.stringify(parsedMessages)
            saveChat(content)
          } else {
            setMessages([getDefaultWelcomeMessage()])
          }
        } else {
          // Plain text content
          setMessages([
            {
              role: 'system',
              content: 'Previous note converted to chat:\n\n' + selectedChat.content,
              timestamp: Date.now()
            }
          ])
        }
      } else {
        setMessages([getDefaultWelcomeMessage()])
      }
      setIsInitialized(true)
    } else {
      setMessages([getDefaultWelcomeMessage()])
      setIsInitialized(true)
    }
  }, [selectedChat])

  const saveMessages = async (newMessages: Message[]) => {
    if (!selectedChat || !isInitialized) return

    try {
      const content = JSON.stringify(newMessages, null, 2)
      await saveChat(content)
    } catch (error) {
      console.error('Failed to save messages:', error)
    }
  }

  const addMessage = (message: Message) => {
    setMessages((currentMessages) => {
      const newMessages = [...currentMessages, message]
      // Use setTimeout to avoid blocking the UI update
      setTimeout(() => saveMessages(newMessages), 0)
      return newMessages
    })

    // Return the new messages array for useChat compatibility
    return [...messages, message]
  }

  const updateMessage = (index: number, updates: Partial<Message>) => {
    setMessages((currentMessages) => {
      const updatedMessages = [...currentMessages]
      updatedMessages[index] = { ...updatedMessages[index], ...updates }
      setTimeout(() => saveMessages(updatedMessages), 0)
      return updatedMessages
    })

    const updatedMessages = [...messages]
    updatedMessages[index] = { ...updatedMessages[index], ...updates }
    return updatedMessages
  }

  const addMessages = (newMessages: Message[]) => {
    setMessages((currentMessages) => {
      const allMessages = [...currentMessages, ...newMessages]
      setTimeout(() => saveMessages(allMessages), 0)
      return allMessages
    })

    return [...messages, ...newMessages]
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
