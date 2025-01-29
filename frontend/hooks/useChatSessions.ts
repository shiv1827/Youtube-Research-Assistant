'use client'

import { useState, useEffect } from 'react'
import { ChatSession, Message } from '@/types/chat'

const STORAGE_KEY = 'videograph-chat-sessions'

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY)
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions, (key, value) => {
        // Convert string dates back to Date objects
        if (key === 'timestamp' || key === 'lastUpdated') {
          return new Date(value)
        }
        return value
      })
      setSessions(parsed)
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id)
      }
    }
  }, [])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    }
  }, [sessions])

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId)
  }

  const createNewSession = (videoId?: string) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: `Chat ${sessions.length + 1}`,
      messages: [],
      lastUpdated: new Date(),
      videoId
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    return newSession
  }

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates, lastUpdated: new Date() }
        : session
    ))
  }

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions[0]?.id || null)
    }
  }

  const addMessage = (sessionId: string, message: Message) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, message],
            lastUpdated: new Date()
          }
        : session
    ))
  }

  const clearMessages = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: [],
            lastUpdated: new Date()
          }
        : session
    ))
  }

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    getCurrentSession,
    createNewSession,
    updateSession,
    deleteSession,
    addMessage,
    clearMessages
  }
} 