"use client"

import { useEffect, useState } from 'react'
import { getUltimaSesion, getEvaluacionesPorSesion } from '@/lib/actions'

interface EvaluationResponse {
  questionId: string
  value: number
}

function calculateAverage(responses: EvaluationResponse[]): number {
  if (responses.length === 0) return 0
  const sum = responses.reduce((acc, response) => acc + response.value, 0)
  return Math.round((sum / responses.length) * 10) / 10 // Redondear a 1 decimal
}

export interface EvaluationStatus {
  preCompleted: boolean
  postCompleted: boolean
  canDoPost: boolean
  preAverage?: number
  postAverage?: number
  overallAverage?: number
  ultimaSesion?: { id: string; fecha: string; hora: string; sentimiento: string } | null
  isLoading: boolean
}

export function useEvaluationStatus(pacienteId: string): EvaluationStatus {
  const [status, setStatus] = useState<EvaluationStatus>({
    preCompleted: false,
    postCompleted: false,
    canDoPost: false,
    isLoading: true
  })

  useEffect(() => {
    
    const checkEvaluationStatus = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true }))

        // Obtener la última sesión del paciente
        const ultimaSesion = await getUltimaSesion(pacienteId)
        
        if (!ultimaSesion) {
          setStatus({
            preCompleted: false,
            postCompleted: false,
            canDoPost: false,
            isLoading: false
          })
          return
        }

        
        // Obtener evaluaciones de la última sesión
        const evaluaciones = await getEvaluacionesPorSesion(ultimaSesion.id)
        
        let preCompleted = false
        let postCompleted = false
        let preAverage: number | undefined
        let postAverage: number | undefined
        let overallAverage: number | undefined

        // Analizar las evaluaciones existentes
        evaluaciones.forEach(evaluacion => {
          try {
            // Verificar si los datos son JSON válido
            if (!evaluacion.respuestasComprimidas || 
                typeof evaluacion.respuestasComprimidas !== 'string' ||
                !evaluacion.respuestasComprimidas.startsWith('[') && !evaluacion.respuestasComprimidas.startsWith('{')) {
              return;
            }
            
            const respuestas: EvaluationResponse[] = JSON.parse(evaluacion.respuestasComprimidas)
            
            // Solo procesar si hay respuestas válidas
            if (respuestas.length === 0) {
              return;
            }
            
            // Verificar si es pre o post evaluación
            const tieneEvaluacionPre = respuestas.some(r => r.questionId.includes('_pre'))
            const tieneEvaluacionPost = respuestas.some(r => r.questionId.includes('_post'))
            
            if (tieneEvaluacionPre) {
              preCompleted = true
              preAverage = calculateAverage(respuestas)
            }
            
            if (tieneEvaluacionPost) {
              postCompleted = true
              postAverage = calculateAverage(respuestas)
            }
          } catch (error) {
            console.error('Error parsing evaluation responses:', error)
          }
        })

        // Calcular promedio general si hay ambas evaluaciones
        if (preAverage !== undefined && postAverage !== undefined) {
          overallAverage = Math.round(((preAverage + postAverage) / 2) * 10) / 10
        } else if (preAverage !== undefined) {
          overallAverage = preAverage
        } else if (postAverage !== undefined) {
          overallAverage = postAverage
        }

        setStatus({
          preCompleted,
          postCompleted,
          canDoPost: preCompleted && !postCompleted,
          preAverage,
          postAverage,
          overallAverage,
          ultimaSesion,
          isLoading: false
        })
      } catch (error) {
        console.error('Error checking evaluation status:', error)
        setStatus(prev => ({ ...prev, isLoading: false }))
      }
    }

    checkEvaluationStatus()

    // Solo escuchar eventos de actualización cuando sea necesario
    const handleUpdate = () => {
      checkEvaluationStatus();
    }

    window.addEventListener('evaluationStatusUpdate', handleUpdate)

    return () => {
      window.removeEventListener('evaluationStatusUpdate', handleUpdate)
    }
  }, [pacienteId])

  return status
}
