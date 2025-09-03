import { getPaciente, getEvaluacionesPorPaciente } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ClipboardList, TrendingUp, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function HistorialEvaluaciones({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  const evaluaciones = await getEvaluacionesPorPaciente(id);

  if (!paciente) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4 md:px-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Paciente no encontrado</h1>
          <Link href="/">
            <Button variant="outline" className="mt-4">Volver al listado</Button>
          </Link>
        </div>
      </main>
    );
  }

  const parsearEvaluacion = (evaluacion: any) => {
    try {
      const respuestas = JSON.parse(evaluacion.respuestasComprimidas);
      const promedios = JSON.parse(evaluacion.promediosComprimidos);
      
      const tieneEvaluacionPre = respuestas.some((r: any) => r.questionId.includes('_pre'));
      const tieneEvaluacionPost = respuestas.some((r: any) => r.questionId.includes('_post'));
      
      return {
        tipo: tieneEvaluacionPre ? 'Pre-sesión' : 'Post-sesión',
        respuestas,
        promedios,
        fecha: evaluacion.fecha,
        sesionFecha: evaluacion.sesionFecha,
        sesionHora: evaluacion.sesionHora
      };
    } catch (error) {
      console.error('Error parsing evaluation:', error);
      return null;
    }
  };

  const evaluacionesParseadas = evaluaciones
    .map(parsearEvaluacion)
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6 max-w-6xl">
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
              Historial de Evaluaciones - {paciente.nombre_paciente}
            </h1>
          </div>
        </div>

        {/* Contenido */}
        <div className="space-y-6">
          {evaluacionesParseadas.length > 0 ? (
            <div className="grid gap-6">
              {evaluacionesParseadas.map((evaluacion, index) => (
                <Card key={index} className="shadow-lg border-muted-foreground/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                          {evaluacion.tipo} - Sesión del {evaluacion.sesionFecha}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          Evaluación realizada el {evaluacion.fecha} para la sesión de las {evaluacion.sesionHora}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {evaluacion.tipo}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Promedios */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(evaluacion.promedios).map(([key, value]) => (
                          <div key={key} className="bg-muted/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium text-muted-foreground capitalize">
                                {key === 'dolor' ? 'Dolor' : 
                                 key === 'movilidad' ? 'Movilidad' : 
                                 key === 'energia' ? 'Energía' : 
                                 key === 'satisfaccion' ? 'Satisfacción' : key}
                              </span>
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {value}/10
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Respuestas detalladas */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Respuestas detalladas:</h4>
                        <div className="grid gap-2">
                          {evaluacion.respuestas.map((respuesta: any, respIndex: number) => {
                            const pregunta = respuesta.questionId.includes('dolor') ? 'Dolor' :
                                           respuesta.questionId.includes('movilidad') ? 'Movilidad' :
                                           respuesta.questionId.includes('energia') ? 'Energía' :
                                           respuesta.questionId.includes('satisfaccion') ? 'Satisfacción' : 'Otro';
                            
                            return (
                              <div key={respIndex} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                                <span className="text-sm">{pregunta}</span>
                                <span className="font-semibold text-primary">{respuesta.value}/10</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-muted-foreground/20">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay evaluaciones registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Este paciente aún no tiene evaluaciones registradas. Las evaluaciones aparecerán aquí una vez que se completen.
                </p>
                <Link href={`/paciente/${id}`}>
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al paciente
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
