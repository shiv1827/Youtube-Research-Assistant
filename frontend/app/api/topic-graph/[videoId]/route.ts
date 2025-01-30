import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) {
    console.error('Backend URL not configured')
    return NextResponse.json(
      { error: 'Backend URL not configured' },
      { status: 500 }
    )
  }

  try {
    const url = `${backendUrl}/topic-graph/${params.videoId}`
    console.log('Fetching from:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Disable caching for debugging
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend response error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch topic graph: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching topic graph:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch topic graph' },
      { status: 500 }
    )
  }
} 