'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Chat } from "@/components/chat"
import { analyzeVideo } from '@/lib/api'
import type { AnalysisResult } from '@/types/chat'

type AnalysisTab = 'topics' | 'timeline' | 'chat'

export default function Page() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('topics');
  const [currentVideo, setCurrentVideo] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    return pattern.test(url)
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrl(validateYouTubeUrl(newUrl));
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!isValidUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await analyzeVideo(url);
      setCurrentVideo(result);
      setActiveTab('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the video');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    document.querySelectorAll('.scroll-animation').forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }
        
        .glimmer-card {
          position: relative;
          background: rgb(23, 23, 23);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .glimmer-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(236, 72, 153, 0.03),
            rgba(236, 72, 153, 0.06),
            rgba(236, 72, 153, 0.03),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 8s ease-in-out infinite;
          pointer-events: none;
        }

        .glimmer-pill {
          position: relative;
          background: rgb(23, 23, 23);
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .glimmer-pill::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(236, 72, 153, 0.03),
            rgba(236, 72, 153, 0.06),
            rgba(236, 72, 153, 0.03),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 8s ease-in-out infinite;
          pointer-events: none;
        }

        .hero-glow {
          position: absolute;
          top: 85%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 140%;
          height: 600px;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.03) 35%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
          filter: blur(50px);
        }

        .scroll-animation {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .scroll-animation.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .scroll-delay-1 { transition-delay: 0.1s; }
        .scroll-delay-2 { transition-delay: 0.2s; }
        .scroll-delay-3 { transition-delay: 0.3s; }

        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-gradient {
          background: linear-gradient(45deg, rgba(79, 70, 229, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(79, 70, 229, 0.1) 100%);
          background-size: 200% 200%;
          animation: gradientFlow 10s ease infinite;
        }
        .glow-effect {
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
          transition: all 0.3s ease;
        }
        .glow-effect:hover {
          box-shadow: 0 0 30px rgba(147, 51, 234, 0.4);
        }
      `}</style>

      <main>
        <section className="py-20 px-6 relative hero-gradient">
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 font-medium text-sm text-indigo-200 hover:border-indigo-600/50 transition-colors">
              VideoGraph AI
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-white via-indigo-200 to-white text-transparent bg-clip-text">
              Transform YouTube Videos<br />Into Knowledge Graphs
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-indigo-200 max-w-3xl mx-auto mb-8">
              Extract insights, create topic maps, and explore video content with AI-powered analysis. Turn any YouTube video into an interactive knowledge base.
            </p>
            <div className="fade-in delay-3">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 transition-all duration-300 glow-effect">
                  Analyze Video
                </Button>
                <Button size="lg" variant="outline" className="border-indigo-500/50 hover:border-indigo-400 text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-all duration-300">
                  View Example Analysis
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto scroll-animation">
            <div className="glimmer-card overflow-hidden rounded-xl border border-indigo-900/50 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow duration-300">
              <div className="bg-gradient-to-br from-indigo-950 via-purple-950/50 to-black">
                <div className="flex items-center gap-2 p-2 md:p-3 border-b border-indigo-700/50 bg-black/40">
                  <div className="flex gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row h-[500px] md:h-[700px]">
                  {/* Video Panel */}
                  <div className="md:w-1/2 border-r border-indigo-700/50 p-4 flex-shrink-0">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter YouTube URL..."
                            className="flex-1 px-4 py-2 bg-indigo-900/30 rounded-lg border border-indigo-700/50 text-sm md:text-base placeholder:text-indigo-400/50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                            value={url}
                            onChange={handleUrlChange}
                          />
                          <Button 
                            onClick={handleAnalyze}
                            disabled={!isValidUrl || isLoading}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {isLoading ? "Analyzing..." : "Analyze"}
                          </Button>
                        </div>
                        {url && !isValidUrl && (
                          <p className="text-red-400 text-sm mt-2">Please enter a valid YouTube URL</p>
                        )}
                        {error && (
                          <p className="text-red-400 text-sm mt-2">{error}</p>
                        )}
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-lg relative">
                        {currentVideo ? (
                          <div className="h-full p-4 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <h3 className="text-xl font-semibold mb-2 text-white">Video Processed Successfully!</h3>
                              <p className="text-indigo-200">You can now explore the video content using the analysis tools.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-indigo-300">
                            <div className="text-center">
                              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm">Enter a YouTube URL to start analysis</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Analysis Panel */}
                  <div className="flex-1 flex flex-col p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                        {currentVideo ? 'Video Analysis' : 'Knowledge Graph'}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab('topics')}
                          className={`text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-indigo-400 after:to-purple-400 hover:after:scale-x-100 after:transition-transform ${
                            activeTab === 'topics' ? 'text-white after:scale-x-100' : ''
                          }`}
                        >
                          Topics
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('timeline')}
                          className={`text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-indigo-400 after:to-purple-400 hover:after:scale-x-100 after:transition-transform ${
                            activeTab === 'timeline' ? 'text-white after:scale-x-100' : ''
                          }`}
                        >
                          Timeline
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('chat')}
                          className={`text-indigo-200 hover:text-white hover:bg-indigo-900/50 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-indigo-400 after:to-purple-400 hover:after:scale-x-100 after:transition-transform ${
                            activeTab === 'chat' ? 'text-white after:scale-x-100' : ''
                          }`}
                        >
                          Chat
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-lg">
                      {activeTab === 'topics' && (
                        <div className="flex items-center justify-center h-full text-indigo-300">
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <p className="text-sm">Knowledge graph will appear here</p>
                          </div>
                        </div>
                      )}
                      {activeTab === 'timeline' && (
                        <div className="flex items-center justify-center h-full text-indigo-300">
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <p className="text-sm">Timeline view will appear here</p>
                          </div>
                        </div>
                      )}
                      {activeTab === 'chat' && <Chat videoId={currentVideo?.videoId} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 border-t border-indigo-900/30">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-24 scroll-animation">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">How It Works</h2>
              <p className="text-indigo-200">Transform any YouTube video into an interactive knowledge base in three simple steps.</p>
            </div>

            <div className="relative">
              {/* Decorative line connecting the steps */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-800 via-pink-500/20 to-indigo-800 hidden md:block" />
              
              <div className="grid md:grid-cols-3 gap-24 relative">
                <div className="bg-indigo-900 p-8 rounded-xl border border-indigo-800 scroll-animation scroll-delay-1">
                  <div className="text-2xl mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Input Video URL</h3>
                  <p className="text-indigo-200">
                    Simply paste any YouTube video URL. Our system supports videos of any length and can process multiple languages.
                  </p>
                </div>

                <div className="bg-indigo-900 p-8 rounded-xl border border-indigo-800 scroll-animation scroll-delay-2">
                  <div className="text-2xl mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
                  <p className="text-indigo-200">
                    Our AI processes the video content, extracting key topics, relationships, and insights to create a comprehensive knowledge graph.
                  </p>
                </div>

                <div className="bg-indigo-900 p-8 rounded-xl border border-indigo-800 scroll-animation scroll-delay-3">
                  <div className="text-2xl mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Explore & Learn</h3>
                  <p className="text-indigo-200">
                    Navigate through the interactive knowledge graph, explore topics, and discover connections. Save insights for later reference.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-indigo-900/30 scroll-animation">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="text-sm text-indigo-200">
            © 2024 VideoGraph AI. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white transition-colors">
              <span className="sr-only">Discord</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6h0a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3v0"/>
                <path d="M6 18v-7a3 3 0 0 1 3-3h7"/>
                <circle cx="8" cy="12" r="1"/>
                <circle cx="16" cy="12" r="1"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}