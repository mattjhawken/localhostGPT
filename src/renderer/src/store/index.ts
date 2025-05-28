import { ChatContent, ChatInfo } from '@shared/models'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

const loadChats = async () => {
  const chats = await window.context.getChats()

  // sort them by most recently edited
  return chats.sort((a, b) => b.lastEditTime - a.lastEditTime)
}

const chatsAtomAsync = atom<ChatInfo[] | Promise<ChatInfo[]>>(loadChats())

export const chatsAtom = unwrap(chatsAtomAsync, (prev) => prev)

export const selectedChatIndexAtom = atom<number | null>(null)

const selectedChatAtomAsync = atom(async (get) => {
  const chats = get(chatsAtom)
  const selectedChatIndex = get(selectedChatIndexAtom)

  if (selectedChatIndex == null || !chats) return null

  const selectedChat = chats[selectedChatIndex]

  const chatContent = await window.context.readChat(selectedChat.title)

  return {
    ...selectedChat,
    content: chatContent
  }
})

export const selectedChatAtom = unwrap(
  selectedChatAtomAsync,
  (prev) =>
    prev ?? {
      title: '',
      content: '',
      lastEditTime: Date.now()
    }
)

export const saveChatAtom = atom(null, async (get, set, newContent: ChatContent) => {
  const chats = get(chatsAtom)
  const selectedChat = get(selectedChatAtom)

  if (!selectedChat || !chats) return

  // save on disk
  await window.context.writeChat(selectedChat.title, newContent)

  // update the saved chat's last edit time
  set(
    chatsAtom,
    chats.map((chat) => {
      // this is the chat that we want to update
      if (chat.title === selectedChat.title) {
        return {
          ...chat,
          lastEditTime: Date.now()
        }
      }

      return chat
    })
  )
})

export const createEmptyChatAtom = atom(null, async (get, set) => {
  const chats = get(chatsAtom)

  if (!chats) return

  const title = await window.context.createChat()

  if (!title) return

  const newChat: ChatInfo = {
    title,
    lastEditTime: Date.now()
  }

  set(chatsAtom, [newChat, ...chats.filter((chat) => chat.title !== newChat.title)])

  set(selectedChatIndexAtom, 0)
})

export const deleteChatAtom = atom(null, async (get, set) => {
  const chats = get(chatsAtom)
  const selectedChat = get(selectedChatAtom)

  if (!selectedChat || !chats) return

  const isDeleted = await window.context.deleteChat(selectedChat.title)

  if (!isDeleted) return

  // filter out the deleted chat
  set(
    chatsAtom,
    chats.filter((chat) => chat.title !== selectedChat.title)
  )

  // de select any chat
  set(selectedChatIndexAtom, null)
})

export const resetChatAtom = atom(null, async (get, set) => {
  const selectedChat = get(selectedChatAtom)

  if (!selectedChat) return { success: false, message: 'No chat selected' }

  try {
    // Clear the chat content on disk by writing empty content
    await window.context.writeChat(selectedChat.title, '')

    // Update the selected chat atom to reflect the empty content
    set(selectedChatAtom, {
      ...selectedChat,
      content: '',
      lastEditTime: Date.now()
    })

    // Also update the chats list to reflect the new lastEditTime
    const chats = get(chatsAtom)
    if (chats) {
      set(
        chatsAtom,
        chats.map((chat) => {
          if (chat.title === selectedChat.title) {
            return {
              ...chat,
              lastEditTime: Date.now()
            }
          }
          return chat
        })
      )
    }

    return { success: true, message: 'Chat cleared successfully' }
  } catch (error) {
    console.error('Failed to reset chat:', error)
    return { success: false, message: 'Failed to clear chat' }
  }
})
