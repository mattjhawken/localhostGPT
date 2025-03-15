import { createChat, deleteChat, getChats, readChat, writeChat } from '@/lib'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { CreateChat, DeleteChat, GetChats, ReadChat, WriteChat } from '@shared/types'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

const { spawn } = require('child_process')
const path = require('path')

let mainWindow: BrowserWindow
let fastApiProcess

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    center: true,
    title: 'ChatMark',
    frame: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  fastApiProcess = spawn('python', [path.join(__dirname, '../../backend/app.py')])

  fastApiProcess.stdout?.on('data', (data) => {
    console.log(`FastAPI: ${data}`)
  })

  fastApiProcess.stderr?.on('data', (data) => {
    console.error(`FastAPI Error: ${data}`)
  })

  app.on('before-quit', () => {
    if (fastApiProcess) {
      fastApiProcess.kill() // Ensure FastAPI stops when Electron closes
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.openDevTools()

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('getChats', (_, ...args: Parameters<GetChats>) => getChats(...args))
  ipcMain.handle('readChat', (_, ...args: Parameters<ReadChat>) => readChat(...args))
  ipcMain.handle('writeChat', (_, ...args: Parameters<WriteChat>) => writeChat(...args))
  ipcMain.handle('createChat', (_, ...args: Parameters<CreateChat>) => createChat(...args))
  ipcMain.handle('deleteChat', (_, ...args: Parameters<DeleteChat>) => deleteChat(...args))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
