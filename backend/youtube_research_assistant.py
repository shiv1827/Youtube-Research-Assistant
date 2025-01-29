from __future__ import annotations

from dataclasses import dataclass
from dotenv import load_dotenv
import logfire
import asyncio
import os

from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.models.openai import OpenAIModel
from openai import AsyncOpenAI
from supabase import Client, create_client
from typing import List, Optional

load_dotenv()

llm = os.getenv('LLM_MODEL', 'gpt-4')
model = OpenAIModel(llm)

logfire.configure(send_to_logfire='if-token-present')

@dataclass
class YouTubeAssistantDeps:
    supabase: Client
    openai_client: AsyncOpenAI

system_prompt = """
You are an expert research assistant that helps users understand YouTube video content. You have access to transcripts
and metadata from various YouTube videos and can provide detailed answers based on the video content.

Your job is to assist users by providing accurate information from the video transcripts and metadata, including specific 
timestamps when relevant. Always make sure to search through the available content before answering questions.

When answering:
1. Cite specific parts of the video with timestamps when possible
2. Be clear about which video you're referencing
3. If multiple videos contain relevant information, synthesize the information from all sources
4. Include relevant metadata (views, channel, publish date) when it adds context
5. Be honest when you can't find relevant information in the available transcripts

Available tools:
1. search_video_content: Find relevant parts of videos based on your query
2. list_available_videos: See what videos are available in the knowledge base
3. get_full_transcript: Get the complete transcript of a specific video
4. get_video_info: Get detailed metadata about a video (title, channel, views, etc.)
5. summarize_video: Generate a comprehensive summary of a video's content
6. compare_videos: Compare multiple videos to analyze similarities and differences

For complex queries:
1. First check available videos using list_available_videos
2. Use search_video_content to find relevant segments
3. Get more context with get_video_info and get_full_transcript if needed
4. Use summarize_video for high-level understanding
5. Use compare_videos when analyzing multiple related videos

Remember to maintain the context of video content and provide timestamps so users can verify the information directly
in the videos.
"""

youtube_assistant = Agent(
    model,
    system_prompt=system_prompt,
    deps_type=YouTubeAssistantDeps,
    retries=2
)


@youtube_assistant.tool()
async def search_video_content(
    ctx: RunContext[YouTubeAssistantDeps],
    query: str,
    limit: Optional[int] = 5
) -> str:
    """
    Search through video transcripts to find relevant content based on the query.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        query: The search query
        limit: Maximum number of chunks to retrieve (default: 5)
        
    Returns:
        A formatted string containing the most relevant video transcript chunks with timestamps
    """
    # Get query embedding
    query_embedding = await get_embedding(query, ctx.deps.openai_client)
    
    # Search for similar chunks in Supabase
    response = ctx.deps.supabase.rpc(
        'match_video_chunks',
        {
            'query_embedding': query_embedding,
            'match_count': limit
        }
    ).execute()
    
    if not response.data:
        return "No relevant video content found for your query."
    
    # Format the results
    formatted_results = []
    for chunk in response.data:
        timestamp = f"{int(chunk['start_time'] // 60)}:{int(chunk['start_time'] % 60):02d}"
        formatted_chunk = f"""
Video ID: {chunk['video_id']}
Timestamp: {timestamp}
Title: {chunk['title']}
Content: {chunk['content']}
"""
        formatted_results.append(formatted_chunk)
    
    return "\n---\n".join(formatted_results)

@youtube_assistant.tool()
async def list_available_videos(ctx: RunContext[YouTubeAssistantDeps]) -> str:
    """
    Retrieve a list of all available video IDs in the knowledge base.
    
    Returns:
        A formatted string listing all available video IDs
    """
    response = ctx.deps.supabase.table("video_chunks") \
        .select("video_id, title") \
        .execute()
    
    if not response.data:
        return "No videos found in the knowledge base."
    
    # Get unique video IDs and their titles
    video_info = {}
    for chunk in response.data:
        if chunk["video_id"] not in video_info:
            video_info[chunk["video_id"]] = chunk["title"]
    
    # Format the results
    formatted_results = []
    for video_id, title in video_info.items():
        formatted_results.append(f"Video ID: {video_id}\nTitle: {title}")
    
    return "\n---\n".join(formatted_results)

@youtube_assistant.tool()
async def get_full_transcript(
    ctx: RunContext[YouTubeAssistantDeps],
    video_id: str
) -> str:
    """
    Retrieve the complete transcript of a specific video.
    
    Args:
        ctx: The context including the Supabase client
        video_id: The ID of the video to retrieve
        
    Returns:
        The complete video transcript with timestamps
    """
    response = ctx.deps.supabase.table("video_chunks") \
        .select("*") \
        .eq("video_id", video_id) \
        .order("chunk_number") \
        .execute()
    
    if not response.data:
        return f"No transcript found for video ID: {video_id}"
    
    chunks = []
    for chunk in response.data:
        timestamp = f"{int(chunk['start_time'] // 60)}:{int(chunk['start_time'] % 60):02d}"
        formatted_chunk = f"""
Timestamp: {timestamp}
{chunk['content']}
"""
        chunks.append(formatted_chunk)
    
    return "\n".join(chunks)

