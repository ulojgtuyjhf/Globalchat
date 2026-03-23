"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { cn, formatNumber, formatTimeAgo } from "@/lib/utils"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

export function MobileFeed() {
  const [videos, setVideos] = useState<Video[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

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
    if (!containerRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    const itemHeight = window.innerHeight
    const newIndex = Math.round(scrollTop / itemHeight)
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }, [currentIndex])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
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
    )
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <p className="text-lg font-bold mb-2">No videos yet</p>
        <p className="text-sm text-white/60">Be the first to share something!</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      onScroll={handleScroll}
    >
      {videos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={index === currentIndex}
        />
      ))}
    </div>
  )
}

function VideoCard({ video, isActive }: { video: Video; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
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
      setShowPauseIndicator(true)
      setTimeout(() => setShowPauseIndicator(false), 800)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(currentProgress)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSaved(!isSaved)
  }

  return (
    <div className="relative w-full h-dvh snap-start snap-always bg-black">
      {/* Video */}
      <div className="absolute inset-0" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none" />
      </div>

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
      <div className="absolute bottom-16 left-0 right-0 h-0.5 bg-white/20 z-20">
        <div
          className="h-full bg-gradient-to-r from-[#626262] to-white transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Caption area */}
      <div className="absolute bottom-20 left-4 right-16 z-10">
        {/* Creator info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full border-2 border-white/80 bg-neutral-500 overflow-hidden flex items-center justify-center">
            {video.creatorAvatar ? (
              <img src={video.creatorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">
                {video.creatorName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white drop-shadow-lg">
              {video.creatorName || "Unknown"}
            </span>
            <span className="text-[10px] font-bold text-white/60">
              {formatTimeAgo(video.createdAt)}
            </span>
          </div>
          <button className="ml-2 px-3 py-1 rounded-full brand-gradient text-white text-[9px] font-extrabold uppercase tracking-wider">
            Follow
          </button>
        </div>

        {/* Caption */}
        <p className="text-sm text-white/90 line-clamp-2 drop-shadow-lg">
          {video.caption}
        </p>
      </div>

      {/* Action buttons */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Heart
              className={cn(
                "w-7 h-7 transition-all",
                isLiked ? "fill-red-500 text-red-500" : "text-white"
              )}
            />
          </div>
          <span className="text-xs font-bold text-white drop-shadow">
            {formatNumber(video.likes + (isLiked ? 1 : 0))}
          </span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-bold text-white drop-shadow">
            {formatNumber(video.comments)}
          </span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Bookmark
              className={cn(
                "w-6 h-6 transition-all",
                isSaved ? "fill-[#626262] text-[#626262]" : "text-white"
              )}
            />
          </div>
          <span className="text-xs font-bold text-white drop-shadow">Save</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-bold text-white drop-shadow">Share</span>
        </button>

        {/* Mute toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsMuted(!isMuted)
          }}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform mt-2"
        >
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </div>
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
