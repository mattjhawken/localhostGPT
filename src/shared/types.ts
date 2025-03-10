import { ChatContent, ChatInfo } from './models'

export type GetChats = () => Promise<ChatInfo[]>
export type ReadChat = (title: ChatInfo['title']) => Promise<ChatContent>
export type WriteChat = (title: ChatInfo['title'], content: ChatContent) => Promise<void>
export type CreateChat = () => Promise<ChatInfo['title'] | false>
export type DeleteChat = (title: ChatInfo['title']) => Promise<boolean>
