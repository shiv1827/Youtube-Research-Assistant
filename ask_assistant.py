import asyncio
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from supabase import create_client
from youtube_research_assistant import youtube_assistant, YouTubeAssistantDeps

# Load environment variables
load_dotenv()

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

async def ask_question(question: str):
    """Ask a question to the YouTube research assistant."""
    print(f"\nQuestion: {question}\n")
    print("Assistant: ", end="", flush=True)
    
    async with youtube_assistant.run_stream(question, deps=deps) as result:
        async for chunk in result.stream_text(delta=True):
            print(chunk, end="", flush=True)
    print("\n")

async def main():
    while True:
        question = input("\nEnter your question (or 'quit' to exit): ")
        if question.lower() == 'quit':
            break
        await ask_question(question)

if __name__ == "__main__":
    asyncio.run(main())
