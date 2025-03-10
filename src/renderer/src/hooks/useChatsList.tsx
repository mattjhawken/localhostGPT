import { chatsAtom, selectedChatIndexAtom } from '@/store'
import { useAtom, useAtomValue } from 'jotai'

export const useChatsList = ({ onSelect }: { onSelect?: () => void }) => {
  const chats = useAtomValue(chatsAtom)

  const [selectedChatIndex, setSelectedChatIndex] = useAtom(selectedChatIndexAtom)

  const handleChatSelect = (index: number) => async () => {
    setSelectedChatIndex(index)

    if (onSelect) {
      onSelect()
    }
  }

  return {
    chats,
    selectedChatIndex,
    handleChatSelect
  }
}
