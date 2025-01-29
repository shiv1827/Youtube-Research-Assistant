'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VideoInsight {
  timestamp: number
  text: string
  type: 'summary' | 'key_insight' | 'story' | 'thought'
}

interface VideoInsightsProps {
  videoId: string
  currentTime: number
  onTimeSelect: (time: number) => void
}

export function VideoInsights({ videoId, currentTime, onTimeSelect }: VideoInsightsProps) {
  const [insights, setInsights] = useState<VideoInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/video-insights/${videoId}`)
        if (!response.ok) {
          throw new Error('Failed to load video insights')
        }
        const data = await response.json()
        if (!data.insights) {
          throw new Error('Invalid response format')
        }
        setInsights(data.insights)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video insights')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (videoId) {
      fetchInsights()
    }
  }, [videoId])

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isNearCurrentTime = (timestamp: number) => {
    return Math.abs(timestamp - currentTime) < 5 // Within 5 seconds
  }

  const renderInsightWithTimestamp = (insight: VideoInsight, index: number) => (
    <div
      key={index}
      className={`p-4 rounded-lg transition-colors ${
        isNearCurrentTime(insight.timestamp)
          ? 'bg-indigo-900/50 border border-indigo-700/50'
          : 'bg-black/30 border border-indigo-900/30'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTimeSelect(insight.timestamp)}
          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/50"
        >
          {formatTimestamp(insight.timestamp)}
        </Button>
        <span className="text-xs text-indigo-400 opacity-60">
          {insight.type === 'key_insight' ? '💡 Insight' : 
           insight.type === 'story' ? '📖 Story' :
           insight.type === 'thought' ? '💭 Thought' : '📝 Summary'}
        </span>
      </div>
      <div className="prose prose-invert max-w-none">
        <p className="text-indigo-200 leading-relaxed">{insight.text.replace(/^\[(.*)\]$/, '$1')}</p>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-lg border border-indigo-900/30">
      <Tabs defaultValue="summary" className="flex flex-col flex-1">
        <div className="border-b border-indigo-900/30 px-4">
          <TabsList className="bg-transparent border-b-0">
            <TabsTrigger value="summary" className="data-[state=active]:bg-indigo-900/30">
              Summary
            </TabsTrigger>
            <TabsTrigger value="key_insights" className="data-[state=active]:bg-indigo-900/30">
              Key Insights
            </TabsTrigger>
            <TabsTrigger value="stories" className="data-[state=active]:bg-indigo-900/30">
              Stories
            </TabsTrigger>
            <TabsTrigger value="thoughts" className="data-[state=active]:bg-indigo-900/30">
              Thoughts
            </TabsTrigger>
          </TabsList>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-400">{error}</div>
          </div>
        ) : (
          <>
            <TabsContent value="summary" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {insights
                    .filter(insight => insight.type === 'summary')
                    .map((insight, index) => renderInsightWithTimestamp(insight, index))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="key_insights" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {insights
                    .filter(insight => insight.type === 'key_insight')
                    .map((insight, index) => renderInsightWithTimestamp(insight, index))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stories" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {insights
                    .filter(insight => insight.type === 'story')
                    .map((insight, index) => renderInsightWithTimestamp(insight, index))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="thoughts" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {insights
                    .filter(insight => insight.type === 'thought')
                    .map((insight, index) => renderInsightWithTimestamp(insight, index))}
                </div>
              </ScrollArea>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
} 