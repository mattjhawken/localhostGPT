import { ChatPreview } from '@/components'
import { useChatsList } from '@/hooks/useChatsList'
import { isEmpty } from 'lodash'
import { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export type ChatPreviewListProps = ComponentProps<'ul'> & {
  onSelect?: () => void
}

export const ChatPreviewList = ({ onSelect, className, ...props }: ChatPreviewListProps) => {
  const { chats, selectedChatIndex, handleChatSelect } = useChatsList({ onSelect })

  if (!chats) return null

  if (isEmpty(chats)) {
    return (
      <ul className={twMerge('text-center pt-4', className)} {...props}>
        <span>No Chats Yet!</span>
      </ul>
    )
  }

  return (
    <ul className={className} {...props}>
      {chats.map((chat, index) => (
        <ChatPreview
          key={chat.title + chat.lastEditTime}
          isActive={selectedChatIndex === index}
          onClick={handleChatSelect(index)}
          {...chat}
        />
      ))}
    </ul>
  )
}
