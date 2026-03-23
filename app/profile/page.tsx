"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateProfile } from "firebase/auth"
import { db, storage } from "@/lib/firebase"
import { 
  ArrowLeft, Settings, Edit2, Grid, Bookmark, Heart, 
  Moon, Sun, Bell, Lock, HelpCircle, LogOut, X, Camera,
  ChevronRight, Users
} from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"

interface UserProfile {
  displayName: string
  username: string
  bio: string
  photoURL: string
  followersCount: number
  followingCount: number
  postsCount: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "liked">("posts")
  const [videos, setVideos] = useState<{id: string; videoUrl: string; likes: number}[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // Edit modals
  const [editNameModal, setEditNameModal] = useState(false)
  const [editBioModal, setEditBioModal] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [newName, setNewName] = useState("")
  const [newBio, setNewBio] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile
          setProfile(data)
          setNewName(data.displayName || "")
          setNewBio(data.bio || "")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [user])

  useEffect(() => {
    async function fetchVideos() {
      if (!user) return
      
      try {
        const q = query(
          collection(db, "videos"),
          where("creatorId", "==", user.uid)
        )
        const snapshot = await getDocs(q)
        const videoData = snapshot.docs.map((doc) => ({
          id: doc.id,
          videoUrl: doc.data().videoUrl,
          likes: doc.data().likes || 0
        }))
        setVideos(videoData)
      } catch (error) {
        console.error("Error fetching videos:", error)
      }
    }

    fetchVideos()
  }, [user, activeTab])

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return
    
