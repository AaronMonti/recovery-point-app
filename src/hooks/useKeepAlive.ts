'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook para mantener activa la instancia de Supabase
 * Hace peticiones periódicas para evitar que Supabase pause la instancia por inactividad
 * 
 * @param interval - Intervalo en milisegundos entre peticiones (default: 4 días)
 * @param enabled - Si está habilitado o no (default: true)
 */
export function useKeepAlive(interval: number = 4 * 24 * 60 * 60 * 1000, enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const keepAlive = async () => {
      // Evitar múltiples llamadas simultáneas
      if (isActiveRef.current) {
        return
      }

      isActiveRef.current = true
      const startTime = Date.now()
      try {
        // Verificar si hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Hacer una petición simple para mantener la conexión activa
          // Usar getUser() es una petición ligera que mantiene la instancia activa
          await supabase.auth.getUser()
          const duration = Date.now() - startTime
          const intervalInDays = (interval / (24 * 60 * 60 * 1000)).toFixed(1)
          console.log(`✅ Keep-alive ejecutado exitosamente | Próxima ejecución en ${intervalInDays} días | Duración: ${duration}ms`)
        } else {
          console.log('⏸️ Keep-alive omitido: No hay sesión activa')
        }
      } catch (error) {
        const duration = Date.now() - startTime
        // Silenciar errores de keep-alive para no llenar la consola
        // Solo registrar errores críticos
        if (error instanceof Error && !error.message.includes('session') && !error.message.includes('JWT')) {
          console.warn(`⚠️ Keep-alive warning (${duration}ms):`, error.message)
        }
      } finally {
        isActiveRef.current = false
      }
    }

    // Ejecutar inmediatamente la primera vez
    console.log(`🔄 Keep-alive iniciado | Intervalo: ${(interval / (24 * 60 * 60 * 1000)).toFixed(1)} días`)
    keepAlive()

    // Configurar intervalo
    intervalRef.current = setInterval(keepAlive, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interval, enabled])
}

