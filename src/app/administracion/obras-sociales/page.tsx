import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getObrasSociales } from "@/lib/actions";
import { CreateObraSocialDialog } from "@/components/create-obra-social-dialog";
import { EditObraSocialDialog } from "@/components/edit-obra-social-dialog";
import { DeleteObraSocialDialog } from "@/components/delete-obra-social-dialog";

export default async function ObrasSocialesPage() {
  const obrasSocialesResult = await getObrasSociales();
  const obrasSociales = obrasSocialesResult.success ? obrasSocialesResult.data : [];
  
  // Asegurar que obrasSociales siempre sea un array
  const obrasSocialesArray = Array.isArray(obrasSociales) ? obrasSociales : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
          <Link href="/administracion" className="flex items-center space-x-4 mb-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        <div className="flex items-center space-x-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Obras Sociales
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona las obras sociales disponibles en el sistema
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {obrasSocialesArray.length} obra{obrasSocialesArray.length !== 1 ? 's' : ''} social{obrasSocialesArray.length !== 1 ? 'es' : ''} registrada{obrasSocialesArray.length !== 1 ? 's' : ''}
            </span>
          </div>
          <CreateObraSocialDialog />
        </div>
      </div>

      {obrasSocialesArray.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay obras sociales registradas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Comienza agregando la primera obra social al sistema
            </p>
            <CreateObraSocialDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {obrasSocialesArray.map((obraSocial) => (
            <Card key={obraSocial.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{obraSocial.nombre}</CardTitle>
                  </div>
                  <Badge variant="secondary">Activa</Badge>
                </div>
                {obraSocial.descripcion && (
                  <CardDescription className="mt-2">
                    {obraSocial.descripcion}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <EditObraSocialDialog obraSocial={obraSocial} />
                  <DeleteObraSocialDialog obraSocial={obraSocial} />
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Creada: {new Date(obraSocial.created_at || '').toLocaleDateString('es-ES')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
