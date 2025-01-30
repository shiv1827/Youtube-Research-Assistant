'use client'

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { TopicGraphData, TopicNode } from '@/lib/topic-graph/types'
import dynamic from 'next/dynamic'

const ForceGraphComponent = dynamic(
  () => import('./ForceGraphComponent').then(mod => mod.ForceGraphComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-500 dark:text-gray-400">
            Loading graph visualization...
          </div>
        </div>
      </div>
    )
  }
)

interface TopicGraphVisualizationProps {
  data: TopicGraphData | null
}

export function TopicGraphVisualization({ data }: TopicGraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<TopicNode | null>(null)

  useEffect(() => {
    console.log('TopicGraphVisualization received data:', data)
  }, [data])

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      setDimensions({ width, height })
    }

    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  const handleNodeClick = useCallback((node: any) => {
    console.log('Node clicked:', node)
  }, [])

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node)
  }, [])

  if (!data?.graph?.nodes?.length || !data?.graph?.edges?.length) {
    console.log('Missing or invalid graph data:', data)
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Select a video to view its topic graph</p>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <ForceGraphComponent
          nodes={data.graph.nodes}
          edges={data.graph.edges}
          width={dimensions.width}
          height={dimensions.height}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
        />
      </div>

      {hoveredNode && (
        <div className="absolute top-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-semibold text-lg mb-2">{hoveredNode.label}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{hoveredNode.summary}</p>
          {hoveredNode.key_insights && hoveredNode.key_insights.length > 0 && (
            <>
              <h4 className="font-medium text-sm mb-1">Key Insights:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                {hoveredNode.key_insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
} 