import { CreateChat, DeleteChat, GetChats, ReadChat, WriteChat } from '@shared/types'

declare global {
  interface Window {
    // electron: ElectronAPI
    context: {
      locale: string
      getChats: GetChats
      readChat: ReadChat
      writeChat: WriteChat
      createChat: CreateChat
      deleteChat: DeleteChat
    }
  }
}
