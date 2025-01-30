'use client'

import { useState } from 'react'
import { useTopicGraph } from '@/lib/topic-graph/use-topic-graph'
import { VideoSelector } from '@/components/video/VideoSelector'
import { TopicGraphVisualization } from '@/components/topic-graph/TopicGraphVisualization'

export default function TopicGraphClient() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const { data, isLoading, error } = useTopicGraph(selectedVideoId)

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Topic Graph Visualization</h1>
        <VideoSelector
          selectedVideoId={selectedVideoId}
          onVideoSelect={setSelectedVideoId}
        />
      </div>

      <div className="min-h-[600px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-gray-500 dark:text-gray-400">
                Loading topic graph...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg">
            <div className="flex flex-col items-center space-y-4 p-8 text-center">
              <div className="text-red-500 dark:text-red-400 text-lg font-semibold">
                Error Loading Topic Graph
              </div>
              <div className="text-red-400 dark:text-red-300">
                {error.message}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <TopicGraphVisualization data={data} />
        )}
      </div>
    </div>
  )
} 