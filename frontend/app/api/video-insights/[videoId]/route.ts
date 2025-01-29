import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    // Fetch video metadata and chunks from backend
    const [metadataRes, chunksRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/video/${params.videoId}`),
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/video/${params.videoId}/chunks`)
    ])

    if (!metadataRes.ok || !chunksRes.ok) {
      throw new Error('Failed to fetch video data')
    }

    const metadata = await metadataRes.json()
    const chunks = await chunksRes.json()

    // Transform chunks into insights format
    const insights = chunks.map((chunk: any) => {
      const results = []

      // Summary insights from chunk summaries
      if (chunk.summary) {
        results.push({
          timestamp: chunk.start_time,
          text: chunk.summary,
          type: 'summary'
        })
      }

      // Key insights from metadata
      if (chunk.metadata?.insights) {
        chunk.metadata.insights.forEach((insight: string) => {
          results.push({
            timestamp: chunk.start_time,
            text: insight,
            type: 'key_insight'
          })
        })
      }

      // Stories from metadata
      if (chunk.metadata?.stories) {
        chunk.metadata.stories.forEach((story: string) => {
          results.push({
            timestamp: chunk.start_time,
            text: story,
            type: 'story'
          })
        })
      }

      // Thoughts from metadata
      if (chunk.metadata?.thoughts) {
        chunk.metadata.thoughts.forEach((thought: string) => {
          results.push({
            timestamp: chunk.start_time,
            text: thought,
            type: 'thought'
          })
        })
      }

      return results
    })
    .flat()
    .filter(Boolean)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching video insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video insights' },
      { status: 500 }
    )
  }
} 