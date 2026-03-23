"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Lock, Mail, User, Eye, EyeOff, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ModalType = "login" | "signup" | "loading" | null

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      setActiveModal("loading")
      await signInWithGoogle()
      router.push("/")
    } catch (error: unknown) {
      setActiveModal(null)
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google"
      setError(errorMessage)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaVerified) {
      setError("Please verify you're not a robot")
      return
    }
    
    setError("")
    setIsSubmitting(true)
    
    try {
      await signInWithEmail(formData.email, formData.password)
      setActiveModal("loading")
      router.push("/")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaVerified) {
      setError("Please verify you're not a robot")
      return
    }
    
    if (formData.username.length < 3 || formData.username.length > 20) {
      setError("Username must be 3-20 characters")
      return
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return
    }
    
    setError("")
    setIsSubmitting(true)
    
    try {
      await signUpWithEmail(formData.email, formData.password, formData.username)
      setActiveModal("loading")
      router.push("/")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create account"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setError("")
    setFormData({ email: "", password: "", username: "" })
    setCaptchaVerified(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Logo */}
      <div className="fixed top-6 left-6 z-10">
        <span className="text-xl font-extrabold tracking-tight brand-gradient-text">
          Nmedea
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row items-center justify-center min-h-screen px-5 py-20 md:gap-20">
        {/* Welcome Text */}
        <div className="text-center md:text-left mb-9 md:mb-0 md:max-w-sm animate-fade-in-down">
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-foreground mb-2.5 leading-tight">
            Welcome to Nmedea
          </h2>
          <p className="text-muted-foreground text-base">
            Connect with people around the world seamlessly
          </p>
        </div>

        {/* Auth Options */}
        <div className="flex flex-col gap-3 w-full max-w-sm md:max-w-[360px] animate-fade-in">
          {/* Google Auth */}
          <AuthOption
            onClick={handleGoogleSignIn}
            icon={<GoogleIcon />}
            title="Continue with Google"
            description="Sign in or register with your Google account"
          />

          {/* Manual Auth */}
          <AuthOption
            onClick={() => setActiveModal("signup")}
            icon={<Lock className="w-5 h-5" />}
            title="Create Account"
            description="Register with your email & password"
          />

          {/* Login */}
          <AuthOption
            onClick={() => setActiveModal("login")}
            icon={<Mail className="w-5 h-5" />}
            title="Sign In"
            description="Already have an account? Sign in here"
          />
        </div>
      </div>

      {/* Modal Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center md:items-center justify-center z-50 transition-all duration-300",
          activeModal ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={closeModal}
      >
        {/* Login Modal */}
        <div
          className={cn(
            "bg-card rounded-t-3xl md:rounded-3xl p-7 w-full md:max-w-md shadow-2xl transition-all duration-300 fixed bottom-0 md:static md:bottom-auto",
            activeModal === "login" ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-7 md:scale-95 opacity-0",
            activeModal !== "login" && "hidden"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:rotate-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-5">
            <h3 className="text-xl font-black tracking-tight text-foreground mb-1.5">
              Welcome Back
            </h3>
            <p className="text-muted-foreground text-sm">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <FloatingInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <FloatingInput
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Captcha */}
            <CaptchaCheckbox
              checked={captchaVerified}
              onChange={setCaptchaVerified}
            />

            {error && (
              <p className="text-destructive text-xs mt-3 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 rounded-xl brand-gradient text-white text-base font-extrabold tracking-wide mt-4 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center gap-2.5 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <AuthOption
            onClick={handleGoogleSignIn}
            icon={<GoogleIcon className="w-5 h-5" />}
            title="Continue with Google"
            compact
          />
        </div>

        {/* Signup Modal */}
        <div
          className={cn(
            "bg-card rounded-t-3xl md:rounded-3xl p-7 w-full md:max-w-md shadow-2xl transition-all duration-300 fixed bottom-0 md:static md:bottom-auto",
            activeModal === "signup" ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-7 md:scale-95 opacity-0",
            activeModal !== "signup" && "hidden"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:rotate-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-5">
            <h3 className="text-xl font-black tracking-tight text-foreground mb-1.5">
              Create Account
            </h3>
            <p className="text-muted-foreground text-sm">
              Join our global community
            </p>
          </div>

          <form onSubmit={handleSignUp}>
            <FloatingInput
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              icon={<User className="w-4 h-4" />}
            />

            <FloatingInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <FloatingInput
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Captcha */}
            <CaptchaCheckbox
              checked={captchaVerified}
              onChange={setCaptchaVerified}
            />

            {error && (
              <p className="text-destructive text-xs mt-3 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 rounded-xl brand-gradient text-white text-base font-extrabold tracking-wide mt-4 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="flex items-center gap-2.5 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <AuthOption
            onClick={handleGoogleSignIn}
            icon={<GoogleIcon className="w-5 h-5" />}
            title="Continue with Google"
            compact
          />
        </div>

        {/* Loading Modal */}
        <div
          className={cn(
            "bg-card rounded-3xl p-8 shadow-2xl transition-all duration-300",
            activeModal === "loading" ? "scale-100 opacity-100" : "scale-95 opacity-0",
            activeModal !== "loading" && "hidden"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full brand-gradient"
                  style={{
                    animation: `bounce 1.1s ease-in-out infinite`,
                    animationDelay: `${i * 0.18}s`
                  }}
                />
              ))}
            </div>
            <p className="text-lg font-extrabold text-foreground mb-1.5">
              Signing you in...
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait a moment
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
      `}</style>
    </div>
  )
}

// Sub-components
function AuthOption({
  onClick,
  icon,
  title,
  description,
  compact = false
}: {
  onClick: () => void
  icon: React.ReactNode
  title: string
  description?: string
  compact?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full bg-card border border-border rounded-2xl cursor-pointer transition-all relative overflow-hidden group",
        "hover:border-primary hover:-translate-y-0.5 hover:shadow-lg",
        "active:scale-[0.98]",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="absolute inset-0 brand-gradient opacity-0 group-hover:opacity-100 transition-opacity z-0" />
      
      <div className="text-primary transition-colors relative z-10 group-hover:text-white mr-3.5 flex-shrink-0">
        {icon}
      </div>
      
      <div className="flex-1 text-left relative z-10">
        <div className={cn(
          "font-extrabold text-foreground transition-colors group-hover:text-white",
          compact ? "text-sm" : "text-base mb-0.5"
        )}>
          {title}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground transition-colors group-hover:text-white/80">
            {description}
          </div>
        )}
      </div>
    </button>
  )
}

function FloatingInput({
  label,
  type,
  value,
  onChange,
  required,
  icon,
  suffix
}: {
  label: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  icon?: React.ReactNode
  suffix?: React.ReactNode
}) {
  return (
    <div className="relative mb-3.5">
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className={cn(
          "w-full h-14 px-3.5 pt-5 pb-2 border border-border rounded-xl text-base bg-muted text-foreground outline-none transition-all",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "peer",
          icon && "pl-10"
        )}
      />
      <label
        className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none transition-all",
          "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-bold peer-focus:text-primary peer-focus:uppercase peer-focus:tracking-wide",
          "peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:text-primary peer-[&:not(:placeholder-shown)]:uppercase peer-[&:not(:placeholder-shown)]:tracking-wide",
          icon && "left-10"
        )}
      >
        {label}
      </label>
      {icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      {suffix && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {suffix}
        </div>
      )}
    </div>
  )
}

function CaptchaCheckbox({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2.5 p-3 border border-border rounded-xl cursor-pointer select-none transition-all mt-3",
        checked && "border-success bg-success/5"
      )}
    >
      <div
        className={cn(
          "w-4.5 h-4.5 border-2 border-muted-foreground rounded flex-shrink-0 flex items-center justify-center transition-all",
          checked && "bg-success border-success"
        )}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm font-semibold text-foreground">
        {"I'm not a robot"}
      </span>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("w-5 h-5", className)}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
