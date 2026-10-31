import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load the profile row; if it doesn't exist yet (e.g. email confirmation was on
  // at sign-up), create it from the details saved in the user's metadata.
  async function loadProfile(user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) return setProfile(data)

    const meta = user.user_metadata || {}
    const { data: created } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: meta.full_name ?? null,
        course: meta.course ?? null,
        year_level: meta.year_level ?? null,
      })
      .select()
      .single()
    setProfile(created ?? null)
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
        return
      }
      if (event === 'TOKEN_REFRESHED') return
      // Defer Supabase calls out of the callback to avoid auth deadlocks
      setTimeout(async () => {
        await loadProfile(newSession.user)
        setLoading(false)
      }, 0)
    })
    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
