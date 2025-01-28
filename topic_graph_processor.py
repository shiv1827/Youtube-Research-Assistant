import os
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import numpy as np
from openai import AsyncOpenAI
from supabase import Client, create_client
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

# Initialize clients
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
deepseek_client = AsyncOpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

@dataclass
class TopicNode:
    id: str
    label: str
    category: str
    importance: float
    timestamps: List[float]
    summary: str
    key_insights: List[str]
    chunk_ids: List[int]

@dataclass
class TopicEdge:
    source: str
    target: str
    weight: float
    relationship_type: str

@dataclass
class TopicGraph:
    nodes: List[TopicNode]
    edges: List[TopicEdge]

async def extract_topics_from_chunk(chunk_text: str, chunk_id: int) -> List[Dict[str, Any]]:
    """Extract topics and their details from a transcript chunk using Deepseek."""
    prompt = """Analyze this transcript chunk and identify key topics/concepts.
    For each topic provide:
    1. A concise label (2-4 words)
    2. Category (Technical, Ethical, Business, Personal Story, or Other)
    3. Importance score (0-1)
    4. Brief summary
    5. Key insights/takeaways (2-3 points)

    Format the response as JSON like this example:
    {
        "topics": [
            {
                "label": "AI Ethics",
                "category": "Technical",
                "importance": 0.8,
                "summary": "Discussion of ethical considerations in AI development",
                "key_insights": [
                    "Transparency is crucial",
                    "Bias must be addressed"
                ]
            }
        ]
    }

    Transcript chunk:
    """ + chunk_text + """

    Respond ONLY with the JSON, no other text.
    """

    try:
        response = await deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that responds only in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3  # Lower temperature for more consistent JSON output
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up the response to ensure it's valid JSON
        content = content.replace("```json", "").replace("```", "").strip()
        
        # Print raw content for debugging
        print("Raw response content:", content)
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            # Attempt to fix common JSON issues
            if not content.startswith("{"):
                content = content[content.find("{"):]
            if not content.endswith("}"):
                content = content[:content.rfind("}") + 1]
            return json.loads(content)
    except Exception as e:
        print(f"Error in topic extraction: {e}")
        return {"topics": []}

async def analyze_topic_relationships(topics: List[TopicNode]) -> List[Dict[str, Any]]:
    """Analyze relationships between topics using Deepseek."""
    topics_context = "\n".join([
        f"Topic: {t.label}\nSummary: {t.summary}\n"
        for t in topics
    ])
    
    prompt = """Analyze the relationships between these topics.
    For each meaningful relationship, describe:
    1. The type of relationship (e.g., "leads_to", "supports", "contrasts_with", "example_of")
    2. The strength of the relationship (0-1)
    3. A brief explanation

    Format the response ONLY as JSON like this:
    {
        "relationships": [
            {
                "source": "AI Ethics",
                "target": "Data Privacy",
                "type": "supports",
                "strength": 0.8,
                "explanation": "Strong ethical guidelines support better data privacy practices"
            }
        ]
    }

    Topics to analyze:
    """ + topics_context + """

    Respond ONLY with the JSON, no other text.
    """

    try:
        response = await deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that responds only in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3  # Lower temperature for more consistent JSON output
        )
        
        content = response.choices[0].message.content.strip()
        # Clean up the response to ensure it's valid JSON
        content = content.replace("```json", "").replace("```", "").strip()
        
        # Print raw content for debugging
        print("Raw response content:", content)
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            # Attempt to fix common JSON issues
            if not content.startswith("{"):
                content = content[content.find("{"):]
            if not content.endswith("}"):
                content = content[:content.rfind("}") + 1]
            return json.loads(content)
    except Exception as e:
        print(f"Error in relationship analysis: {e}")
        return {"relationships": []}

async def compute_semantic_similarity(topics: List[TopicNode]) -> List[Tuple[str, str, float]]:
    """Compute semantic similarity between topics using embeddings."""
    # Get embeddings for topic summaries
    embeddings = []
    for topic in topics:
        response = await openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=topic.summary
        )
        embeddings.append(response.data[0].embedding)
    
    # Compute similarity matrix
    similarity_matrix = cosine_similarity(embeddings)
    
    # Convert to list of relationships
    relationships = []
    for i in range(len(topics)):
        for j in range(i + 1, len(topics)):
            if similarity_matrix[i][j] > 0.5:  # Only keep strong relationships
                relationships.append((
                    topics[i].id,
                    topics[j].id,
                    float(similarity_matrix[i][j])
                ))
    
    return relationships

async def process_video_topics(video_id: str) -> TopicGraph:
    """Process a video's transcript chunks to create a topic graph."""
    # Get all chunks for the video
    chunks_response = supabase.table("video_chunks") \
        .select("*") \
        .eq("video_id", video_id) \
        .order("chunk_number") \
        .execute()
    
    if not chunks_response.data:
        raise ValueError(f"No chunks found for video {video_id}")
    
    # Extract topics from each chunk
    all_topics = {}  # Dict to merge similar topics
    for chunk in chunks_response.data:
        topics = await extract_topics_from_chunk(chunk["content"], chunk["id"])
        for topic in topics["topics"]:
            topic_id = topic["label"].lower().replace(" ", "_")
            if topic_id in all_topics:
                # Update existing topic
                existing = all_topics[topic_id]
                existing.importance = max(existing.importance, topic["importance"])
                existing.timestamps.append(chunk["start_time"])
                existing.chunk_ids.append(chunk["id"])
                # Merge insights
                existing.key_insights.extend(topic["key_insights"])
            else:
                # Create new topic
                all_topics[topic_id] = TopicNode(
                    id=topic_id,
                    label=topic["label"],
                    category=topic["category"],
                    importance=topic["importance"],
                    timestamps=[chunk["start_time"]],
                    summary=topic["summary"],
                    key_insights=topic["key_insights"],
                    chunk_ids=[chunk["id"]]
                )
    
    topics_list = list(all_topics.values())
    
    # Get relationships from LLM analysis
    llm_relationships = await analyze_topic_relationships(topics_list)
    
    # Get relationships from semantic similarity
    semantic_relationships = await compute_semantic_similarity(topics_list)
    
    # Combine relationships
    edges = []
    seen_pairs = set()
    
    # Add LLM-identified relationships
    for rel in llm_relationships["relationships"]:
        source_id = rel["source"].lower().replace(" ", "_")
        target_id = rel["target"].lower().replace(" ", "_")
        if (source_id, target_id) not in seen_pairs:
            edges.append(TopicEdge(
                source=source_id,
                target=target_id,
                weight=rel["strength"],
                relationship_type=rel["type"]
            ))
            seen_pairs.add((source_id, target_id))
    
    # Add semantic relationships
    for source_id, target_id, weight in semantic_relationships:
        if (source_id, target_id) not in seen_pairs:
            edges.append(TopicEdge(
                source=source_id,
                target=target_id,
                weight=weight,
                relationship_type="semantic_similarity"
            ))
            seen_pairs.add((source_id, target_id))
    
    return TopicGraph(nodes=topics_list, edges=edges)

async def store_topic_graph(video_id: str, graph: TopicGraph):
    """Store the topic graph in Supabase."""
    data = {
        "video_id": video_id,
        "nodes": [vars(node) for node in graph.nodes],
        "edges": [vars(edge) for edge in graph.edges],
        "metadata": {
            "node_count": len(graph.nodes),
            "edge_count": len(graph.edges),
            "processed_at": datetime.utcnow().isoformat()
        }
    }
    
    response = supabase.table("topic_graphs").upsert(
        data,
        on_conflict="video_id"
    ).execute()
    
    return response
