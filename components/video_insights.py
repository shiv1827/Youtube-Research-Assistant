import streamlit as st
from typing import Dict, Any, List
import json
import re
from content_processor import process_video_chunks

def clean_text(text):
    """Clean text by removing HTML tags and extra whitespace."""
    if not text or isinstance(text, list):
        return text if isinstance(text, list) else ""
    text = re.sub(r'<[^>]+>|</[^>]+>', '', str(text))
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

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

def render_content_section(content_items: List[Dict[str, Any]], section_type: str):
    """Render a content section with timestamp links."""
    if not content_items:
        st.info(f"No {section_type} found in this video.")
        return

    for item in content_items:
        timestamp = int(item["timestamp"])
        col1, col2 = st.columns([1, 11])
        
        with col1:
            if st.button(f"{timestamp//60:02d}:{timestamp%60:02d}", 
                        key=f"{section_type}_{timestamp}"):
                st.session_state.timestamp = timestamp
                st.rerun()
        
        with col2:
            content = clean_text(item["content"])
            if item.get("chunk", {}).get("title"):
                st.markdown(f"**{clean_text(item['chunk']['title'])}**")
            st.write(content)
        st.divider()

def render_video_section(video_id: str, metadata: Dict[str, Any], chunks: List[Dict[str, Any]]):
    """Render the video section with metadata and insights."""
    # Initialize session state
    if 'current_video_id' not in st.session_state:
        st.session_state.current_video_id = None
    if 'video_content_cache' not in st.session_state:
        st.session_state.video_content_cache = {}
    
    # Update current video and reset timestamp if needed
    if st.session_state.current_video_id != video_id:
        st.session_state.current_video_id = video_id
        if 'timestamp' in st.session_state:
            st.session_state.timestamp = 0
    
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
    
    # Get or process content with caching
    if video_id not in st.session_state.video_content_cache:
        with st.spinner("Analyzing video content..."):
            st.session_state.video_content_cache[video_id] = process_video_chunks(chunks)
    
    processed_content = st.session_state.video_content_cache[video_id]
    
    # Content tabs
    tab_summary, tab_insights, tab_stories, tab_thoughts = st.tabs([
        "Summary", "Key Insights", "Stories", "Thoughts"
    ])
    
    with tab_summary:
        for chunk in chunks:
            timestamp = int(chunk["start_time"])
            col1, col2 = st.columns([1, 11])
            
            with col1:
                if st.button(f"{timestamp//60:02d}:{timestamp%60:02d}", 
                           key=f"sum_{timestamp}"):
                    st.session_state.timestamp = timestamp
                    st.rerun()
            
            with col2:
                st.write(clean_text(chunk["summary"]))
            st.divider()
    
    with tab_insights:
        render_content_section(
            processed_content["insights"], 
            "insights"
        )
    
    with tab_stories:
        render_content_section(
            processed_content["stories"], 
            "stories"
        )
    
    with tab_thoughts:
        render_content_section(
            processed_content["thoughts"], 
            "thoughts"
        )
