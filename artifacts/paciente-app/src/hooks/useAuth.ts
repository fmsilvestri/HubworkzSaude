import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "paciente" | "gestor" | "farmaceutico" | "faturamento" | "importador" | "convenio" | "fornecedor";

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const role = (session?.user?.user_metadata?.["role"] as UserRole) ?? null;
      setState({ user: session?.user ?? null, session, role, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = (session?.user?.user_metadata?.["role"] as UserRole) ?? null;
      setState({ user: session?.user ?? null, session, role, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
