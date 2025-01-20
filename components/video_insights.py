import streamlit as st
from typing import Dict, Any, List
import json
import re

def clean_text(text: str) -> str:
    """Clean text by removing HTML tags and extra whitespace."""
    # Remove HTML tags and common artifacts
    text = re.sub(r'<[^>]+>|</[^>]+>', '', text)
    # Fix common HTML entities
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&')
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

def create_youtube_embed(video_id: str, timestamp: int = 0):
    """Create YouTube embed HTML with JavaScript for timestamp control."""
    return f'''
    <div style="position: relative; width: 100%; padding-bottom: 56.25%;">
        <iframe
            src="https://www.youtube.com/embed/{video_id}?enablejsapi=1&start={timestamp}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    </div>
    '''

def render_video_section(video_id: str, metadata: Dict[str, Any], chunks: List[Dict[str, Any]]):
    """Render the video section with metadata and insights."""
    # Title and metadata
    st.title(metadata.get("title", "Unknown Title"))
    st.write(f"By {metadata.get('channel', 'Unknown Channel')} • {metadata.get('publish_date', '')}")
    
    # Stats row
    col1, col2 = st.columns(2)
    with col1:
        st.write(f"👁️ {metadata.get('views', 0):,} views")
    with col2:
        if metadata.get('rating'):
            st.write(f"👍 {metadata.get('rating', 0):,} likes")

    # Video player with timestamp support
    if 'timestamp' not in st.session_state:
        st.session_state.timestamp = 0
        
    st.components.v1.html(
        create_youtube_embed(video_id, st.session_state.timestamp),
        height=450
    )
    
    # Content tabs
    tab_summary, tab_stories, tab_insights = st.tabs(["Summary", "Stories", "Key Insights"])
    
    with tab_summary:
        for chunk in chunks:
            timestamp = int(chunk["start_time"])
            col1, col2 = st.columns([1, 11])
            
            with col1:
                if st.button(f"{timestamp//60:02d}:{timestamp%60:02d}", key=f"sum_{timestamp}"):
                    st.session_state.timestamp = timestamp
                    st.rerun()
            
            with col2:
                st.write(clean_text(chunk["summary"]))
            st.divider()
    
    with tab_stories:
        has_stories = False
        for chunk in chunks:
            if "story" in chunk["title"].lower() or "example" in chunk["title"].lower():
                has_stories = True
                timestamp = int(chunk["start_time"])
                col1, col2 = st.columns([1, 11])
                
                with col1:
                    if st.button(f"{timestamp//60:02d}:{timestamp%60:02d}", key=f"story_{timestamp}"):
                        st.session_state.timestamp = timestamp
                        st.rerun()
                
                with col2:
                    st.markdown(f"**{clean_text(chunk['title'])}**")
                    st.write(clean_text(chunk["summary"]))
                st.divider()
        
        if not has_stories:
            st.info("No stories found in this video.")
    
    with tab_insights:
        has_insights = False
        for chunk in chunks:
            if any(keyword in chunk["title"].lower() for keyword in ["key", "insight", "point", "lesson", "takeaway"]):
                has_insights = True
                timestamp = int(chunk["start_time"])
                col1, col2 = st.columns([1, 11])
                
                with col1:
                    if st.button(f"{timestamp//60:02d}:{timestamp%60:02d}", key=f"insight_{timestamp}"):
                        st.session_state.timestamp = timestamp
                        st.rerun()
                
                with col2:
                    st.markdown(f"**{clean_text(chunk['title'])}**")
                    st.write(clean_text(chunk["summary"]))
                st.divider()
        
        if not has_insights:
            st.info("No key insights found in this video.")
