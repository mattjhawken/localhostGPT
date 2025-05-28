import React, { useEffect, useRef } from 'react'

interface MessageInputProps {
  inputMessage: string
  setInputMessage: (message: string) => void
  onSend: () => void
  disabled: boolean
  isSending: boolean
  selectedChat: any
}

export const MessageInput: React.FC<MessageInputProps> = ({
  inputMessage,
  setInputMessage,
  onSend,
  disabled,
  isSending,
  selectedChat
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedChat])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [inputMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-4 border-t border-white/20">
      <div className="flex items-end">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedChat ? 'Type your message here...' : 'Select a chat to start messaging...'
          }
          className="flex-1 bg-gray-800 text-white rounded-lg p-3 outline-none resize-none min-h-[40px] max-h-[150px] transition-all overflow-y-auto"
          disabled={disabled}
        />
        <button
          onClick={onSend}
          disabled={disabled || !inputMessage.trim()}
          className={`ml-2 text-white p-3 rounded-lg transition-all ${
            disabled || !inputMessage.trim()
              ? 'bg-blue-600/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isSending ? (
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
      {selectedChat && (
        <div className="text-xs text-white/50 mt-2 px-1">
          Press Enter to send message, Shift+Enter for new line
        </div>
      )}
    </div>
  )
}
