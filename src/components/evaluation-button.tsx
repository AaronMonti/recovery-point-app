"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, Clock, CheckCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEvaluationStatus } from "@/lib/hooks/useEvaluationStatus"
import { useMemo } from "react"

interface EvaluationButtonProps {
  pacienteId: string
}

function AverageDisplay({ average, label }: { average: number; label: string }) {
  const getAverageColor = (avg: number) => {
    if (avg >= 8) return "text-green-600 bg-green-50 border-green-200"
    if (avg >= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    if (avg >= 4) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  return (
    <div className={`px-3 py-2 rounded-lg border ${getAverageColor(average)}`}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <div className="text-center">
          <div className="text-xs font-medium">{label}</div>
          <div className="text-lg font-bold">{average}/10</div>
        </div>
      </div>
    </div>
  )
}

export function EvaluationButton({ pacienteId }: EvaluationButtonProps) {
  const status = useEvaluationStatus(pacienteId)

  // Memoizar el contenido para evitar re-renders innecesarios
  const memoizedContent = useMemo(() => {
    // Mostrar loading si está cargando
    if (status.isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando evaluaciones...</span>
        </div>
      )
    }

    // Si no hay sesiones, mostrar mensaje
    if (!status.ultimaSesion) {
      return (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay sesiones disponibles</h3>
          <p className="text-muted-foreground">
            Debes crear una sesión antes de realizar evaluaciones.
          </p>
        </div>
      )
    }

    // Renderizar botón según el estado
    const renderButton = () => {
      // Si no se ha hecho la pre-evaluación
      if (!status.preCompleted) {
        return (
          <Link href={`/paciente/${pacienteId}/evaluacion?tipo=pre`} className="w-full">
            <Button variant="default" className="w-full h-12 gap-2 shadow-lg hover:shadow-xl ">
              <ClipboardList className="h-4 w-4" />
              Evaluación Pre-Sesión
            </Button>
          </Link>
        )
      }

      // Si se puede hacer la post-evaluación
      if (status.canDoPost) {
        return (
          <div className="flex flex-col gap-1">
            <Link href={`/paciente/${pacienteId}/evaluacion?tipo=post`} className="w-full">
              <Button variant="default" className="w-full h-12 gap-2 shadow-sm bg-orange-400 hover:bg-orange-500">
                <Clock className="h-4 w-4" />
                Evaluación Post-Sesión
              </Button>
            </Link>
          </div>
        )
      }

      // Si ambas evaluaciones están completas
      if (status.postCompleted) {
        return (
          <Button variant="outline" className="w-full h-12 gap-2 shadow-sm" disabled>
            <CheckCircle className="h-4 w-4 text-green-600" />
            Evaluaciones Completas
          </Button>
        )
      }

      // Fallback
      return (
        <Link href={`/paciente/${pacienteId}/evaluacion?tipo=pre`} className="w-full">
          <Button variant="default" className="w-full h-12 gap-2 shadow-sm">
            <ClipboardList className="h-4 w-4" />
            Evaluación
          </Button>
        </Link>
      )
    }

    return (
      <div className="space-y-4">
        {/* Información de la última sesión */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Última sesión: {status.ultimaSesion.fecha} - {status.ultimaSesion.hora}</h3>
                <p className="text-sm text-muted-foreground">
                  Estado: {status.ultimaSesion.sentimiento === "verde" && "Verde"}
                {status.ultimaSesion.sentimiento === "amarillo" && "Amarillo"}
                {status.ultimaSesion.sentimiento === "rojo" && "Rojo"}
                </p>
              </div>
              <Badge
                className={`text-sm font-semibold ${
                  status.ultimaSesion.sentimiento === 'verde'
                    ? 'bg-green-500/70 text-white'
                    : status.ultimaSesion.sentimiento === 'amarillo'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {status.ultimaSesion.sentimiento === "verde" && "Verde"}
                {status.ultimaSesion.sentimiento === "amarillo" && "Amarillo"}
                {status.ultimaSesion.sentimiento === "rojo" && "Rojo"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="w-full">
          {renderButton()}
        </div>
      </div>
    )
  }, [status, pacienteId])

  return memoizedContent
}
