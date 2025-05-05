import { ActionButton, ActionButtonProps } from '@/components'
import { createEmptyChatAtom } from '@renderer/store'
import { useSetAtom } from 'jotai'
import { LuFileSignature } from 'react-icons/lu'

export const NewChatButton = ({ ...props }: ActionButtonProps) => {
  const createEmptyChat = useSetAtom(createEmptyChatAtom)

  const handleCreation = async () => {
    await createEmptyChat()
  }

  return (
    <ActionButton onClick={handleCreation} {...props} title="New Chat" className="bg-green-600">
      <LuFileSignature className="w-4 h-4 text-zinc-300" />
    </ActionButton>
  )
}
