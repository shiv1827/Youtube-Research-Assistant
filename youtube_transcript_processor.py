import os
import asyncio
import json
import requests
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from openai import AsyncOpenAI
from supabase import create_client, Client

load_dotenv()

# Initialize OpenAI and Supabase clients
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# YouTube API key for metadata
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

@dataclass
class ProcessedVideoChunk:
    video_id: str
    chunk_number: int
    title: str
    summary: str
    content: str
    start_time: float
    end_time: float
    metadata: Dict[str, Any]
    embedding: List[float]

def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL."""
    if "youtu.be" in url:
        return url.split("/")[-1]
    elif "youtube.com" in url:
        if "v=" in url:
            return url.split("v=")[1].split("&")[0]
    return url  # Assume it's already a video ID if no match

def get_video_metadata(video_id: str) -> Dict[str, Any]:
    """Get video metadata using YouTube Data API."""
    if not YOUTUBE_API_KEY:
        print("Warning: YOUTUBE_API_KEY not set, skipping metadata fetch")
        return {
            "title": "Unknown",
            "channel": "Unknown",
            "description": "",
            "views": 0,
            "publish_date": None,
            "length": 0,
            "rating": None
        }
    
    url = f"https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,statistics,contentDetails",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if not data.get("items"):
            raise ValueError(f"No video found with ID: {video_id}")
        
        video_data = data["items"][0]
        snippet = video_data["snippet"]
        statistics = video_data["statistics"]
        content_details = video_data["contentDetails"]
        
        # Parse duration from ISO 8601 format
        duration_str = content_details["duration"].replace("PT", "")
        duration_seconds = 0
        if "H" in duration_str:
            hours = int(duration_str.split("H")[0])
            duration_str = duration_str.split("H")[1]
            duration_seconds += hours * 3600
        if "M" in duration_str:
            minutes = int(duration_str.split("M")[0])
            duration_str = duration_str.split("M")[1]
            duration_seconds += minutes * 60
        if "S" in duration_str:
            seconds = int(duration_str.split("S")[0])
            duration_seconds += seconds
        
        return {
            "title": snippet["title"],
            "channel": snippet["channelTitle"],
            "description": snippet["description"],
            "views": int(statistics.get("viewCount", 0)),
            "publish_date": snippet["publishedAt"],
            "length": duration_seconds,
            "rating": float(statistics.get("likeCount", 0)) if "likeCount" in statistics else None
        }
    except Exception as e:
        print(f"Error fetching metadata for video {video_id}: {str(e)}")
        return {
            "title": "Unknown",
            "channel": "Unknown",
            "description": "",
            "views": 0,
            "publish_date": None,
            "length": 0,
            "rating": None
        }

def chunk_transcript(transcript: List[Dict[str, Any]], chunk_duration: int = 300) -> List[Dict[str, Any]]:
    """Split transcript into chunks of approximately chunk_duration seconds."""
    chunks = []
    current_chunk = {
        "text": "",
        "start": transcript[0]["start"],
        "end": 0
    }
    
    for entry in transcript:
        if (entry["start"] - current_chunk["start"]) > chunk_duration:
            current_chunk["end"] = entry["start"]
            chunks.append(current_chunk)
            current_chunk = {
                "text": entry["text"] + " ",
                "start": entry["start"],
                "end": 0
            }
        else:
            current_chunk["text"] += entry["text"] + " "
    
    # Add the last chunk
    if current_chunk["text"]:
        current_chunk["end"] = transcript[-1]["start"] + transcript[-1]["duration"]
        chunks.append(current_chunk)
    
    return chunks

async def get_title_and_summary(chunk: str, video_id: str) -> tuple[str, str]:
    """Extract title and summary using GPT-4."""
    prompt = f"""Given this transcript chunk from a YouTube video, provide a concise title and summary.
    Format: Title: <title>
    Summary: <summary>
    
    Transcript:
    {chunk}
    """
    
    response = await openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    
    content = response.choices[0].message.content
    title = content.split("Title:")[1].split("Summary:")[0].strip()
    summary = content.split("Summary:")[1].strip()
    
    return title, summary

async def get_embedding(text: str) -> List[float]:
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

async def process_chunk(chunk: Dict[str, Any], chunk_number: int, video_id: str) -> ProcessedVideoChunk:
    """Process a single chunk of transcript."""
    title, summary = await get_title_and_summary(chunk["text"], video_id)
    embedding = await get_embedding(chunk["text"])
    
    return ProcessedVideoChunk(
        video_id=video_id,
        chunk_number=chunk_number,
        title=title,
        summary=summary,
        content=chunk["text"],
        start_time=chunk["start"],
        end_time=chunk["end"],
        metadata={
            "processed_at": datetime.utcnow().isoformat(),
            "model": "gpt-4"
        },
        embedding=embedding
    )

async def insert_chunk(chunk: ProcessedVideoChunk):
    """Insert or update a processed chunk in Supabase."""
    data = {
        "video_id": chunk.video_id,
        "chunk_number": chunk.chunk_number,
        "title": chunk.title,
        "summary": chunk.summary,
        "content": chunk.content,
        "start_time": chunk.start_time,
        "end_time": chunk.end_time,
        "metadata": chunk.metadata,
        "embedding": chunk.embedding
    }
    
    # Use upsert to update existing chunks or insert new ones
    response = supabase.table("video_chunks").upsert(
        data,
        on_conflict="video_id,chunk_number"  # These fields define a unique chunk
    ).execute()
    return response

async def process_video(video_url: str):
    """Process a YouTube video and store its transcript chunks."""
    video_id = extract_video_id(video_url)
    
    try:
        # Check if video is already processed
        existing_metadata = supabase.table("video_metadata") \
            .select("*") \
            .eq("video_id", video_id) \
            .execute()
        
        # Get video metadata using YouTube Data API
        metadata = get_video_metadata(video_id)
        
        # Store metadata in Supabase
        supabase.table("video_metadata").upsert({
            "video_id": video_id,
            "metadata": metadata,
            "url": video_url,
            "processed_at": datetime.utcnow().isoformat()
        }).execute()
        
        # If video chunks exist and we're just updating metadata, skip transcript processing
        if existing_metadata.data:
            print(f"Video {video_id} already processed, updated metadata only")
            return
        
        # Get transcript and process chunks
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        chunks = chunk_transcript(transcript)
        
        for i, chunk in enumerate(chunks):
            try:
                processed_chunk = await process_chunk(chunk, i, video_id)
                await insert_chunk(processed_chunk)
                print(f"Processed and stored chunk {i} for video {video_id}")
            except Exception as e:
                print(f"Error processing chunk {i} for video {video_id}: {str(e)}")
        return video_id

    except Exception as e:
        print(f"Error processing video {video_id}: {str(e)}")

async def process_videos(video_urls: List[str]):
    """Process multiple videos in parallel."""
    tasks = [process_video(url) for url in video_urls]
    await asyncio.gather(*tasks)

async def main():
    # Example usage
    video_urls = [
        "https://www.youtube.com/watch?v=NQtWHOUmqNw",
        "https://www.youtube.com/watch?v=JWfNLF_g_V0"  # Add YouTube video URLs here
    ]
    await process_videos(video_urls)

if __name__ == "__main__":
    asyncio.run(main())
