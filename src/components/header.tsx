'use client';

import { UserNav } from './user-nav'
import { ModeToggle } from './theme-toggle'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { Users, BarChart3, Settings } from 'lucide-react'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg p-2">
              <img 
                src="/recovery-point-logo.jpg" 
                alt="Recovery Point Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </Link>
          
          <nav className="flex items-center space-x-2">
            <Link href="/">
              <Button 
                variant={pathname === '/' ? 'default' : 'ghost'} 
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Administración
              </Button>
            </Link>
            
            <Link href="/pacientes">
              <Button 
                variant={pathname === '/pacientes' ? 'default' : 'ghost'} 
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Pacientes
              </Button>
            </Link>
            
            <Link href="/estadisticas">
              <Button 
                variant={pathname === '/estadisticas' ? 'default' : 'ghost'} 
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Estadísticas
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}
