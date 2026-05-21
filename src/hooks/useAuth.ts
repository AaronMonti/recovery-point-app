'use client'

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const signOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user: session?.user ?? null,
    session,
    loading: status === 'loading',
    signOut,
  }
}
