'use client'

interface ProtectedPageProps {
  children: React.ReactNode
}

export function ProtectedPage({ children }: ProtectedPageProps) {
  // Simplificamos al máximo - el middleware maneja toda la protección
  // Esto elimina cualquier demora del lado del cliente
  return <>{children}</>
}
