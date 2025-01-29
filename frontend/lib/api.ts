import { Message } from '@/types/chat'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function sendMessage(message: string, videoId: string): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      video_id: videoId,
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response
}

export async function* streamResponse(response: Response) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No response body')
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    yield chunk
  }
}

export async function getVideoMetadata(videoId: string) {
  const response = await fetch(`${API_BASE_URL}/video/${videoId}`)
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

export async function analyzeVideo(url: string) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }

  const { videoId, status } = await response.json()
  return { videoId, status }
} 