'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between py-4 px-6 border-b border-indigo-900/30 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text hover:opacity-80 transition-opacity">
          VideoGraph AI
        </Link>
        <nav className="flex items-center gap-4">
          <Link 
            href="/chat"
            className={`text-sm ${
              pathname === '/chat' 
                ? 'text-white font-medium' 
                : 'text-indigo-200 hover:text-white'
            } transition-colors`}
          >
            Chat
          </Link>
          <Link 
            href="/topic-graph"
            className={`text-sm ${
              pathname === '/topic-graph' 
                ? 'text-white font-medium' 
                : 'text-indigo-200 hover:text-white'
            } transition-colors`}
          >
            Topic Graph
          </Link>
          <Link 
            href="/video-insights"
            className={`text-sm ${
              pathname === '/video-insights' 
                ? 'text-white font-medium' 
                : 'text-indigo-200 hover:text-white'
            } transition-colors`}
          >
            Video Insights
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-colors">
          Log in
        </Button>
        <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 transition-all duration-300 glow-effect">
          Sign up
        </Button>
      </div>
    </header>
  )
} 