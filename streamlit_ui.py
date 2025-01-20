from __future__ import annotations
from typing import Literal, TypedDict
import asyncio
import os

import streamlit as st
import json
import logfire
from supabase import Client
from openai import AsyncOpenAI

# Import all the message part classes
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
    UserPromptPart,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
    RetryPromptPart,
    ModelMessagesTypeAdapter
)
from youtube_research_assistant import youtube_assistant, YouTubeAssistantDeps

# Import topic graph components
from components.topic_graph import render_topic_graph, format_graph_data, topic_graph_sidebar

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = Client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Configure logfire to suppress warnings (optional)
logfire.configure(send_to_logfire='never')

class ChatMessage(TypedDict):
    """Format of messages sent to the browser/API."""

    role: Literal['user', 'model']
    timestamp: str
    content: str


def display_message_part(part):
    """
    Display a single part of a message in the Streamlit UI.
    Customize how you display system prompts, user prompts,
    tool calls, tool returns, etc.
    """
    # system-prompt
    if part.part_kind == 'system-prompt':
        with st.chat_message("system"):
            st.markdown(f"**System**: {part.content}")
    # user-prompt
    elif part.part_kind == 'user-prompt':
        with st.chat_message("user"):
            st.markdown(part.content)
    # text
    elif part.part_kind == 'text':
        with st.chat_message("assistant"):
            st.markdown(part.content)          


async def run_agent_with_streaming(user_input: str):
    """
    Run the agent with streaming text for the user_input prompt,
    while maintaining the entire conversation in `st.session_state.messages`.
    """
    # Prepare dependencies
    deps = YouTubeAssistantDeps(
        supabase=supabase,
        openai_client=openai_client
    )

    # Run the agent in a stream
    async with youtube_assistant.run_stream(
        user_input,
        deps=deps,
        message_history=st.session_state.messages[:-1],  # pass entire conversation so far
    ) as result:
        # We'll gather partial text to show incrementally
        partial_text = ""
        message_placeholder = st.empty()

        # Render partial text as it arrives
        async for chunk in result.stream_text(delta=True):
            partial_text += chunk
            message_placeholder.markdown(partial_text)

        # Now that the stream is finished, we have a final result.
        # Add new messages from this run, excluding user-prompt messages
        filtered_messages = [msg for msg in result.new_messages() 
                            if not (hasattr(msg, 'parts') and 
                                    any(part.part_kind == 'user-prompt' for part in msg.parts))]
        st.session_state.messages.extend(filtered_messages)

        # Add the final response to the messages
        st.session_state.messages.append(
            ModelResponse(parts=[TextPart(content=partial_text)])
        )


async def main():
    st.title("YouTube Video Research Assistant")
    
    # Create tabs for chat and graph
    tab1, tab2 = st.tabs(["Chat Interface", "Topic Graph"])
    
    with tab1:
        st.write("Ask questions about the YouTube videos in the knowledge base!")

        # Initialize chat history in session state if not present
        if "messages" not in st.session_state:
            st.session_state.messages = []

        # Display all messages from the conversation so far
        for msg in st.session_state.messages:
            if isinstance(msg, ModelRequest) or isinstance(msg, ModelResponse):
                for part in msg.parts:
                    display_message_part(part)

        # Chat input for the user
        user_input = st.chat_input("What would you like to know about the videos?")

        if user_input:
            # We append a new request to the conversation explicitly
            st.session_state.messages.append(
                ModelRequest(parts=[UserPromptPart(content=user_input)])
            )
            
            # Display user prompt in the UI
            with st.chat_message("user"):
                st.markdown(user_input)

            # Display the assistant's partial response while streaming
            with st.chat_message("assistant"):
                # Actually run the agent now, streaming the text
                await run_agent_with_streaming(user_input)
    
    with tab2:
        # Fetch available videos
        result = supabase.table("topic_graphs").select("*").execute()
        if result.data:
            # Let user select a video
            video_ids = [item["video_id"] for item in result.data]
            selected_video = st.selectbox("Select a video to view its topic graph", video_ids)
            
            if selected_video:
                # Get the topic graph data for selected video
                graph_data = next((item for item in result.data if item["video_id"] == selected_video), None)
                if graph_data:
                    # Create columns for graph and sidebar
                    col1, col2 = st.columns([7, 3])
                    with col1:
                        # Format and render the graph
                        formatted_data = format_graph_data({
                            "nodes": graph_data["nodes"],
                            "edges": graph_data["edges"]
                        })
                        render_topic_graph(formatted_data, height=600)
                    
                    with col2:
                        # Render the sidebar controls
                        topic_graph_sidebar(formatted_data)
        else:
            st.info("No topic graphs available yet. Process some videos first!")


if __name__ == "__main__":
    asyncio.run(main())
