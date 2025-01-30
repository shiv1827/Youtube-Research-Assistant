'use client'

import { useState, useRef } from 'react'
import { VideoPlayer } from '@/components/video-player'
import { VideoInsights } from '@/components/video-insights'
import ReactPlayer from 'react-player'

// YouTube URL patterns we want to support
const YOUTUBE_URL_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,  // Regular youtube.com URL
  /^https?:\/\/youtu\.be\/([^?]+)/,  // Shortened youtu.be URL
]

export function VideoInsightsClient() {
  const [currentTime, setCurrentTime] = useState(0)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugMessage, setDebugMessage] = useState<string | null>(null)
  const playerRef = useRef<ReactPlayer>(null)

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
  }

  const extractVideoId = (url: string): string | null => {
    for (const pattern of YOUTUBE_URL_PATTERNS) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setDebugMessage(null)

    try {
      // Extract video ID from URL
      const extractedVideoId = extractVideoId(url)
      
      if (!extractedVideoId) {
        throw new Error('Invalid YouTube URL. Please enter a valid YouTube video URL.')
      }

      // Show debug message with extracted ID
      setDebugMessage(`Processing video: ${extractedVideoId}`)

      // Call backend to analyze video
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to analyze video')
      }

      const data = await response.json()
      
      // Set video ID and URL after successful analysis
      setVideoId(extractedVideoId)
      setVideoUrl(url)
      setDebugMessage('Video analysis complete!')
      
    } catch (error) {
      console.error('Error processing video:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setVideoId(null)
      setVideoUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-950">
      {/* Video Input Section */}
      {!videoId && (
        <div className="flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">
              Video Insights
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter YouTube Video URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-indigo-500/30 
                         text-white placeholder:text-gray-400 focus:outline-none 
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 
                         text-white rounded-lg font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                disabled={isLoading || !url}
              >
                {isLoading ? 'Processing...' : 'Analyze Video'}
              </button>
            </form>
            {debugMessage && (
              <p className="text-sm text-green-400 text-center mt-4">
                {debugMessage}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-400 text-center mt-4">
                {error}
              </p>
            )}
            <p className="text-sm text-gray-400 text-center mt-4">
              Enter a YouTube video URL to analyze its content
            </p>
          </div>
        </div>
      )}

      {/* Video Player and Insights */}
      {videoId && videoUrl && (
        <div className="grid grid-cols-2 gap-4 p-4 h-full">
          <div className="flex flex-col space-y-4">
            <VideoPlayer
              url={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              ref={playerRef}
            />
          </div>
          <div className="flex flex-col space-y-4 overflow-hidden">
            <VideoInsights
              videoId={videoId}
              currentTime={currentTime}
              onTimeSelect={(time) => {
                if (playerRef.current) {
                  playerRef.current.seekTo(time, 'seconds')
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 