import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Endpoint API para mantener activa la instancia de Supabase
 * Puede ser llamado periódicamente desde el cliente o desde un servicio externo
 * para evitar que Supabase pause la instancia por inactividad
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignorar errores de cookies en Server Components
            }
          },
        },
      }
    )

    // Verificar sesión y hacer una petición simple para mantener la conexión activa
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Hacer una petición simple para mantener la instancia activa
      await supabase.auth.getUser()
      
      return NextResponse.json({ 
        success: true, 
        message: 'Keep-alive successful',
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: false, 
      message: 'No active session',
      timestamp: new Date().toISOString()
    }, { status: 401 })
  } catch (error) {
    console.error('Keep-alive error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Keep-alive failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

