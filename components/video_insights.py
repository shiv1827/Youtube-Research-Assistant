import streamlit as st
from typing import Dict, Any, List
import json

def render_video_section(video_id: str, metadata: Dict[str, Any], chunks: List[Dict[str, Any]]):
    """Render the video section with metadata and insights."""
    # Video metadata section
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.title(metadata.get("title", "Unknown Title"))
        st.write(f"By {metadata.get('channel', 'Unknown Channel')} • {metadata.get('publish_date', '')}")
    
    with col2:
        st.write(f"👁️ {metadata.get('views', 0):,} views")
        if metadata.get('rating'):
            st.write(f"👍 {metadata.get('rating', 0):,} likes")
    
    # Navigation tabs
    tab_summary, tab_stories, tab_insights = st.tabs(["Summary", "Stories", "Key Insights"])
    
    with tab_summary:
        st.markdown("""
        <style>
        .timestamp-link {
            text-decoration: none;
            color: #1E88E5;
            background-color: #E3F2FD;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-right: 8px;
        }
        </style>
        """, unsafe_allow_html=True)
        
        for chunk in chunks:
            timestamp = chunk["start_time"]
            minutes = int(timestamp // 60)
            seconds = int(timestamp % 60)
            timestamp_str = f"{minutes:02d}:{seconds:02d}"
            
            st.markdown(f"""
            <div style='margin-bottom: 20px;'>
                <a href='https://youtube.com/watch?v={video_id}&t={int(timestamp)}' 
                   class='timestamp-link' target='_blank'>
                    {timestamp_str}
                </a>
                {chunk["summary"]}
            </div>
            """, unsafe_allow_html=True)
    
    with tab_stories:
        stories = []
        for chunk in chunks:
            # Extract stories from chunk content using title and summary
            if "story" in chunk["title"].lower() or "example" in chunk["title"].lower():
                stories.append({
                    "timestamp": chunk["start_time"],
                    "title": chunk["title"],
                    "content": chunk["summary"]
                })
        
        if stories:
            for story in stories:
                timestamp = story["timestamp"]
                minutes = int(timestamp // 60)
                seconds = int(timestamp % 60)
                timestamp_str = f"{minutes:02d}:{seconds:02d}"
                
                st.markdown(f"""
                <div style='margin-bottom: 20px;'>
                    <a href='https://youtube.com/watch?v={video_id}&t={int(timestamp)}' 
                       class='timestamp-link' target='_blank'>
                        {timestamp_str}
                    </a>
                    <strong>{story["title"]}</strong><br/>
                    {story["content"]}
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("No stories found in this video.")
    
    with tab_insights:
        insights = []
        for chunk in chunks:
            # Look for key points or insights in the content
            if any(keyword in chunk["title"].lower() for keyword in ["key", "insight", "point", "lesson", "takeaway"]):
                insights.append({
                    "timestamp": chunk["start_time"],
                    "title": chunk["title"],
                    "content": chunk["summary"]
                })
        
        if insights:
            for insight in insights:
                timestamp = insight["timestamp"]
                minutes = int(timestamp // 60)
                seconds = int(timestamp % 60)
                timestamp_str = f"{minutes:02d}:{seconds:02d}"
                
                st.markdown(f"""
                <div style='margin-bottom: 20px;'>
                    <a href='https://youtube.com/watch?v={video_id}&t={int(timestamp)}' 
                       class='timestamp-link' target='_blank'>
                        {timestamp_str}
                    </a>
                    <strong>{insight["title"]}</strong><br/>
                    {insight["content"]}
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("No key insights found in this video.")
