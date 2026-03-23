"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { FeedLayout } from "@/components/feed/feed-layout"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <SplashScreen />
  }

  if (!user) {
    return null
  }

  return <FeedLayout />
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Logo ring */}
        <div className="w-24 h-24 rounded-full p-1 brand-gradient flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <span className="text-5xl font-bold brand-gradient-text tracking-tighter">
              N
            </span>
          </div>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            style={{
              animation: "shimmer 2.8s cubic-bezier(0.4,0,0.2,1) infinite",
              transform: "skewX(-18deg)"
            }}
          />
        </div>
      </div>

      {/* Company info */}
      <div className="absolute bottom-[15%] flex flex-col items-center text-center">
        <p className="text-sm text-muted-foreground mb-1.5 tracking-wide opacity-80">
          from
        </p>
        <h1 className="text-2xl font-semibold brand-gradient-text lowercase tracking-wide">
          nmedea
        </h1>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-18deg); }
          100% { transform: translateX(400%) skewX(-18deg); }
        }
      `}</style>
    </div>
  )
}
