import os
import streamlit as st
import streamlit.components.v1 as components
from typing import Dict, Any
import json

def render_topic_graph(graph_data: Dict[str, Any], height: int = 600):
    """Render the topic graph using D3.js."""
    # Get the directory of this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Read the HTML template
    template_path = os.path.join(current_dir, "topic_graph.html")
    with open(template_path, "r") as f:
        template = f.read()
    
    # Insert the graph data into the template
    html = template.replace("var graphData = {};", f"var graphData = {json.dumps(graph_data)};")
    
    # Render the component
    components.html(html, height=height)

def format_graph_data(topic_graph: Dict[str, Any]) -> Dict[str, Any]:
    """Format the topic graph data for D3.js visualization."""
    # Color scale for categories
    color_scale = {
        "Technical": "#4e79a7",
        "Ethical": "#f28e2c",
        "Business": "#e15759",
        "Personal Story": "#76b7b2",
        "Other": "#59a14f"
    }
    
    # Format nodes
    nodes = []
    for node in topic_graph["nodes"]:
        nodes.append({
            "id": node["id"],
            "label": node["label"],
            "category": node["category"],
            "color": color_scale.get(node["category"], "#666666"),
            "size": 10 + (node["importance"] * 20),  # Scale node size based on importance
            "timestamps": node["timestamps"],
            "summary": node["summary"],
            "key_insights": node["key_insights"]
        })
    
    # Format edges
    edges = []
    for edge in topic_graph["edges"]:
        edges.append({
            "source": edge["source"],
            "target": edge["target"],
            "weight": edge["weight"],
            "type": edge["relationship_type"]
        })
    
    return {
        "nodes": nodes,
        "edges": edges
    }

def topic_graph_sidebar(graph_data: Dict[str, Any]):
    """Render the sidebar controls for the topic graph."""
    st.sidebar.header("Graph Controls")
    
    # Category filters
    st.sidebar.subheader("Filter by Category")
    categories = set(node["category"] for node in graph_data["nodes"])
    selected_categories = []
    for category in categories:
        if st.sidebar.checkbox(category, value=True):
            selected_categories.append(category)
    
    # Search box
    search_query = st.sidebar.text_input("Search Topics", "")
    
    # Relationship type filters
    st.sidebar.subheader("Filter by Relationship Type")
    relationship_types = set(edge["type"] for edge in graph_data["edges"])
    selected_relationships = []
    for rel_type in relationship_types:
        if st.sidebar.checkbox(rel_type, value=True):
            selected_relationships.append(rel_type)
    
    # Return filters
    return {
        "categories": selected_categories,
        "search": search_query,
        "relationships": selected_relationships
    }

def display_node_details(node: Dict[str, Any], video_id: str):
    """Display details of a selected node in the sidebar."""
    st.sidebar.header("Topic Details")
    st.sidebar.subheader(node["label"])
    st.sidebar.markdown(f"**Category:** {node['category']}")
    
    st.sidebar.subheader("Summary")
    st.sidebar.write(node["summary"])
    
    st.sidebar.subheader("Key Insights")
    for insight in node["key_insights"]:
        st.sidebar.markdown(f"• {insight}")
    
    st.sidebar.subheader("Timestamps")
    for ts in node["timestamps"]:
        minutes = int(ts // 60)
        seconds = int(ts % 60)
        url = f"https://youtube.com/watch?v={video_id}&t={int(ts)}"
        st.sidebar.markdown(f"[{minutes:02d}:{seconds:02d}]({url})")
