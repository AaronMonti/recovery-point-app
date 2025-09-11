import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCategorias } from "@/lib/actions";
import { CreateCategoriaDialog } from "@/components/create-categoria-dialog";
import { EditCategoriaDialog } from "@/components/edit-categoria-dialog";
import { DeleteCategoriaDialog } from "@/components/delete-categoria-dialog";

export default async function CategoriasPage() {
  const categoriasResult = await getCategorias();
  const categorias = categoriasResult.success ? categoriasResult.data : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/administracion">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Categorías
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Organiza los pacientes por categorías para mejor gestión
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {categorias?.length || 0} categoría{(categorias?.length || 0) !== 1 ? 's' : ''} registrada{(categorias?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <CreateCategoriaDialog />
        </div>
      </div>

      {(categorias?.length || 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay categorías registradas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Comienza agregando la primera categoría al sistema
            </p>
            <CreateCategoriaDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias?.map((categoria) => (
            <Card key={categoria.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">{categoria.nombre}</CardTitle>
                  </div>
                  <Badge variant="secondary">Activa</Badge>
                </div>
                {categoria.descripcion && (
                  <CardDescription className="mt-2">
                    {categoria.descripcion}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <EditCategoriaDialog categoria={categoria} />
                  <DeleteCategoriaDialog categoria={categoria} />
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Creada: {new Date(categoria.created_at || '').toLocaleDateString('es-ES')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
