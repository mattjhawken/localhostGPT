import { CreateChat, DeleteChat, GetChats, ReadChat, WriteChat } from '@shared/types'
import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

try {
  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,
    getChats: (...args: Parameters<GetChats>) => ipcRenderer.invoke('getChats', ...args),
    readChat: (...args: Parameters<ReadChat>) => ipcRenderer.invoke('readChat', ...args),
    writeChat: (...args: Parameters<WriteChat>) => ipcRenderer.invoke('writeChat', ...args),
    createChat: (...args: Parameters<CreateChat>) => ipcRenderer.invoke('createChat', ...args),
    deleteChat: (...args: Parameters<DeleteChat>) => ipcRenderer.invoke('deleteChat', ...args)
  })
} catch (error) {
  console.error(error)
}
