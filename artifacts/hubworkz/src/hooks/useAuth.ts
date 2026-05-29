import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type UserRole =
  | 'gestor'
  | 'farmaceutico'
  | 'faturamento'
  | 'importador'
  | 'convenio'
  | 'fornecedor'
  | 'paciente'

export type Profile = {
  id: string
  email?: string
  role: UserRole
  clinica_id?: string
  nome?: string
}

export function useAuth() {
  const [user, setUser] = useState<ReturnType<typeof supabase.auth.getUser> extends Promise<{ data: { user: infer U } }> ? U : never | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  function buildProfile(sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): Profile | null {
    if (!sessionUser) return null
    const meta = sessionUser.user_metadata ?? {}
    const role = (meta['role'] as UserRole) ?? 'gestor'
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      role,
      clinica_id: meta['clinica_id'] as string | undefined,
      nome: (meta['nome'] as string | undefined) ?? sessionUser.email,
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u as never)
      setProfile(buildProfile(u))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u as never)
      setProfile(buildProfile(u))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, role: profile?.role ?? null, loading }
}