@youtube_assistant.tool()
async def get_video_info(
    ctx: RunContext[YouTubeAssistantDeps],
    video_id: str
) -> str:
    """
    Get detailed information about a specific video.
    
    Args:
        ctx: The context including the Supabase client
        video_id: The ID of the video to get information for
        
    Returns:
        A formatted string containing the video's metadata
    """
    response = ctx.deps.supabase.table("video_metadata") \
        .select("*") \
        .eq("video_id", video_id) \
        .single() \
        .execute()
    
    if not response.data:
        return f"No metadata found for video ID: {video_id}"
    
    metadata = response.data["metadata"]
    formatted_info = f"""
Video Title: {metadata['title']}
Channel: {metadata['channel']}
Views: {metadata['views']:,}
Duration: {metadata['length'] // 60}:{metadata['length'] % 60:02d}
Published: {metadata['publish_date']}

Description:
{metadata['description']}
"""
    return formatted_info

@youtube_assistant.tool()
async def summarize_video(
    ctx: RunContext[YouTubeAssistantDeps],
    video_id: str
) -> str:
    """
    Generate a comprehensive summary of the video using its transcript.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        video_id: The ID of the video to summarize
        
    Returns:
        A detailed summary of the video's content
    """
    # Get video metadata
    metadata_response = ctx.deps.supabase.table("video_metadata") \
        .select("*") \
        .eq("video_id", video_id) \
        .single() \
        .execute()
    
    if not metadata_response.data:
        return f"No metadata found for video ID: {video_id}"
    
    # Get full transcript
    transcript_response = ctx.deps.supabase.table("video_chunks") \
        .select("*") \
        .eq("video_id", video_id) \
        .order("chunk_number") \
        .execute()
    
    if not transcript_response.data:
        return f"No transcript found for video ID: {video_id}"
    
    # Combine all chunks
    full_transcript = " ".join(chunk["content"] for chunk in transcript_response.data)
    metadata = metadata_response.data["metadata"]
    
    # Create a prompt for GPT-4 to summarize
    prompt = f"""Please provide a comprehensive summary of this video content.

Video Title: {metadata['title']}
Channel: {metadata['channel']}
Duration: {metadata['length'] // 60}:{metadata['length'] % 60:02d}

Transcript:
{full_transcript}

Please structure the summary with:
1. Main topics/themes
2. Key points discussed
3. Important conclusions or takeaways
4. Notable quotes or statements (with timestamps if available)
"""
    
    response = await ctx.deps.openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    return response.choices[0].message.content

@youtube_assistant.tool()
async def compare_videos(
    ctx: RunContext[YouTubeAssistantDeps],
    video_ids: List[str]
) -> str:
    """
    Compare multiple videos and analyze their similarities and differences.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        video_ids: List of video IDs to compare
        
    Returns:
        A comparison analysis of the videos
    """
    if len(video_ids) < 2:
        return "Please provide at least 2 video IDs to compare."
    
    videos_data = []
    for video_id in video_ids:
        # Get metadata
        metadata = ctx.deps.supabase.table("video_metadata") \
            .select("*") \
            .eq("video_id", video_id) \
            .single() \
            .execute()
        
        if not metadata.data:
            return f"No metadata found for video ID: {video_id}"
        
        # Get transcript summary
        chunks = ctx.deps.supabase.table("video_chunks") \
            .select("content") \
            .eq("video_id", video_id) \
            .execute()
        
        if not chunks.data:
            return f"No transcript found for video ID: {video_id}"
        
        full_transcript = " ".join(chunk["content"] for chunk in chunks.data)
        
        videos_data.append({
            "metadata": metadata.data["metadata"],
            "transcript": full_transcript
        })
    
    # Create a prompt for comparison
    comparison_prompt = "Please compare and analyze these videos:\n\n"
    for i, data in enumerate(videos_data, 1):
        comparison_prompt += f"""
Video {i}:
Title: {data['metadata']['title']}
Channel: {data['metadata']['channel']}
Transcript: {data['transcript'][:2000]}...

"""
    
    comparison_prompt += """
Please provide a detailed comparison including:
1. Common themes and topics
2. Key differences in perspective or approach
3. Unique insights from each video
4. Which video might be more helpful for different purposes
5. How the videos complement each other
"""
    
    response = await ctx.deps.openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": comparison_prompt}],
        temperature=0.7
    )
    
    return response.choices[0].message.content

async def get_embedding(text: str, openai_client: AsyncOpenAI) -> List[float]:
    """Get embedding vector from OpenAI."""
    try:
        response = await openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        raise
