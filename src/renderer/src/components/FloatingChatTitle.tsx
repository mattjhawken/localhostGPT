import { selectedChatAtom } from '@renderer/store'
import { useAtomValue } from 'jotai'
import { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export const FloatingChatTitle = ({ className, ...props }: ComponentProps<'div'>) => {
  const selectedChat = useAtomValue(selectedChatAtom)

  if (!selectedChat) return null

  return (
    <div className={twMerge('flex justify-center', className)} {...props}>
      <span className="text-gray-400">{selectedChat.title}</span>
    </div>
  )
}