    try {
      await updateProfile(user, { displayName: newName })
      await updateDoc(doc(db, "users", user.uid), { displayName: newName })
      setProfile((prev) => prev ? { ...prev, displayName: newName } : null)
      setEditNameModal(false)
    } catch (error) {
      console.error("Error updating name:", error)
    }
  }

  const handleUpdateBio = async () => {
    if (!user) return
    
    try {
      await updateDoc(doc(db, "users", user.uid), { bio: newBio })
      setProfile((prev) => prev ? { ...prev, bio: newBio } : null)
      setEditBioModal(false)
    } catch (error) {
      console.error("Error updating bio:", error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`)
      await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(storageRef)
      
      await updateProfile(user, { photoURL })
      await updateDoc(doc(db, "users", user.uid), { photoURL })
      setProfile((prev) => prev ? { ...prev, photoURL } : null)
    } catch (error) {
      console.error("Error uploading photo:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full brand-gradient"
              style={{
                animation: "bounce 1.1s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen bg-card">
      {/* Navigation */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b border-border safe-area-pt">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-black text-foreground">
          {profile.displayName || "Profile"}
        </h1>
        <button
          onClick={() => setSettingsModal(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Profile Header */}
      <section className="px-4 pt-5 pb-4 bg-card">
        <div className="flex items-center gap-5 mb-4">
          {/* Avatar */}
          <div className="relative">
            <div className="p-0.5 rounded-full brand-gradient">
              <div className="w-22 h-22 rounded-full bg-card overflow-hidden flex items-center justify-center border-3 border-card">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-muted-foreground">
                    {profile.displayName?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full brand-gradient flex items-center justify-center shadow-lg"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Stats */}
          <div className="flex-1 flex items-stretch">
            <StatItem label="Posts" value={profile.postsCount || videos.length} />
            <StatItem label="Followers" value={profile.followersCount} />
            <StatItem label="Following" value={profile.followingCount} />
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-base font-black text-foreground">{profile.displayName}</h2>
            <button
              onClick={() => setEditNameModal(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-1.5">
            @{profile.username || user.email?.split("@")[0]}
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {profile.bio || "Add a bio to tell people about yourself"}
            <button
              onClick={() => setEditBioModal(true)}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors inline-flex"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 h-9 rounded-lg border border-border bg-muted text-foreground text-sm font-bold transition-all active:scale-95">
            Edit Profile
          </button>
          <button className="flex-1 h-9 rounded-lg border border-border bg-muted text-foreground text-sm font-bold transition-all active:scale-95">
            Share Profile
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex bg-card border-y border-border">
        <TabButton
          active={activeTab === "posts"}
          onClick={() => setActiveTab("posts")}
          icon={<Grid className="w-5 h-5" />}
        />
        <TabButton
          active={activeTab === "saved"}
          onClick={() => setActiveTab("saved")}
          icon={<Bookmark className="w-5 h-5" />}
        />
        <TabButton
          active={activeTab === "liked"}
          onClick={() => setActiveTab("liked")}
          icon={<Heart className="w-5 h-5" />}
        />
      </div>

      {/* Grid */}
      <div className="p-1.5 bg-card">
        {videos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-bold text-muted-foreground">No posts yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Your videos will appear here
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-1.5">
            {videos.map((video) => (
              <div key={video.id} className="break-inside-avoid mb-1.5 rounded-xl overflow-hidden relative bg-muted">
                <video
                  src={video.videoUrl}
                  className="w-full h-auto object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold">
                  <Heart className="w-3 h-3 fill-white" />
                  {formatNumber(video.likes)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {settingsModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSettingsModal(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl overflow-hidden animate-slide-up">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3" />
            
            <div className="p-5">
              <h3 className="text-lg font-black text-foreground mb-4">Settings</h3>
              
              {/* Theme */}
              <div className="mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  Appearance
                </p>
                <div className="flex gap-2">
                  {(["light", "dim", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all",
                        theme === t
                          ? "brand-gradient text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t === "light" && <Sun className="w-4 h-4 inline mr-1.5" />}
                      {t === "dark" && <Moon className="w-4 h-4 inline mr-1.5" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <SettingsItem icon={<Bell />} label="Notifications" />
                <SettingsItem icon={<Lock />} label="Privacy & Security" />
                <SettingsItem icon={<HelpCircle />} label="Help & Support" />
                <SettingsItem 
                  icon={<LogOut />} 
                  label="Log Out" 
                  danger 
                  onClick={handleSignOut}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {editNameModal && (
        <EditModal
          title="Edit Name"
          value={newName}
          onChange={setNewName}
          onSave={handleUpdateName}
          onClose={() => setEditNameModal(false)}
        />
      )}

      {/* Edit Bio Modal */}
      {editBioModal && (
        <EditModal
          title="Edit Bio"
          value={newBio}
          onChange={setNewBio}
          onSave={handleUpdateBio}
          onClose={() => setEditBioModal(false)}
          multiline
        />
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-1.5 relative cursor-pointer">
      <span className="text-lg font-black text-foreground tracking-tight">
        {formatNumber(value)}
      </span>
      <span className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</span>
    </div>
  )
}

function TabButton({ 
  active, 
  onClick, 
  icon 
}: { 
  active: boolean
  onClick: () => void
  icon: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-12 flex items-center justify-center border-b-2 transition-colors",
        active
          ? "text-foreground border-foreground"
          : "text-muted-foreground border-transparent"
      )}
    >
      {icon}
    </button>
  )
}

function SettingsItem({ 
  icon, 
  label, 
  danger = false,
  onClick
}: { 
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
        danger 
          ? "text-destructive hover:bg-destructive/10" 
          : "text-foreground hover:bg-muted"
      )}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="flex-1 text-left text-sm font-semibold">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  )
}

function EditModal({
  title,
  value,
  onChange,
  onSave,
  onClose,
  multiline = false
}: {
  title: string
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  multiline?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <h3 className="text-lg font-black text-foreground mb-4">{title}</h3>
        
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-24 p-3 rounded-xl bg-muted border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Write something..."
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 px-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Enter name..."
          />
        )}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-border text-muted-foreground font-bold transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 h-11 rounded-xl brand-gradient text-white font-bold transition-all hover:-translate-y-0.5"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
