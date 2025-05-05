import {
  ActionButtonsRow,
  ChatPreviewList,
  Content,
  DraggableTopBar,
  FineTuneButton,
  FineTuningView,
  FloatingChatTitle,
  Interface,
  RootLayout,
  SettingsButton,
  SettingsView,
  Sidebar
} from '@/components'
import { useRef, useState } from 'react'

// Define possible app views
type AppView = 'chat' | 'settings' | 'fine-tuning'

const App = () => {
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState<AppView>('chat')

  const resetScroll = () => {
    contentContainerRef.current?.scrollTo(0, 0)
  }

  const EnhancedActionButtonsRow = ({ className }) => {
    return (
      <div className={className}>
        <ActionButtonsRow className="flex-1" />

        <div className="flex space-x-1 ml-2">
          <SettingsButton currentView={currentView} setCurrentView={setCurrentView} />
          <FineTuneButton currentView={currentView} setCurrentView={setCurrentView} />
        </div>
      </div>
    )
  }

  return (
    <>
      <DraggableTopBar />
      <RootLayout>
        <Sidebar className="p-2">
          <EnhancedActionButtonsRow className="action-row flex items-center py-1 px-3" />
          <div>
            {/* Chat content would go here */}
            <div className="p-6 text-center text-white/70">
              Select a chat or start a new conversation
            </div>
            <ChatPreviewList className="mt-3 space-y-1" onSelect={resetScroll} />
          </div>
        </Sidebar>

        <Content ref={contentContainerRef} className="border-l bg-zinc-900/50 border-l-white/20">
          <FloatingChatTitle className="pt-2" />
          {currentView === 'chat' && <Interface />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'fine-tuning' && <FineTuningView />}
        </Content>
      </RootLayout>
    </>
  )
}

export default App
