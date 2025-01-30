from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from youtube_research_assistant import youtube_assistant, YouTubeAssistantDeps
from openai import AsyncOpenAI
from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Initialize dependencies
deps = YouTubeAssistantDeps(
    supabase=supabase,
    openai_client=openai_client
)

class ChatRequest(BaseModel):
    message: str
    video_id: str

class AnalyzeRequest(BaseModel):
    url: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        async with youtube_assistant.run_stream(request.message, deps=deps) as result:
            response_text = ""
            last_chunk = ""
            async for chunk in result.stream_text(delta=True):
                # Skip if this chunk is the same as the last one
                if chunk != last_chunk:
                    response_text += chunk
                    last_chunk = chunk
            return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_video(request: AnalyzeRequest):
    try:
        from youtube_transcript_processor import process_video
        video_id = await process_video(request.url)
        return {"videoId": video_id, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/video/{video_id}")
async def get_video_metadata(video_id: str):
    try:
        result = supabase.table("video_metadata").select("*").eq("video_id", video_id).single().execute()
        if result.data:
            return result.data
        raise HTTPException(status_code=404, detail="Video not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/video/{video_id}/chunks")
async def get_video_chunks(video_id: str):
    """Get all chunks for a video."""
    try:
        chunks = supabase.table("video_chunks") \
            .select("*") \
            .eq("video_id", video_id) \
            .order("chunk_number") \
            .execute()
        
        if not chunks.data:
            raise HTTPException(status_code=404, detail="No chunks found for this video")
            
        return chunks.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos")
async def get_videos():
    """Get all available videos with topic graphs."""
    try:
        # First get all videos that have topic graphs
        result = supabase.table("topic_graphs").select("*").execute()
        if not result.data:
            return {"videos": []}
        
        # Then get their metadata for titles
        video_ids = [item["video_id"] for item in result.data]
        metadata_result = supabase.table("video_metadata").select("*").in_("video_id", video_ids).execute()
        
        # Create a mapping of video_id to metadata
        metadata_map = {
            item["video_id"]: item["metadata"].get("title", item["video_id"]) 
            for item in metadata_result.data
        } if metadata_result.data else {}
        
        # Format videos with id and title
        formatted_videos = [
            {
                "id": item["video_id"],
                "title": metadata_map.get(item["video_id"], item["video_id"])
            }
            for item in result.data
        ]
        return {"videos": formatted_videos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/topic-graph/{video_id}")
async def get_topic_graph(video_id: str):
    """Get topic graph data for a specific video."""
    try:
        result = supabase.table("topic_graphs").select("*").eq("video_id", video_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Topic graph not found")
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 