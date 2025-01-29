# YouTube Research Assistant

A modern web application that helps users analyze and interact with YouTube video content through an AI-powered chat interface.

## Features

### Core Functionality
- **Video Analysis**: Analyze YouTube videos by providing video URLs
- **Interactive Chat**: Natural conversation interface to discuss video content
- **Real-time Responses**: Streaming responses with typing indicators
- **Source References**: Timestamps and quotes from the video when providing information
- **Error Handling**: Graceful error handling for invalid videos or processing issues

### UI/UX Improvements
1. **Message Formatting**
   - Enhanced readability with proper paragraph spacing
   - Timestamp formatting (MM:SS)
   - Increased max-width for better readability
   - Improved spacing and borders

2. **Visual Design**
   - Gradient backgrounds for user messages
   - Backdrop blur in the input area
   - Loading animations
   - Modern message bubble styling
   - Better source formatting with timestamps

3. **Empty State**
   - Welcome message for new conversations
   - Helpful instructions for getting started
   - Improved icons and visual guidance

4. **Loading States**
   - Animated typing indicators
   - Loading animation in send button
   - Disabled states for inputs during processing

## Recent Updates

### UI Enhancements
1. **Chat Component Improvements**
   - Simplified message handling logic
   - Added deduplication for streamed responses
   - Enhanced error handling and display
   - Improved timestamp formatting

2. **Visual Updates**
   - Removed dependency on custom scrollbar plugin
   - Streamlined styling approach
   - Enhanced accessibility

### Backend Integration
1. **Response Handling**
   - Improved streaming response parsing
   - Better error message formatting
   - Enhanced metadata handling for video sources

## Known Issues

1. **Scrolling Functionality** (To Be Fixed)
   - Scrolling during message streaming needs improvement
   - Auto-scroll behavior needs refinement
   - Native scrollbar styling could be enhanced

2. **Response Formatting**
   - Occasional duplicate responses in specific scenarios
   - Some formatting inconsistencies in long messages

## Technical Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hooks for state management

### Backend
- Python
- FastAPI
- YouTube Transcript API
- AI/ML integration for content analysis

## Project Structure

```
├── frontend/
│   ├── components/
│   │   ├── chat.tsx         # Main chat interface
│   │   └── ui/             # Reusable UI components
│   ├── app/
│   │   └── page.tsx        # Main application page
│   └── lib/
│       └── api.ts          # API integration
└── backend/
    └── youtube_research_assistant.py  # Backend logic
```

## Future Improvements

1. **High Priority**
   - Fix scrolling behavior in chat interface
   - Enhance response deduplication
   - Improve error handling for video processing

2. **Features to Add**
   - Support for multiple video analysis
   - Enhanced source citation
   - User preferences/settings
   - History of analyzed videos

## Development Notes

### Current Focus
- Stabilizing the chat interface
- Improving response quality
- Enhancing user experience

### Recent Fixes
- Removed problematic scrollbar plugin
- Simplified message handling logic
- Enhanced streaming response handling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd backend
   pip install -r requirements.txt
   ```
3. Start the development servers:
   ```bash
   # Frontend
   npm run dev

   # Backend
   uvicorn main:app --reload
   ```

## Contributing

Feel free to submit issues and enhancement requests. Follow these steps:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

[Add appropriate license information]
