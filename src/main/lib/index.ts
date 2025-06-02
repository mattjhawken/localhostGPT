import { appDirectoryName, fileEncoding, welcomeChatFilename } from '@shared/constants'
import { ChatInfo } from '@shared/models'
import { CreateChat, DeleteChat, GetChats, ReadChat, WriteChat } from '@shared/types'
import { dialog } from 'electron'
import { ensureDir, readFile, readdir, remove, stat, writeFile } from 'fs-extra'
import { isEmpty } from 'lodash'
import { homedir } from 'os'
import path from 'path'
import welcomeChatData from '../../../resources/welcomeChat.json' // ⬅️ Fixed import

export const getRootDir = () => {
  return `${homedir()}/${appDirectoryName}`
}

export const getChats: GetChats = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const chatsFileNames = await readdir(rootDir, {
    encoding: fileEncoding,
    withFileTypes: false
  })

  const chats = chatsFileNames.filter((fileName) => fileName.endsWith('.json'))

  if (isEmpty(chats)) {
    console.info('No chats found, creating a welcome chat')

    const content = JSON.stringify(welcomeChatData) // ⬅️ Replaced file read with stringify

    await writeFile(`${rootDir}/${welcomeChatFilename}`, content, { encoding: fileEncoding })

    chats.push(welcomeChatFilename)
  }

  return Promise.all(chats.map(getChatInfoFromFilename))
}

export const getChatInfoFromFilename = async (filename: string): Promise<ChatInfo> => {
  const fileStats = await stat(`${getRootDir()}/${filename}`)

  return {
    title: filename.replace(/\.json$/, ''),
    lastEditTime: fileStats.mtimeMs
  }
}

export const readChat: ReadChat = async (filename) => {
  const rootDir = getRootDir()
  return readFile(`${rootDir}/${filename}.json`, { encoding: fileEncoding })
}

export const writeChat: WriteChat = async (filename, content) => {
  const rootDir = getRootDir()
  console.info(`Writing chat ${filename}`)
  return writeFile(`${rootDir}/${filename}.json`, content, { encoding: fileEncoding })
}

export const createChat: CreateChat = async () => {
  const rootDir = getRootDir()
  await ensureDir(rootDir)

  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'New chat',
    defaultPath: `${rootDir}/Untitled.json`,
    buttonLabel: 'Create',
    properties: ['showOverwriteConfirmation'],
    showsTagField: false,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (canceled || !filePath) {
    console.info('Chat creation canceled')
    return false
  }

  const { name: filename, dir: parentDir } = path.parse(filePath)

  if (parentDir !== rootDir) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Creation failed',
      message: `All chats must be saved under ${rootDir}.
      Avoid using other directories!`
    })
    return false
  }

  console.info(`Creating chat: ${filePath}`)
  await writeFile(filePath, '[]', { encoding: fileEncoding })

  return filename
}

export const deleteChat: DeleteChat = async (filename) => {
  const rootDir = getRootDir()

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Delete chat',
    message: `Are you sure you want to delete ${filename}?`,
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    cancelId: 1
  })

  if (response === 1) {
    console.info('Chat deletion canceled')
    return false
  }

  console.info(`Deleting chat: ${filename}`)
  await remove(`${rootDir}/${filename}.json`)
  return true
}
