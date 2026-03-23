"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Home, Search, Upload, Bell, User, ChevronUp, ChevronDown } from "lucide-react"
import { cn, formatNumber, formatTimeAgo } from "@/lib/utils"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface Video {
  id: string
  videoUrl: string
  caption: string
  creatorId: string
  creatorName: string
  creatorAvatar: string
  likes: number
  comments: number
  shares: number
  createdAt: Date
}

export function DesktopFeed() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query(
      collection(db, "videos"),
      orderBy("createdAt", "desc"),
      limit(20)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoData: Video[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Video[]
      
      setVideos(videoData)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return
    
    const scrollTop = feedRef.current.scrollTop
    const itemHeight = window.innerHeight - 20
    const newIndex = Math.round(scrollTop / itemHeight)
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }, [currentIndex])

  const scrollToIndex = (index: number) => {
    if (!feedRef.current || index < 0 || index >= videos.length) return
    
    const itemHeight = window.innerHeight - 20
    feedRef.current.scrollTo({
      top: index * itemHeight,
      behavior: "smooth"
    })
  }

  return (
    <div className="fixed inset-0 flex gap-2.5 p-2.5 bg-[#0f0f0f]">
      {/* Left Sidebar */}
      <aside className="w-[clamp(220px,17vw,260px)] flex-shrink-0 bg-[#111] border border-[#1e1e1e] rounded-2xl flex flex-col h-[calc(100vh-20px)] overflow-hidden">
        {/* Logo */}
        <div className="p-4 pb-3.5 flex items-center gap-2.5 border-b border-[#1a1a1a]">
          <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="text-base font-black text-white tracking-tight">Nmedea</span>
        </div>

        {/* Navigation */}
        <nav className="py-2">
          <NavItem icon={<Home />} label="Home" active />
          <NavItem icon={<Search />} label="Discover" />
          <NavItem icon={<Upload />} label="Upload" />
          <NavItem icon={<Bell />} label="Notifications" />
          <Link href="/profile">
            <NavItem icon={<User />} label="Profile" />
          </Link>
        </nav>

        <div className="h-px bg-[#1a1a1a] mx-2 my-1" />

        {/* User section */}
        <div className="mt-auto p-3 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1a1a] transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-neutral-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.displayName || "User"}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                @{user?.email?.split("@")[0] || "user"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Feed */}
      <main className="flex-1 h-[calc(100vh-20px)] overflow-hidden">
        <div
          ref={feedRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-white"
                    style={{
                      animation: "pulse 1.1s ease-in-out infinite",
                      animationDelay: `${i * 0.18}s`
                    }}
                  />
                ))}
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500">
              <p className="text-lg font-bold mb-1">No videos yet</p>
              <p className="text-sm">Be the first to share something!</p>
            </div>
          ) : (
            videos.map((video, index) => (
              <DesktopVideoCard
                key={video.id}
                video={video}
                isActive={index === currentIndex}
              />
            ))
          )}
        </div>
      </main>

      {/* Navigation Arrows */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-50">
        <button
          onClick={() => scrollToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform disabled:opacity-30"
        >
          <ChevronUp className="w-4 h-4 text-neutral-800" />
        </button>
        <button
          onClick={() => scrollToIndex(currentIndex + 1)}
          disabled={currentIndex === videos.length - 1}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform disabled:opacity-30"
        >
          <ChevronDown className="w-4 h-4 text-neutral-800" />
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        "w-[calc(100%-16px)] mx-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
        active ? "bg-[#1e1e1e] text-white" : "text-neutral-500 hover:bg-[#1a1a1a] hover:text-neutral-300"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          active ? "brand-gradient" : "bg-[#1a1a1a]"
        )}
      >
        <span className={cn("w-4 h-4", active ? "text-white" : "text-neutral-500")}>
          {icon}
        </span>
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}

function DesktopVideoCard({ video, isActive }: { video: Video; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPauseIndicator, setShowPauseIndicator] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!videoRef.current) return

    if (isActive) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [isActive])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
    
    setShowPauseIndicator(true)
    setTimeout(() => setShowPauseIndicator(false), 800)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(currentProgress)
  }

  return (
    <div className="w-full h-[calc(100vh-20px)] min-h-[calc(100vh-20px)] snap-start snap-always flex items-center justify-center">
      <div className="relative h-[calc(100vh-48px)] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl">
        {/* Video */}
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover cursor-pointer"
          loop
          playsInline
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none" />

        {/* Pause indicator */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-200",
            showPauseIndicator ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}
        >
          <div className="w-14 h-14 rounded-full brand-gradient flex items-center justify-center shadow-2xl">
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-16 left-0 right-0 h-0.5 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-[#626262] to-white"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Caption */}
        <div className="absolute bottom-5 left-4 right-4 z-10">
          <p className="text-base font-black text-white drop-shadow-lg mb-1">
            {video.creatorName || "Unknown"}
          </p>
          <p className="text-sm text-white/80 line-clamp-2 drop-shadow">
            {video.caption}
          </p>
        </div>
      </div>

      {/* Action buttons - positioned to the right of video */}
      <div className="flex flex-col items-center gap-5 ml-4">
        {/* Like */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <Heart
              className={cn(
                "w-7 h-7 transition-all",
                isLiked ? "fill-red-500 text-red-500" : "text-white"
              )}
            />
          </div>
          <span className="text-xs font-bold text-white/90">
            {formatNumber(video.likes + (isLiked ? 1 : 0))}
          </span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-bold text-white/90">
            {formatNumber(video.comments)}
          </span>
        </button>

        {/* Save */}
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <Bookmark
              className={cn(
                "w-6 h-6 transition-all",
                isSaved ? "fill-[#626262] text-[#626262]" : "text-white"
              )}
            />
          </div>
          <span className="text-xs font-bold text-white/90">Save</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
          <div className="w-14 h-14 rounded-full flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-white/90">Share</span>
        </button>
      </div>
    </div>
  )
}
