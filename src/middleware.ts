import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Crear respuesta inicial
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  try {
    // Verificación rápida de sesión
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isAuthenticated = !!session

    // Redirecciones inmediatas
    if (!isAuthenticated && !isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  } catch (error) {
    // En caso de error, permitir el acceso pero registrar el error
    console.error('💥 Middleware error:', error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imagen)  
     * - favicon.ico (archivo favicon)
     * - archivos de imágenes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
