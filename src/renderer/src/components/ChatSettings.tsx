import { TensorlinkStats } from '@renderer/types/tensorlink'
import React, { useState } from 'react'
import { ChatSettings as IChatSettings, Model } from '../types/chat'

interface ChatSettingsProps {
  chatSettings: IChatSettings
  setChatSettings: (settings: IChatSettings) => void
  availableModels: Model[]
  showSettings: boolean
  tensorlinkStats: TensorlinkStats | null
  getTensorlinkStats: () => Promise<void>
  setShowSettings: (show: boolean) => void
  isConnectingTensorlink: boolean
  connectToTensorlink: () => Promise<{ success: boolean; message: string }>
  onConnectionResult?: (result: { success: boolean; message: string }) => void
}

export const ChatSettingsComponent: React.FC<ChatSettingsProps> = ({
  chatSettings,
  setChatSettings,
  availableModels,
  showSettings,
  tensorlinkStats,
  getTensorlinkStats,
  setShowSettings,
  isConnectingTensorlink,
  connectToTensorlink,
  onConnectionResult
}) => {
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const handleTensorlinkConnect = async () => {
    const result = await connectToTensorlink()
    onConnectionResult?.(result)
  }

  const handleTestStats = async () => {
    try {
      setIsLoadingStats(true)
      await getTensorlinkStats()
      setShowStats(true)
      console.log('Stats fetched:', tensorlinkStats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="flex space-x-2 items-center">
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-1"
        >
          <span>
            {availableModels.find((m) => m.id === chatSettings.modelName)?.name || 'Select Model'}
          </span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showSettings && (
          <div className="absolute z-10 mt-1 w-64 bg-gray-800 rounded-md shadow-lg p-2 border border-white/20">
            <div className="mb-2">
              <label className="text-xs text-white/70 block mb-1">Model</label>
              <select
                value={chatSettings.modelName}
                onChange={(e) => setChatSettings({ ...chatSettings, modelName: e.target.value })}
                className="w-full bg-gray-700 text-white text-sm rounded-md px-2 py-1"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="text-xs text-white/70 block mb-1">
                Temperature: {chatSettings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={chatSettings.temperature}
                onChange={(e) =>
                  setChatSettings({ ...chatSettings, temperature: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>More Precise</span>
                <span>More Creative</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-xs text-white/70 block mb-1">
                Max Tokens: {chatSettings.maxTokens}
              </label>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={chatSettings.maxTokens}
                onChange={(e) =>
                  setChatSettings({ ...chatSettings, maxTokens: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleTensorlinkConnect}
        disabled={isConnectingTensorlink}
        className={`px-3 py-2 rounded-md text-sm ${
          isConnectingTensorlink
            ? 'bg-gray-600 text-white/70 cursor-not-allowed'
            : chatSettings.isTensorlinkConnected
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
      >
        {isConnectingTensorlink
          ? 'Connecting...'
          : chatSettings.isTensorlinkConnected
            ? 'Tensorlink ✓'
            : 'Connect Tensorlink'}
      </button>

      {/* Test Stats Button */}
      <button
        onClick={handleTestStats}
        disabled={isLoadingStats || !chatSettings.isTensorlinkConnected}
        className={`px-3 py-2 rounded-md text-sm ${
          isLoadingStats
            ? 'bg-gray-600 text-white/70 cursor-not-allowed'
            : !chatSettings.isTensorlinkConnected
              ? 'bg-gray-600 text-white/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={
          !chatSettings.isTensorlinkConnected ? 'Connect to Tensorlink first' : 'Test network stats'
        }
      >
        {isLoadingStats ? 'Loading...' : 'Test Stats'}
      </button>

      {/* Stats Display Modal/Popup */}
      {showStats && tensorlinkStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Tensorlink Network Stats</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-white/60 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Validators:</span>
                <span className="text-white font-mono">{tensorlinkStats.validators}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Workers:</span>
                <span className="text-white font-mono">{tensorlinkStats.workers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Users:</span>
                <span className="text-white font-mono">{tensorlinkStats.users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Proposals:</span>
                <span className="text-white font-mono">{tensorlinkStats.proposal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Available Capacity:</span>
                <span className="text-white font-mono">
                  {formatBytes(tensorlinkStats.available_capacity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Used Capacity:</span>
                <span className="text-white font-mono">
                  {formatBytes(tensorlinkStats.used_capacity)}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-white/70">Available Models:</span>
                <div className="mt-2 space-y-1">
                  {tensorlinkStats.models.map((model, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 px-2 py-1 rounded text-xs font-mono text-white"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStats(false)}
              className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
