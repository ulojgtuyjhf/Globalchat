"use client"

import { useState, useEffect } from "react"
import { MobileFeed } from "./mobile-feed"
import { DesktopFeed } from "./desktop-feed"
import { BottomNav } from "../navigation/bottom-nav"

export function FeedLayout() {
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileFeed />
          <BottomNav />
        </>
      ) : (
        <DesktopFeed />
      )}
    </div>
  )
}
