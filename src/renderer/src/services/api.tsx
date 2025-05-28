import { ChatSettings, FineTuningJob, Message, Model } from '@renderer/types/chat'
import { TensorlinkStats } from '@renderer/types/tensorlink'

const API_URL = 'http://127.0.0.1:5053/api'

export class ApiService {
  static async fetchModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${API_URL}/models`)
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching models:', error)
      return [
        {
          id: 'Qwen/Qwen2.5-7B-Instruct',
          name: 'Qwen2.5-7B',
          requires_tensorlink: true
        }
        // {
        //   id: 'Qwen/Qwen3-8B-Instruct',
        //   name: 'Qwen3-8B',
        //   requires_tensorlink: true
        // }
      ]
    }
  }

  static async getTensorlinkStats(): Promise<TensorlinkStats> {
    try {
      const response = await fetch(`${API_URL}/stats`)
      if (!response.ok) {
        throw new Error(`Failed to fetch Tensorlink stats: ${response.status}`)
      }
      const data = await response
      console.log(data)
      return data
    } catch (error) {
      console.error('Error fetching Tensorlink stats:', error)
      throw error
    }
  }

  static async checkConnectionStatus(): Promise<{ connected: boolean }> {
    try {
      const response = await fetch(`${API_URL}/status`)
      if (!response.ok) {
        throw new Error(`Failed to check Tensorlink status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error checking Tensorlink status:', error)
      throw error
    }
  }

  static async connectToTensorlink(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/connect`)
      if (!response.ok) {
        throw new Error(`Failed to connect to Tensorlink: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error connecting to Tensorlink:', error)
      throw error
    }
  }

  static async sendChatMessage(
    message: string,
    history: Array<{ role: string; content: string }>,
    settings: ChatSettings
  ): Promise<{ response: string }> {
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ message, history, settings })
      })

      // Log response details for debugging
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  static async initiateFinetuning(
    modelName: string,
    messages: Message[]
  ): Promise<{ message?: string; job_id?: string }> {
    try {
      const response = await fetch(`${API_URL}/finetune`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName,
          chatHistory: messages.filter((m) => m.role !== 'system'),
          feedbackData: messages
            .filter((m) => m.role === 'assistant' && m.feedback)
            .map((m, index) => ({ messageId: index, feedback: m.feedback }))
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initiate fine-tuning: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error initiating fine-tuning:', error)
      throw error
    }
  }

  static async getFineTuningStatus(
    jobId: string
  ): Promise<{ success: boolean; job?: FineTuningJob }> {
    try {
      const response = await fetch(`${API_URL}/finetune/${jobId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch fine-tuning status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error polling fine-tuning status:', error)
      throw error
    }
  }
}
