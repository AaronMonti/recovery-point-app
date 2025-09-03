"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, ArrowRight, CheckCircle, Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createEvaluacion, getUltimaSesion, getEvaluacionesPorSesion } from "@/lib/actions"

interface Question {
  id: string
  text: string
  description?: string
}

interface EvaluationResponse {
  questionId: string
  value: number
}

interface PatientEvaluationFormProps {
  pacienteId: string
  pacienteNombre: string
  evaluationType: 'pre' | 'post'
}

const preQuestions: Question[] = [
  {
    id: "stress_pre",
    text: "¿Cuán estresado estás hoy?",
    description: "0 = Sin estrés, 10 = Extremadamente estresado"
  },
  {
    id: "sueno_pre",
    text: "¿Cómo dormiste anoche?",
    description: "0 = Muy mal, 10 = Excelente"
  },
  {
    id: "fatiga_pre",
    text: "¿Qué tan fatigado estás hoy?",
    description: "0 = Sin fatiga, 10 = Extremadamente fatigado"
  },
  {
    id: "dolor_muscular_pre",
    text: "¿Cuánto te duelen los músculos?",
    description: "0 = Sin dolor, 10 = Dolor extremo"
  }
]

const postQuestions: Question[] = [
  {
    id: "percepcion_esfuerzo_post",
    text: "¿Qué tan intensa sentiste la sesión de hoy?",
    description: "0 = Muy suave, 10 = Extremadamente intensa"
  },
  {
    id: "eva_post",
    text: "¿Con cuánto dolor terminaste?",
    description: "0 = Sin dolor, 10 = Dolor extremo"
  },
  {
    id: "minutos_sesion_post",
    text: "Minutos de sesión:",
    description: "Ingresa la duración de la sesión en minutos"
  }
]

