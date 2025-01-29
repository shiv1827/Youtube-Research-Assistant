'use client'

import { useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'

interface VideoPlayerProps {
  url: string
  onTimeUpdate?: (time: number) => void
}

export function VideoPlayer({ url, onTimeUpdate }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && onTimeUpdate) {
        onTimeUpdate(playerRef.current.getCurrentTime())
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [onTimeUpdate])

  return (
    <div className="relative w-full pt-[56.25%] bg-black/50 rounded-lg overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls
          playing
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0
              }
            }
          }}
        />
      </div>
    </div>
  )
} 