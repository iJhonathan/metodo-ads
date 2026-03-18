import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isDemoMode, enableDemoMode, disableDemoMode, DEMO_USER, DEMO_PROFILE } from '../lib/demo'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const demo = isDemoMode()

  const [user, setUser]       = useState(demo ? DEMO_USER : null)
  const [profile, setProfile] = useState(demo ? DEMO_PROFILE : null)
  const [loading, setLoading] = useState(!demo)

  useEffect(() => {
    if (isDemoMode()) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    if (isDemoMode()) return { data: { user: DEMO_USER }, error: null }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signUp(email, password, nombre) {
    if (isDemoMode()) return { data: { user: DEMO_USER }, error: null }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        nombre,
        plan: 'free',
      })
    }
    return { data, error }
  }

  async function signOut() {
    disableDemoMode()
    setUser(null)
    setProfile(null)
    if (!isDemoMode()) await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (isDemoMode()) return
    if (user) await fetchProfile(user.id)
  }

  // Activar demo mode desde el login
  function loginAsDemo() {
    enableDemoMode()
    setUser(DEMO_USER)
    setProfile(DEMO_PROFILE)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
