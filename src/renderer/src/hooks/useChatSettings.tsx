import { useEffect, useState } from 'react'
import { ApiService } from '../services/api'
import { ChatSettings, Model } from '../types/chat'
import { TensorlinkStats } from '../types/tensorlink'

export const useChatSettings = () => {
  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    modelName: 'default-model',
    temperature: 0.7,
    maxTokens: 1024,
    isTensorlinkConnected: false,
    isModelInitialized: false
  })
  const [isConnectingTensorlink, setIsConnectingTensorlink] = useState(false)
  const [tensorlinkStats, setTensorlinkStats] = useState<TensorlinkStats>({
    validators: 0,
    workers: 0,
    users: 0,
    proposal: 0,
    available_capacity: 0,
    used_capacity: 0,
    models: ['']
  })

  useEffect(() => {
    const initializeSettings = async () => {
      // Fetch models and check Tensorlink status
      const [models] = await Promise.allSettled([ApiService.fetchModels(), checkConnectionStatus()])

      if (models.status === 'fulfilled') {
        setAvailableModels(models.value)
      }
    }

    initializeSettings()
  }, [])

  useEffect(() => {
    // Auto-select first model if current one doesn't exist
    if (availableModels.length > 0) {
      const modelExists = availableModels.some((model) => model.id === chatSettings.modelName)
      if (!modelExists) {
        setChatSettings((prev) => ({ ...prev, modelName: availableModels[0].id }))
      }
    }
  }, [availableModels, chatSettings.modelName])

  const checkConnectionStatus = async () => {
    try {
      const status = await ApiService.checkConnectionStatus()
      setChatSettings((prev) => ({ ...prev, isTensorlinkConnected: status.connected }))
    } catch (error) {
      console.error('Failed to check Tensorlink status')
    }
  }

  const getTensorlinkStats = async () => {
    try {
      const stats = await ApiService.getTensorlinkStats()
      setTensorlinkStats(stats)
    } catch (error) {
      console.error('Failed to fetch Tensorlink stats:', error)
      // Optionally reset to default state on error
      setTensorlinkStats({
        validators: 0,
        workers: 0,
        users: 0,
        proposal: 0,
        available_capacity: 0,
        used_capacity: 0,
        models: []
      })
    }
  }

  const connectToTensorlink = async () => {
    try {
      setIsConnectingTensorlink(true)
      await ApiService.connectToTensorlink()
      setChatSettings((prev) => ({ ...prev, isTensorlinkConnected: true }))

      // Refresh models after connection
      const models = await ApiService.fetchModels()
      setAvailableModels(models)

      return { success: true, message: 'Connected to Tensorlink successfully' }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Tensorlink' }
    } finally {
      setIsConnectingTensorlink(false)
    }
  }

  return {
    availableModels,
    chatSettings,
    setChatSettings,
    isConnectingTensorlink,
    setIsConnectingTensorlink,
    tensorlinkStats,
    checkConnectionStatus,
    connectToTensorlink,
    getTensorlinkStats
  }
}
