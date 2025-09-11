import { getPacientesConBusqueda } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { DateFilter } from "@/components/date-filter";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { PaginationControls } from "@/components/pagination-controls";
import { ExportExcelButton } from "@/components/export-excel-button";
import { Suspense } from "react";
import { ProtectedPage } from "@/components/protected-page";
import { EditPacienteDialog } from "@/components/edit-paciente-dialog";
import { DeletePacienteDialog } from "@/components/delete-paciente-dialog";
import {
  Plus,
  Users,
  Calendar,
  Trash2,
  Eye,
  Activity,
  Edit,
  Info,
  AlertTriangle,
  CreditCard,
  Building
} from "lucide-react";

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const startDate = typeof params.startDate === 'string' ? params.startDate : undefined;
  const endDate = typeof params.endDate === 'string' ? params.endDate : undefined;
  const searchQuery = typeof params.search === 'string' ? params.search : undefined;
  const categoriaId = typeof params.categoria === 'string' ? params.categoria : undefined;
  const currentPage = typeof params.page === 'string' ? parseInt(params.page) : 1;

  const pageSize = 9; // 3x3 grid
  const result = await getPacientesConBusqueda(startDate, endDate, searchQuery, categoriaId, currentPage, pageSize);
  const { pacientes, total, totalPages } = result;

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <main>
          <div className="container mx-auto py-8 px-4 md:px-6">

        {/* Título principal y botones */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Gestión de Pacientes
            </h1>
            <p className="text-muted-foreground text-lg">
              Administra y monitorea el progreso de tus pacientes
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Mostrando pacientes creados en los últimos 12 meses
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <ExportExcelButton />
            <Link href="/paciente/nuevo">
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-5 w-5" />
                Nuevo Paciente
              </Button>
            </Link>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <SearchBar />
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Suspense fallback={
                <div className="flex items-center gap-2 text-muted-foreground h-10">
                  <Calendar className="h-4 w-4 animate-spin" />
                  Cargando categorías...
                </div>
              }>
                <CategoryFilter />
              </Suspense>
              <Suspense fallback={
                <div className="flex items-center gap-2 text-muted-foreground h-10">
                  <Calendar className="h-4 w-4 animate-spin" />
                  Cargando filtros...
                </div>
              }>
                <DateFilter />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Información de resultados */}
        {total > 0 && (
          <div className="mb-6 text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} de {total} pacientes
          </div>
        )}

        {/* Contenido principal */}
        {pacientes && pacientes.length > 0 ? (
          <div className="space-y-6">
            {/* Grid de pacientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pacientes.map((paciente) => (
                <Card 
                  key={paciente.id} 
                  className={`group hover:shadow-lg transition-all duration-200 border-muted-foreground/20 overflow-hidden ${
                    paciente.evaluacionPendiente ? 'border-orange-300 bg-orange-50/30' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {paciente.nombre_paciente}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {paciente.evaluacionPendiente && (
                          <div className="p-2 bg-orange-100 rounded-full" title="Evaluación post-sesión pendiente">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                        <div className="p-2 bg-muted rounded-full">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium capitalize">
                            {paciente.tipo_paciente === "obra_social" ? "Obra Social" : "Particular"}
                          </span>
                        </div>
                        
                        {paciente.tipo_paciente === "obra_social" && paciente.obra_social && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Obra Social:</span>
                            <span className="font-medium">{paciente.obra_social}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Progreso de sesiones
                          </span>
                          <span className="text-sm font-medium bg-muted px-2 py-1 rounded-full">
                            {paciente.sesiones_completadas} de {paciente.sesiones_totales}
                          </span>
                        </div>
                        <Progress
                          value={(paciente.sesiones_completadas / paciente.sesiones_totales) * 100}
                          className="h-3"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 w-full">
                      <Link href={`/paciente/${paciente.id}`} className="flex-1 min-w-[150px]">
                        <Button variant="outline" className="w-full gap-2 group/btn">
                          <Eye className="group-hover/btn:scale-110 transition-transform" />
                          Ver detalles
                        </Button>
                      </Link>

                      <EditPacienteDialog paciente={paciente}>
                        <div className="flex-1 min-w-[150px]">
                          <Button variant="secondary" className="w-full gap-2 group/btn">
                            <Edit className="group-hover/btn:scale-110 transition-transform" />
                            Editar
                          </Button>
                        </div>
                      </EditPacienteDialog>

                      <DeletePacienteDialog paciente={paciente}>
                        <div className="flex-1 min-w-[150px]">
                          <Button variant="destructive" className="w-full gap-2 group/btn">
                            <Trash2 className="group-hover/btn:scale-110 transition-transform" />
                            Eliminar
                          </Button>
                        </div>
                      </DeletePacienteDialog>
                    </div>


                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex justify-center">
              <PaginationControls currentPage={currentPage} totalPages={totalPages} />
            </div>
          </div>
        ) : (
          <Card className="border-muted-foreground/20 shadow-sm">
            <CardContent className="text-center py-16">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No se encontraron pacientes</h3>
                  {(startDate || endDate || searchQuery || categoriaId) && (
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {searchQuery
                        ? `No hay pacientes que coincidan con "${searchQuery}"`
                        : categoriaId && categoriaId !== 'todas'
                        ? "No hay pacientes en la categoría seleccionada."
                        : "No hay pacientes creados en el rango de fechas seleccionado."
                      }
                    </p>
                  )}
                  {!startDate && !endDate && !searchQuery && !categoriaId && (
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No hay pacientes creados en los últimos 12 meses. Comienza agregando tu primer paciente.
                    </p>
                  )}
                </div>
                <Link href="/paciente/nuevo">
                  <Button className="gap-2 mt-4">
                    <Plus className="h-4 w-4" />
                    Agregar primer paciente
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </main>
      </div>
    </ProtectedPage>
  );
}
