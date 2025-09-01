import { getPaciente, getSesionesDiarias } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CreateSesionForm } from "@/components/create-sesion-form";
import { EditPacienteDialog } from "@/components/edit-paciente-dialog";
import { DeletePacienteDialog } from "@/components/delete-paciente-dialog";
import { EditSesionDialog } from "@/components/edit-sesion-dialog";
import { DeleteSesionDialog } from "@/components/delete-sesion-dialog";
import {
  Edit,
  Trash2,
  ArrowLeft,
  User,
  UserCheck,
  Calendar,
  Activity,
  Plus,
  Clock,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function PacienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  const sesiones = await getSesionesDiarias(id);

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

  const sesionesCompletadas = sesiones?.length || 0;
  const progreso = (sesionesCompletadas / paciente.sesiones_totales) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {paciente.nombre_paciente}
            </h1>
          </div>
        </div>

        {/* Información del paciente */}
        <Card className="mb-8 shadow-lg border-muted-foreground/20 overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  Información del Paciente
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Detalles y progreso del tratamiento
                </p>
              </div>
              <div className="flex gap-2">
                <EditPacienteDialog paciente={paciente}>
                  <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                </EditPacienteDialog>
                <DeletePacienteDialog paciente={paciente}>
                  <Button variant="destructive" size="sm" className="gap-2 shadow-sm">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </DeletePacienteDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kinesiólogo Responsable</p>
                  <p className="font-semibold text-lg">{paciente.nombre_kinesiologo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sesiones Programadas</p>
                  <p className="font-semibold text-lg">{paciente.sesiones_totales}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Progreso de sesiones
                    </span>
                    <span className="text-sm font-medium bg-muted px-2 py-1 rounded-full">
                      {sesionesCompletadas} de {paciente.sesiones_totales}
                    </span>
                  </div>
                  <Progress value={progreso} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progreso)}% completado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrar nueva sesión */}
        <Card className="mb-8 shadow-lg border-muted-foreground/20 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-green-600" />
              Registrar Nueva Sesión
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Agrega una nueva sesión al historial del paciente
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <CreateSesionForm pacienteId={paciente.id} />
          </CardContent>
        </Card>

        {/* Historial de sesiones */}
        <Card className="shadow-lg border-muted-foreground/20 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-blue-600" />
              Historial de Sesiones
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Registro completo de todas las sesiones realizadas
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {sesiones && sesiones.length > 0 ? (
              <div className="space-y-3">
                {/* Header de las cards */}
                <div className="hidden md:grid md:grid-cols-4 gap-4 px-4 py-2 bg-muted/30 rounded-lg border border-muted-foreground/10">
                  <div className="font-semibold text-sm text-muted-foreground">Fecha</div>
                  <div className="font-semibold text-sm text-muted-foreground">Hora</div>
                  <div className="font-semibold text-sm text-muted-foreground">Estado</div>
                  <div className="font-semibold text-sm text-muted-foreground">Acciones</div>
                </div>

                {/* Cards de sesiones */}
                {sesiones.map((sesion) => (
                  <Card
                    key={sesion.id}
                    className="hover:shadow-md transition-all duration-200 border-muted-foreground/20 hover:border-primary/30"
                  >
                    <CardContent className="p-4">
                      {/* Mobile: estructura vertical, Desktop: grid */}
                      <div className="flex flex-col gap-4 md:grid md:grid-cols-4 md:items-center">
                        {/* Fecha */}
                        <div className="flex items-center md:block gap-2">
                          <span className="text-xs text-muted-foreground font-medium w-20 shrink-0 md:hidden">
                            Fecha
                          </span>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm md:text-base">{sesion.fecha}</span>
                          </div>
                        </div>

                        {/* Hora */}
                        <div className="flex items-center md:block gap-2">
                          <span className="text-xs text-muted-foreground font-medium w-20 shrink-0 md:hidden">
                            Hora
                          </span>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm md:text-base">{sesion.hora}</span>
                          </div>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center md:block gap-2">
                          <span className="text-xs text-muted-foreground font-medium w-20 shrink-0 md:hidden">
                            Estado
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-sm font-semibold ${sesion.sentimiento === "verde"
                                ? "bg-green-500/70"
                                : sesion.sentimiento === "amarillo"
                                  ? "bg-yellow-500/70"
                                  : "bg-red-500/70"
                              }`}
                          >
                            {sesion.sentimiento === "verde" && "Verde"}
                            {sesion.sentimiento === "amarillo" && "Amarillo"}
                            {sesion.sentimiento === "rojo" && "Rojo"}
                          </Badge>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center md:block gap-2">
                          <span className="text-xs text-muted-foreground font-medium w-20 shrink-0 md:hidden">
                            Acciones
                          </span>
                          <div className="flex gap-2">
                            <EditSesionDialog sesion={sesion}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 shadow-sm"
                              >
                                <Edit className="h-3 w-3" />
                                <span className="hidden lg:inline">Editar</span>
                              </Button>
                            </EditSesionDialog>
                            <DeleteSesionDialog sesion={sesion}>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1 shadow-sm"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="hidden lg:inline">Eliminar</span>
                              </Button>
                            </DeleteSesionDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay sesiones registradas</h3>
                <p className="text-muted-foreground">
                  Comienza registrando la primera sesión del paciente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}