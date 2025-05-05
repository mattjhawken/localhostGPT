import { ActionButton, ActionButtonProps } from '@/components'
import { deleteChatAtom } from '@/store'
import { useSetAtom } from 'jotai'
import { FaRegTrashCan } from 'react-icons/fa6'

export const DeleteChatButton = ({ ...props }: ActionButtonProps) => {
  const deleteChat = useSetAtom(deleteChatAtom)

  const handleDelete = async () => {
    await deleteChat()
  }

  return (
    <ActionButton onClick={handleDelete} {...props} title="Delete Chat" className="bg-red-700">
      <FaRegTrashCan className="w-4 h-4 text-zinc-300" />
    </ActionButton>
  )
}