export function PatientEvaluationForm({ pacienteId, pacienteNombre, evaluationType }: PatientEvaluationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<EvaluationResponse[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ultimaSesion, setUltimaSesion] = useState<any>(null)
  const [evaluacionesExistentes, setEvaluacionesExistentes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const questions = evaluationType === 'pre' ? preQuestions : postQuestions
  const totalSteps = questions.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener la última sesión del paciente
        const sesion = await getUltimaSesion(pacienteId)
        if (!sesion) {
          toast.error("No se encontró ninguna sesión para este paciente")
          return
        }
        setUltimaSesion(sesion)

        // Verificar si ya existe una evaluación para esta sesión
        const evaluaciones = await getEvaluacionesPorSesion(sesion.id)
        setEvaluacionesExistentes(evaluaciones)

        // Si ya existe una evaluación del mismo tipo, mostrar advertencia
        const evaluacionExistente = evaluaciones.find(evaluacion => {
          const respuestas = JSON.parse(evaluacion.respuestasComprimidas)
          const tieneEvaluacionPre = respuestas.some((r: any) => r.questionId.includes('_pre'))
          const tieneEvaluacionPost = respuestas.some((r: any) => r.questionId.includes('_post'))
          
          return (evaluationType === 'pre' && tieneEvaluacionPre) || 
                 (evaluationType === 'post' && tieneEvaluacionPost)
        })

        if (evaluacionExistente) {
          toast.warning(`Ya existe una ${evaluationType === 'pre' ? 'pre' : 'post'}-evaluación para esta sesión`)
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
        toast.error("Error al cargar los datos de la sesión")
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [pacienteId, evaluationType])

  const getCurrentResponse = () => {
    const existingResponse = responses.find(r => r.questionId === questions[currentStep].id);
    if (questions[currentStep].id === 'minutos_sesion_post') {
      return existingResponse?.value ?? 0;
    }
    return existingResponse?.value ?? 5;
  }

  const updateResponse = (value: number) => {
    setResponses(prev => {
      const existing = prev.findIndex(r => r.questionId === questions[currentStep].id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].value = value;
        return updated;
      } else {
        return [...prev, { questionId: questions[currentStep].id, value }];
      }
    })
  }

  const goToNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const calcularPromedios = (respuestasParaCalcular: EvaluationResponse[] = responses) => {
    const promedios = {
      stress: 0,
      sueno: 0,
      fatiga: 0,
      dolorMuscular: 0,
      percepcionEsfuerzo: 0,
      eva: 0,
      minutosSesion: 0
    }

    respuestasParaCalcular.forEach(response => {
      if (response.questionId.includes('stress')) {
        promedios.stress = response.value
      } else if (response.questionId.includes('sueno')) {
        promedios.sueno = response.value
      } else if (response.questionId.includes('fatiga')) {
        promedios.fatiga = response.value
      } else if (response.questionId.includes('dolor_muscular')) {
        promedios.dolorMuscular = response.value
      } else if (response.questionId.includes('percepcion_esfuerzo')) {
        promedios.percepcionEsfuerzo = response.value
      } else if (response.questionId.includes('eva')) {
        promedios.eva = response.value
      } else if (response.questionId.includes('minutos_sesion')) {
        promedios.minutosSesion = response.value
      }
    })

    return promedios
  }

  const handleSubmit = async () => {
    if (!ultimaSesion) {
      toast.error("No se encontró la sesión para guardar la evaluación")
      return
    }

    // Asegurar que todas las preguntas tengan respuesta
    const respuestasCompletas = questions.map(question => {
      const respuestaExistente = responses.find(r => r.questionId === question.id);
      if (question.id === 'minutos_sesion_post') {
        return respuestaExistente || { questionId: question.id, value: 0 };
      }
      return respuestaExistente || { questionId: question.id, value: 5 };
    });

    setIsSubmitting(true)
    
    try {
      const fecha = new Date().toISOString().split('T')[0]
      const respuestasComprimidas = JSON.stringify(respuestasCompletas)
      const promediosComprimidos = JSON.stringify(calcularPromedios(respuestasCompletas))

      const result = await createEvaluacion({
        pacienteId,
        sesionId: ultimaSesion.id,
        fecha,
        respuestasComprimidas,
        promediosComprimidos
      })

      if (result.success) {
        toast.success(result.message)
        // Redirigir de vuelta a los detalles del paciente
        window.location.href = `/paciente/${pacienteId}`
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Error al guardar la evaluación")
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (!ultimaSesion) {
    return (
      <Card className="border-2 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">No hay sesiones disponibles</h3>
              <p className="text-sm text-muted-foreground">
                Este paciente no tiene sesiones registradas. Debes crear una sesión antes de realizar la evaluación.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isLastStep = currentStep === totalSteps - 1
  const currentQuestion = questions[currentStep]

  return (
    <div className="space-y-6">
      {/* Información de la sesión */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Sesión: {ultimaSesion.fecha} - {ultimaSesion.hora}</h3>
              <p className="text-sm text-muted-foreground">
                {evaluationType === 'pre' ? 'Pre-evaluación' : 'Post-evaluación'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Sentimiento</div>
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                ultimaSesion.sentimiento === 'verde' ? 'bg-green-100 text-green-800' :
                ultimaSesion.sentimiento === 'amarillo' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {ultimaSesion.sentimiento}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Pregunta {currentStep + 1} de {totalSteps}
          </span>
          <span className="text-sm font-medium">
            {Math.round(progress)}% Completado
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion.text}
          </CardTitle>
          {currentQuestion.description && (
            <p className="text-muted-foreground">
              {currentQuestion.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Slider Section */}
          <div className="space-y-6">
            {currentQuestion.id === 'minutos_sesion_post' ? (
              // Input especial para minutos de sesión
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {getCurrentResponse()} minutos
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ingresa la duración de la sesión
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={getCurrentResponse()}
                    onChange={(e) => updateResponse(parseInt(e.target.value) || 0)}
                    className="w-32 text-center text-2xl font-bold border-2 border-primary/20 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              // Slider normal para las otras preguntas
              <>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {getCurrentResponse()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Arrastra el control para seleccionar tu respuesta
                  </p>
                </div>
                
                <div className="px-4 py-12 md:py-8">
                  <Slider
                    value={getCurrentResponse()}
                    onValueChange={updateResponse}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Finalizar
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goToNext}
                className="gap-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary of responses so far */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Estado de Respuestas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Todas las preguntas serán respondidas. Si no mueves el slider, se usará el valor por defecto (5/10).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {questions.map((question, index) => {
              const response = responses.find(r => r.questionId === question.id);
              const hasResponse = response !== undefined;
              
              return (
                <div key={question.id} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{question.text}</span>
                    {hasResponse ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span className={`font-semibold ${hasResponse ? 'text-primary' : 'text-muted-foreground'}`}>
                    {hasResponse ? (
                      question.id === 'minutos_sesion_post' 
                        ? `${response.value} minutos` 
                        : `${response.value}/10`
                    ) : (
                      question.id === 'minutos_sesion_post' 
                        ? '0 minutos (por defecto)' 
                        : '5/10 (por defecto)'
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
