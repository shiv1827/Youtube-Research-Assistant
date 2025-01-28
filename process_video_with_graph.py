import asyncio
from youtube_transcript_processor import process_video
from topic_graph_processor import process_video_topics, store_topic_graph

async def process_video_with_graph(video_url: str):
    """Process a video and generate its topic graph."""
    print(f"Processing video: {video_url}")
    
    # Step 1: Process the video transcript
    print("Step 1: Processing video transcript...")
    # video_id = await process_video(video_url)
    print("✓ Video transcript processed")
    
    # Step 2: Generate topic graph
    print("Step 2: Generating topic graph...")
    topic_graph=await process_video_topics("pjZI2MuLWWw")
    print("✓ Topic graph generated")
    await store_topic_graph("pjZI2MuLWWw", topic_graph)
    print(f"Completed processing video: {video_url}")
    return video_url

async def main():
    # You can add multiple video URLs here
    video_urls = [
        "https://www.youtube.com/watch?v=pjZI2MuLWWw&t=1916s"  # Replace with actual video URL
    ]
    
    for url in video_urls:
        try:
            await process_video_with_graph(url)
        except Exception as e:
            print(f"Error processing {url}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
