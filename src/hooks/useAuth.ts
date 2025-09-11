'use client'

import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { user, session, loading } = useAuthContext()
  const router = useRouter()

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Usar router de Next.js para navegación rápida
      router.push('/login')
      router.refresh() // Refrescar para que el middleware vea la sesión cerrada
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    session,
    loading,
    signOut,
  }
}
