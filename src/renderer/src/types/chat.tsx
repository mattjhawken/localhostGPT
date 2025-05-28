export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  feedback?: 'positive' | 'negative' | null
}

export interface ChatSettings {
  modelName?: string
  temperature: number
  maxTokens: number
  isTensorlinkConnected: boolean
  isModelInitialized: boolean
}

export interface Model {
  id: string
  name: string
  requires_tensorlink: boolean
}

export interface FineTuningJob {
  model: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  created_at: number
}
