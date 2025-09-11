'use client'

import { useAuth } from '@/hooks/useAuth'
import { LogoutButton } from './logout-button'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export function UserNav() {
  const { user, loading } = useAuth()
  const hasShownWelcome = useRef(false)

  useEffect(() => {
    // Mostrar bienvenida solo una vez cuando el usuario se autentica
    if (user && !hasShownWelcome.current) {
      toast.success('¡Bienvenido!')
      hasShownWelcome.current = true
    }
    
    // Reset cuando el usuario se desloguea
    if (!user) {
      hasShownWelcome.current = false
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col items-start space-y-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:space-y-1">
      <span className="text-sm group-data-[collapsible=icon]:hidden">
        Hola, {user.email?.split('@')[0]}
      </span>
      <LogoutButton />
    </div>
  )
}
