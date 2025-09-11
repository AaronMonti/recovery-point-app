'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export function LogoutButton() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      // El hook useAuth ya maneja la redirección
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <Button
      variant="destructive" 
      onClick={handleLogout}
      className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:px-2"
    >
      <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
      <LogOut className="hidden group-data-[collapsible=icon]:block h-4 w-4" />
    </Button>
  )
}
