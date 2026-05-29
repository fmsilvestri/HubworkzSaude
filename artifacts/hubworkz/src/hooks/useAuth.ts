import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  email?: string
  role: string
  clinica_id?: string
  nome?: string
}

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile(data)
    } catch (e) {
      console.error(e)
      // Mock profile if table missing during dev
      setProfile({ id: userId, role: 'gestor', clinica_id: '123', nome: 'Admin' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, role: profile?.role, loading }
}
