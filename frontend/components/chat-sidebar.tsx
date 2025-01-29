'use client'

import { Button } from "@/components/ui/button"
import { ChatSession } from "@/types/chat"
import { useChatSessions } from "@/hooks/useChatSessions"

export function ChatSidebar() {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    deleteSession
  } = useChatSessions()

  const handleNewChat = () => {
    createNewSession()
  }

  const getPreviewText = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1]
    if (!lastMessage) return 'No messages'
    return lastMessage.content.slice(0, 40) + (lastMessage.content.length > 40 ? '...' : '')
  }

  return (
    <div className="w-80 h-full flex flex-col bg-black border-r border-indigo-900/30">
      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white"
        >
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => setCurrentSessionId(session.id)}
            className={`w-full text-left p-4 hover:bg-indigo-900/20 transition-colors group relative ${
              session.id === currentSessionId ? 'bg-indigo-900/30' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-4 h-4 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
                  className="text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-indigo-200 truncate">
                  {session.title}
                </h3>
                <p className="text-xs text-indigo-400 truncate mt-0.5">
                  {getPreviewText(session)}
                </p>
              </div>
            </div>

            {/* Delete Button - Only visible on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteSession(session.id)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
            >
              <svg className="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  )
} 