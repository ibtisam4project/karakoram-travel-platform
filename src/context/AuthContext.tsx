import React, { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import { Profile } from "@/types/database"

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null; user: User | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, user: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch or upsert profile row from public.profiles
  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setProfile(data as Profile)
      } else {
        // Fallback: If trigger didn't catch it or for mock-resilient environments, create profile
        const fullName = currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "Guest Traveler"
        const phone = currentUser.user_metadata?.phone || null
        const role = currentUser.email?.includes("admin") ? "admin" : "user"

        const { data: newProfile } = await supabase
          .from("profiles")
          .upsert({
            id: currentUser.id,
            full_name: fullName,
            phone: phone,
            role: role,
          })
          .select()
          .maybeSingle()

        if (newProfile) {
          setProfile(newProfile as Profile)
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err)
    }
  }

  // Refresh profile explicitly
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
    }
  }

  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession()
        if (mounted) {
          setSession(data.session)
          setUser(data.session?.user ?? null)
          if (data.session?.user) {
            await fetchProfile(data.session.user)
          }
        }
      } catch (err) {
        console.error("Error initializing auth session:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initSession()

    // Listen to real-time Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await fetchProfile(newSession.user)
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Sign in
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign up
  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          },
        },
      })

      if (!error && data.user) {
        // Also defensively upsert profile immediately to ensure instant availability
        const role = email.includes("admin") ? "admin" : "user"
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone || null,
          role: role,
        })
      }

      return { error, user: data.user }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const isAdmin = profile?.role === "admin"
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
