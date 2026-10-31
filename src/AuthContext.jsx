import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileFor, setProfileFor] = useState(null) // user id whose profile has been loaded

  const user = session?.user ?? null

  // 1. Track the auth session only (no database calls in this callback)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 2. Load the profile once a user is known
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileFor(null)
      return
    }
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (error) console.error('Profile select failed:', error.message)

      let row = data
      if (!row && !error) {
        const meta = user.user_metadata || {}
        const res = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: meta.full_name ?? null,
            course: meta.course ?? null,
            year_level: meta.year_level ?? null,
          })
          .select().single()
        if (res.error) console.error('Profile insert failed:', res.error.message)
        row = res.data
      }
      if (!cancelled) {
        setProfile(row ?? null)
        setProfileFor(user.id)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.id])

  const value = {
    session,
    user,
    profile,
    setProfile,
    loading: !authReady || (!!user && profileFor !== user.id),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)