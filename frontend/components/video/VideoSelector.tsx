'use client'

import { useState, useEffect } from 'react'

interface Video {
  id: string
  title: string
}

interface VideoSelectorProps {
  onVideoSelect: (videoId: string) => void
  selectedVideoId: string | null
}

export function VideoSelector({ onVideoSelect, selectedVideoId }: VideoSelectorProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchVideos() {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching videos from backend...')
        const response = await fetch('/api/videos')
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error response from videos API:', errorData)
          throw new Error(errorData.error || 'Failed to fetch videos')
        }
        
        const data = await response.json()
        console.log('Received videos from backend:', data)
        
        if (!data.videos || !Array.isArray(data.videos)) {
          console.error('Invalid response format:', data)
          throw new Error('Invalid response format')
        }
        
        // Log each video ID and title for debugging
        data.videos.forEach((video: Video) => {
          console.log(`Video ID: ${video.id}, Title: ${video.title}`)
        })
        
        setVideos(data.videos)
      } catch (err) {
        console.error('Error in VideoSelector:', err)
        setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (isLoading) {
    return (
      <div className="animate-pulse">
        Loading videos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading videos: {error.message}
      </div>
    )
  }

  return (
    <div className="w-full">
      <label htmlFor="video-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select a Video
      </label>
      <select
        id="video-select"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
        value={selectedVideoId || ''}
        onChange={(e) => {
          console.log('Selected video ID:', e.target.value)
          onVideoSelect(e.target.value)
        }}
      >
        <option value="">Choose a video...</option>
        {videos.map((video) => (
          <option key={video.id} value={video.id}>
            {video.title || video.id}
          </option>
        ))}
      </select>
      <div className="mt-2 text-sm text-gray-500">
        {videos.length === 0 && !isLoading && !error && 'No videos available'}
        {videos.length > 0 && `${videos.length} videos available`}
      </div>
    </div>
  )
} 