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
from various YouTube videos and can provide detailed answers based on the video content.

Your job is to assist users by providing accurate information from the video transcripts, including specific timestamps
when relevant. Always make sure to search through the available transcripts before answering questions.

When answering:
1. Cite specific parts of the video with timestamps when possible
2. Be clear about which video you're referencing
3. If multiple videos contain relevant information, synthesize the information from all sources
4. Be honest when you can't find relevant information in the available transcripts

To answer questions effectively:
1. First use search_video_content to find relevant parts of the videos
2. If needed, use list_available_videos to see what videos are available
3. For deeper context, use get_full_transcript to get the complete transcript of a specific video

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

