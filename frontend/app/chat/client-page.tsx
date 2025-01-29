'use client'

import { Chat } from "@/components/chat"

export function ClientPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <Chat standalone={true} />
    </div>
  )
} 