import { MDXEditorMethods } from '@mdxeditor/editor'
import { saveChatAtom, selectedChatAtom } from '@renderer/store'
import { autoSavingTime } from '@shared/constants'
import { ChatContent } from '@shared/models'
import { useAtomValue, useSetAtom } from 'jotai'
import { throttle } from 'lodash'
import { useRef } from 'react'

export const useMarkdownEditor = () => {
  const selectedChat = useAtomValue(selectedChatAtom)
  const saveChat = useSetAtom(saveChatAtom)
  const editorRef = useRef<MDXEditorMethods>(null)

  const handleAutoSaving = throttle(
    async (content: ChatContent) => {
      if (!selectedChat) return

      console.info('Auto saving:', selectedChat.title)

      await saveChat(content)
    },
    autoSavingTime,
    {
      leading: false,
      trailing: true
    }
  )

  const handleBlur = async () => {
    if (!selectedChat) return

    handleAutoSaving.cancel()

    const content = editorRef.current?.getMarkdown()

    if (content != null) {
      await saveChat(content)
    }
  }

  return {
    editorRef,
    selectedChat,
    handleAutoSaving,
    handleBlur
  }
}
