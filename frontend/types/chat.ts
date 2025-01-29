export type MessageType = 'user' | 'assistant' | 'system'

export interface Source {
  timestamp: number
  text: string
}

export interface Message {
  type: MessageType
  content: string
  timestamp: Date
  metadata?: {
    sources?: Source[]
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  lastUpdated: Date
  videoId?: string
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export interface VideoMetadata {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  channel: string
  views: number
  publishDate: string
}

export interface AnalysisResult {
  videoId: string
  title: string
  topics: string[]
  status: 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
  metadata?: VideoMetadata
} 