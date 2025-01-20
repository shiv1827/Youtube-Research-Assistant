from typing import Dict, List, Any
from openai import OpenAI
import os
from dotenv import load_dotenv
import json

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_llm_response(response_text: str) -> Dict[str, str]:
    """Safely parse the LLM response into a structured format."""
    try:
        # First try direct JSON parsing
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            # If that fails, try to extract JSON-like content
            content = response_text.strip()
            if content.startswith("```json"):
                content = content.split("```json")[1]
            if content.endswith("```"):
                content = content.rsplit("```", 1)[0]
            return json.loads(content.strip())
        except (json.JSONDecodeError, IndexError):
            # If all parsing fails, create a structured response from the text
            return {
                "insights": response_text if "insight" in response_text.lower() else None,
                "thoughts": response_text if "thought" in response_text.lower() else None,
                "stories": response_text if "story" in response_text.lower() or "example" in response_text.lower() else None
            }

def extract_content_categories(chunk_text: str) -> Dict[str, str]:
    """Extract different types of content from a chunk using GPT."""
    prompt = """Analyze the following content and extract these specific elements if present.
    Return your response in this exact JSON format:
    {
        "insights": "key takeaways or actionable advice (or null if none)",
        "thoughts": "opinions or reflective commentary (or null if none)",
        "stories": "anecdotes, examples, or narratives (or null if none)"
    }

    Content to analyze:
    """ + chunk_text

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a content analyzer. Always respond with valid JSON containing insights, thoughts, and stories keys."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={ "type": "json_object" }  # Ensure JSON response
        )
        
        # Parse the response and ensure it's well-formatted
        content = parse_llm_response(response.choices[0].message.content)
        return {
            "insights": content.get("insights"),
            "thoughts": content.get("thoughts"),
            "stories": content.get("stories")
        }
    except Exception as e:
        print(f"Error in content extraction: {e}")
        # Return a safe fallback using the original chunk text
        return {
            "insights": chunk_text if len(chunk_text) < 500 else chunk_text[:500] + "...",
            "thoughts": None,
            "stories": None
        }

def process_video_chunks(chunks: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Process all chunks and organize content by category."""
    processed_content = {
        "insights": [],
        "thoughts": [],
        "stories": []
    }
    
    for chunk in chunks:
        # Extract categories from the chunk's content
        categories = extract_content_categories(chunk.get("summary", ""))
        
        # Add timestamp and chunk info to each category
        timestamp = chunk.get("start_time", 0)
        
        if categories["insights"]:
            processed_content["insights"].append({
                "content": categories["insights"],
                "timestamp": timestamp,
                "chunk": chunk
            })
            
        if categories["thoughts"]:
            processed_content["thoughts"].append({
                "content": categories["thoughts"],
                "timestamp": timestamp,
                "chunk": chunk
            })
            
        if categories["stories"]:
            processed_content["stories"].append({
                "content": categories["stories"],
                "timestamp": timestamp,
                "chunk": chunk
            })
    
    return processed_content
