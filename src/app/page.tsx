import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FolderOpen, Users, BarChart3, Settings, Info } from "lucide-react";
import Link from "next/link";
import { getEstadisticasAdministracion } from "@/lib/actions";
import { ProtectedPage } from "@/components/protected-page";

export default async function Home() {
  const estadisticasResult = await getEstadisticasAdministracion();
  const estadisticas = estadisticasResult.success ? estadisticasResult.data : { obrasSociales: 0, categorias: 0, pacientes: 0 };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <main>
          <div className="container mx-auto py-8 px-4 md:px-6">
            {/* Título principal */}
            <div className="mb-10">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Administración
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gestiona las configuraciones del sistema y datos maestros
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Configuración y gestión de datos del sistema
                </div>
              </div>
            </div>

            {/* Grid de administración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* Obras Sociales */}
              <Card className="group hover:shadow-lg transition-all duration-200 border-muted-foreground/20 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">Obras Sociales</CardTitle>
                  </div>
                  <CardDescription>
                    Gestiona las obras sociales disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/administracion/obras-sociales">
                    <Button className="w-full gap-2 group/btn">
                      <Settings className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      Administrar Obras Sociales
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Categorías */}
              <Card className="group hover:shadow-lg transition-all duration-200 border-muted-foreground/20 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <FolderOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">Categorías</CardTitle>
                  </div>
                  <CardDescription>
                    Organiza los pacientes por categorías
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/administracion/categorias">
                    <Button className="w-full gap-2 group/btn">
                      <Settings className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      Administrar Categorías
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pacientes */}
              <Card className="group hover:shadow-lg transition-all duration-200 border-muted-foreground/20 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">Pacientes</CardTitle>
                  </div>
                  <CardDescription>
                    Gestiona la información de los pacientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/pacientes">
                    <Button variant="outline" className="w-full gap-2 group/btn">
                      <Users className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      Ver Pacientes
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Estadísticas */}
              <Card className="group hover:shadow-lg transition-all duration-200 border-muted-foreground/20 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">Estadísticas</CardTitle>
                  </div>
                  <CardDescription>
                    Visualiza estadísticas y reportes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/estadisticas">
                    <Button variant="outline" className="w-full gap-2 group/btn">
                      <BarChart3 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                      Ver Estadísticas
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Información del Sistema */}
            <div className="mt-10">
              <Card className="border-muted-foreground/20 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Información del Sistema</CardTitle>
                  <CardDescription>
                    Resumen de la configuración actual del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{estadisticas.obrasSociales}</div>
                      <div className="text-sm text-muted-foreground">
                        Obras Sociales Registradas
                      </div>
                    </div>
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-3xl font-bold text-green-600 mb-2">{estadisticas.categorias}</div>
                      <div className="text-sm text-muted-foreground">
                        Categorías Creadas
                      </div>
                    </div>
                    <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{estadisticas.pacientes}</div>
                      <div className="text-sm text-muted-foreground">
                        Pacientes Activos
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
