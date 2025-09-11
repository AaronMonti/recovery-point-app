import { getPaciente, getEvaluacionesPorSesion } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Calendar, Clock, Activity } from "lucide-react";
import { PatientEvaluationForm } from "@/components/patient-evaluation-form";
import { Badge } from "@/components/ui/badge";

interface EvaluationResponse {
  questionId: string;
  value: number;
  questionText?: string;
  answer?: string;
}

export default async function EvaluacionPaciente({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params;
  const { tipo, sesionId } = await searchParams;
  const evaluationType = (tipo === 'post') ? 'post' : 'pre';
  const paciente = await getPaciente(id);

  if (!paciente) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4 md:px-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Paciente no encontrado</h1>
          <Link href="/pacientes">
            <Button variant="outline" className="mt-4">Volver al listado</Button>
          </Link>
        </div>
      </main>
    );
  }

  // Si hay sesionId, obtener la evaluación de esa sesión
  let evaluacionSesion = null;
  if (sesionId && typeof sesionId === 'string') {
    const evaluaciones = await getEvaluacionesPorSesion(sesionId);
    if (evaluaciones.length > 0) {
      evaluacionSesion = evaluaciones[0];
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6 max-w-4xl">
        {/* Header con navegación */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/paciente/${id}`}>
            <Button variant="outline" size="sm" className="gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {evaluacionSesion ? 'Evaluación de Sesión' : (evaluationType === 'pre' ? 'Pre-evaluación' : 'Post-evaluación')} de {paciente.nombre_paciente}
            </h1>
          </div>
        </div>

        {/* Si hay evaluación de sesión, mostrarla */}
        {evaluacionSesion ? (
          <Card className="shadow-lg border-muted-foreground/20 overflow-hidden mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardList className="h-5 w-5 text-primary" />
                Detalles de la Evaluación
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Evaluación realizada para esta sesión
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Información de la evaluación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Evaluación</p>
                      <p className="font-semibold">{evaluacionSesion.fecha}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Promedio General</p>
                      <p className="font-semibold text-lg">
                        {(() => {
                          try {
                            const promedios = JSON.parse(evaluacionSesion.promediosComprimidos);
                            
                            // Calcular promedios pre y post por separado para ser consistente
                            const valoresPre = Object.entries(promedios)
                              .filter(([key, val]) => 
                                (key === 'stress' || key === 'sueno' || key === 'fatiga' || key === 'dolorMuscular') && 
                                typeof val === 'number'
                              )
                              .map(([, val]) => val as number);
                              
                            const valoresPost = Object.entries(promedios)
                              .filter(([key, val]) => 
                                (key === 'percepcionEsfuerzo' || key === 'eva') && 
                                typeof val === 'number'
                              )
                              .map(([, val]) => val as number);
                            
                            let promedioPre = 0;
                            let promedioPost = 0;
                            let count = 0;
                            
                            if (valoresPre.length > 0) {
                              promedioPre = valoresPre.reduce((sum, val) => sum + val, 0) / valoresPre.length;
                              count++;
                            }
                            
                            if (valoresPost.length > 0) {
                              promedioPost = valoresPost.reduce((sum, val) => sum + val, 0) / valoresPost.length;
                              count++;
                            }
                            
                            if (count > 0) {
                              const promedioGeneral = (promedioPre + promedioPost) / count;
                              return Math.round(promedioGeneral * 100) / 100;
                            }
                            return 'N/A';
                          } catch (error) {
                            return 'N/A';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalles de promedios por categoría */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Respuestas Registradas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(() => {
                      try {
                        const promedios = JSON.parse(evaluacionSesion.promediosComprimidos);
                        
                        // Mapeo de nombres de categorías a etiquetas más legibles
                        const categoriaLabels: { [key: string]: { label: string, tipo: 'pre' | 'post' | 'neutral' } } = {
                          stress: { label: 'Estrés', tipo: 'pre' },
                          sueno: { label: 'Calidad del Sueño', tipo: 'pre' },
                          fatiga: { label: 'Fatiga', tipo: 'pre' },
                          dolorMuscular: { label: 'Dolor Muscular', tipo: 'pre' },
                          percepcionEsfuerzo: { label: 'Percepción de Esfuerzo', tipo: 'post' },
                          eva: { label: 'Dolor Post-Sesión (EVA)', tipo: 'post' },
                          minutosSesion: { label: 'Duración de Sesión', tipo: 'neutral' }
                        };

                        return Object.entries(promedios)
                          .filter(([categoria]) => categoria !== 'inicioSesion') // Filtrar inicioSesion
                          .map(([categoria, promedio]) => {
                            const info = categoriaLabels[categoria];
                            const label = info?.label || categoria.replace(/([A-Z])/g, ' $1').trim();
                            const tipo = info?.tipo || 'neutral';
                            
                            return (
                              <div key={categoria} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary/30">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {tipo === 'pre' ? 'Pre-sesión' : tipo === 'post' ? 'Post-sesión' : 'Información'}
                                  </span>
                                </div>
                                <Badge 
                                  variant={tipo === 'neutral' ? 'outline' : 'secondary'} 
                                  className="font-semibold"
                                >
                                  {typeof promedio === 'number' ? (
                                    categoria === 'minutosSesion' ? 
                                      `${Math.round(promedio)} min` : 
                                      `${Math.round(promedio * 100) / 100}/10`
                                  ) : 'N/A'}
                                </Badge>
                              </div>
                            );
                          });
                      } catch (error) {
                        return <p className="text-muted-foreground">No se pudieron cargar las respuestas</p>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Formulario de evaluación */
        <Card className="shadow-lg border-muted-foreground/20 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ClipboardList className="h-5 w-5 text-primary" />
              {evaluationType === 'pre' ? 'Evaluación antes de la sesión' : 'Evaluación después de la sesión'}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {evaluationType === 'pre' 
                ? 'Por favor, responde estas preguntas antes de comenzar la sesión de fisioterapia'
                : 'Por favor, responde estas preguntas después de completar la sesión de fisioterapia'
              }
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <PatientEvaluationForm 
              pacienteId={id} 
              pacienteNombre={paciente.nombre_paciente} 
              evaluationType={evaluationType}
            />
          </CardContent>
        </Card>
        )}
      </div>
    </main>
  );
}
