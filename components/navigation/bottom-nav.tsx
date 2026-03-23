"use client"

import { useState } from "react"
import { Home, Search, Plus, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function BottomNav() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("home")

  const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    
    if (tab === "profile") {
      router.push("/profile")
    } else if (tab === "home") {
      router.push("/")
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-black/10 dark:border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-[72px] max-w-md mx-auto px-4">
        <NavButton
          icon={<Home className="w-6 h-6" />}
          active={activeTab === "home"}
          onClick={() => handleNavClick("home")}
        />
        <NavButton
          icon={<Search className="w-6 h-6" />}
          active={activeTab === "search"}
          onClick={() => handleNavClick("search")}
        />
        
        {/* Upload button */}
        <button
          onClick={() => handleNavClick("upload")}
          className="w-12 h-12 rounded-xl bg-black dark:bg-white flex items-center justify-center -mt-3 shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6 text-white dark:text-black" />
        </button>

        <NavButton
          icon={<Bell className="w-6 h-6" />}
          active={activeTab === "notifications"}
          onClick={() => handleNavClick("notifications")}
        />
        <NavButton
          icon={<User className="w-6 h-6" />}
          active={activeTab === "profile"}
          onClick={() => handleNavClick("profile")}
        />
      </div>
    </nav>
  )
}

function NavButton({
  icon,
  active,
  onClick
}: {
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90",
        active ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"
      )}
    >
      {icon}
      {active && (
        <span className="absolute bottom-2 w-1 h-1 rounded-full bg-black dark:bg-white" />
      )}
    </button>
  )
}
