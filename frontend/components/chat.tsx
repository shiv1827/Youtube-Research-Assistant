import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Message } from '@/types/chat'
import { sendMessage, streamResponse } from '@/lib/api'

interface ChatProps {
  videoId?: string
  standalone?: boolean
}

export function Chat({ videoId, standalone = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

  // Handle auto-scrolling
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container || !shouldAutoScroll) return

    const scrollToBottom = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }

    scrollToBottom()
  }, [messages, shouldAutoScroll])

  // Detect manual scroll
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setShouldAutoScroll(isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    if (!standalone && !videoId) {
      setError('Please analyze a video first')
      return
    }

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)
    setShouldAutoScroll(true)

    try {
      const response = await sendMessage(input, videoId || '')
      let lastContent = ''
      
      const assistantMessage: Message = {
        type: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      for await (const chunk of streamResponse(response)) {
        try {
          const parsedChunk = JSON.parse(chunk)
          if (parsedChunk.response && parsedChunk.response !== lastContent) {
            lastContent = parsedChunk.response
            setMessages(prev => [
              ...prev.slice(0, -1),
              {
                type: 'assistant',
                content: lastContent,
                timestamp: new Date(),
                metadata: parsedChunk.metadata
              }
            ])
          }
        } catch (e) {
          if (chunk !== lastContent) {
            lastContent = chunk
            setMessages(prev => [
              ...prev.slice(0, -1),
              {
                type: 'assistant',
                content: lastContent,
                timestamp: new Date()
              }
            ])
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {paragraph}
      </p>
    ))
  }

  const handleClearChat = () => {
    setMessages([])
    setError(null)
    setShouldAutoScroll(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Clear Button */}
      {standalone && (
        <div className="p-4 border-b border-indigo-900/30 bg-black/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-indigo-300">
                {messages.length} messages
              </div>
            </div>
            <Button
              onClick={handleClearChat}
              variant="ghost"
              className="text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/50"
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-indigo-300">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm">
                {standalone 
                  ? "Start a conversation with the research assistant"
                  : "Start a conversation about the video"}
              </p>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`flex items-start gap-3 group ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' 
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                : message.type === 'system'
                ? 'bg-red-900/50 border border-red-700/50'
                : 'bg-indigo-900/50 border border-indigo-700/50'
            }`}>
              {message.type === 'user' ? (
                <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ) : message.type === 'system' ? (
                <svg className="w-4 h-4 text-red-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            {/* Message Content */}
            <div className={`relative flex-1 max-w-[75%] group ${
              message.type === 'user' ? 'items-end' : 'items-start'
            }`}>
              <div
                className={`rounded-2xl px-4 py-2 shadow-sm transition-all duration-200 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-br-none'
                    : message.type === 'system'
                    ? 'bg-red-900/50 border border-red-700/50 text-red-200 rounded-bl-none'
                    : 'bg-indigo-900/50 border border-indigo-700/50 text-indigo-200 rounded-bl-none hover:bg-indigo-900/60'
                }`}
              >
                {formatMessage(message.content)}
                {message.metadata?.sources && (
                  <div className="mt-2 pt-2 border-t border-indigo-700/50">
                    <p className="text-sm font-medium text-indigo-300 mb-1">Sources:</p>
                    {message.metadata.sources.map((source, idx) => (
                      <div key={idx} className="text-sm text-indigo-400 mb-1 last:mb-0">
                        <span className="font-medium">{Math.floor(source.timestamp / 60)}:{String(source.timestamp % 60).padStart(2, '0')}</span>
                        : {source.text}
                      </div>
                    ))}
                  </div>
                )}
                <div className={`text-[10px] mt-1 opacity-70 ${
                  message.type === 'user' ? 'text-indigo-100' : 'text-indigo-300'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-indigo-900/50 border border-indigo-700/50 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-900/50 border border-red-700/50 rounded-lg p-4 text-red-200 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-indigo-900/30 p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={standalone ? "Ask anything..." : (videoId ? "Ask about the video..." : "Please analyze a video first")}
            disabled={(!standalone && !videoId) || isLoading}
            className="flex-1 px-4 py-2 bg-indigo-900/30 rounded-lg border border-indigo-700/50 text-sm md:text-base placeholder:text-indigo-400/50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || (!standalone && !videoId)}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap px-6"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}